const test = require("node:test"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const records = new Map();
let counter = 0;
const store = {
  get: async (path) => {
    const record = records.get(path);
    return record
      ? {
          stream: new Blob([record.text]).stream(),
          blob: { etag: record.etag },
        }
      : null;
  },
  put: async (path, value, options) => {
    const old = records.get(path);
    if (old && !options.allowOverwrite) throw Error("Blob already exists");
    if (options.ifMatch && old?.etag !== options.ifMatch)
      throw Error("Precondition failed");
    const etag = String(++counter);
    records.set(path, { text: value, etag });
    return { etag };
  },
  list: async ({ prefix, limit = 100, cursor }) => {
    const all = [...records.keys()].filter((p) => p.startsWith(prefix)).sort(),
      start = Number(cursor || 0),
      end = start + limit;
    return {
      blobs: all.slice(start, end).map((pathname) => ({ pathname })),
      hasMore: end < all.length,
      cursor: String(end),
    };
  },
  del: async (path) => records.delete(path),
};
require.cache[require.resolve("@vercel/blob")] = { exports: store };
process.env.SESSION_SECRET = "upgrade-tests-only";
process.env.BLOB_READ_WRITE_TOKEN = "test-only";
process.env.ADMIN_USERNAME = "staff";
process.env.ADMIN_PASSWORD_HASH =
  "salt:" + crypto.scryptSync("test-password", "salt", 64).toString("hex");
for (const key of [
  "SMTP_HOST",
  "SMTP_PASS",
  "SMTP_USER",
  "MAIL_FROM",
  "MAIL_TO",
])
  delete process.env[key];
const c = require("../lib/core"),
  enquiry = require("../api/enquiry"),
  inbox = require("../api/inbox"),
  content = require("../api/content"),
  sessions = require("../api/session"),
  media = require("../api/media");
const staff = {
  type: "staff",
  id: "upgrade-session",
  mfa: true,
  exp: Date.now() + 3600000,
};
const headers = {
  cookie: `__Host-guru=${c.token(staff)}`,
  origin: "https://guru-school.vercel.app",
  "content-type": "application/json",
  "x-csrf-token": c.sign(staff.id),
};
async function run(handler, req = {}) {
  const res = {
    headers: {},
    statusCode: 200,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {},
  };
  await handler({ method: "GET", headers: {}, query: {}, ...req }, res);
  return res;
}
function submission(extra = {}) {
  return {
    token: c.token({
      type: "enquiry",
      nonce: crypto.randomBytes(24).toString("hex"),
      issued: Date.now() - 3000,
      exp: Date.now() + 3600000,
    }),
    name: "Test family",
    email: "parent@example.com",
    kind: "Book a school visit",
    date: "2099-01-01",
    message: "Please arrange a visit.",
    programme: "Early years",
    ...extra,
  };
}
function smtp() {
  Object.assign(process.env, {
    SMTP_HOST: "smtp.example.com",
    SMTP_USER: "sender@example.com",
    SMTP_PASS: "test-only",
    MAIL_FROM: "sender@example.com",
    MAIL_TO: "school@example.com",
  });
}
function noSmtp() {
  for (const key of [
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
    "MAIL_FROM",
    "MAIL_TO",
  ])
    delete process.env[key];
}
test("enquiry filters search names and messages, programme, status and Myanmar dates across pagination", async () => {
  for (let i = 0; i < 55; i++) {
    const id = crypto.randomUUID(),
      createdKey = String(1000000000000 + i);
    await c.write(`enquiries/${createdKey}-${id}.json`, {
      id,
      createdKey,
      name: i === 54 ? "Find this family" : "Other",
      email: "other@example.com",
      message: "A question",
      programme: "Lower primary",
      status: "new",
      created: "2026-10-12T01:00:00Z",
    });
  }
  const result = await run(inbox, {
    headers,
    query: {
      search: "find this",
      programme: "Lower primary",
      status: "new",
      from: "2026-10-12",
      to: "2026-10-12",
    },
  });
  assert.equal(result.body.items.length, 1);
  assert.equal(result.body.items[0].name, "Find this family");
  assert.equal(
    (await run(inbox, { headers, query: { from: "bad-date" } })).statusCode,
    400,
  );
  assert.equal(
    (
      await run(inbox, {
        headers,
        query: { to: "2026-10-11", search: "find this" },
      })
    ).body.items.length,
    0,
  );
});
test("school notification and parent acknowledgement use different recipients; retries send neither again", async () => {
  const nm = require("nodemailer"),
    original = nm.createTransport;
  const sent = [];
  smtp();
  nm.createTransport = () => ({
    sendMail: async (msg) => {
      sent.push(msg);
      return { accepted: [msg.to] };
    },
    close() {},
  });
  try {
    const body = submission({ kind: "General enquiry", date: "" });
    const response = await run(enquiry, { method: "POST", headers, body });
    assert.equal(response.statusCode, 200);
    assert.equal(sent.length, 2);
    assert.equal(sent[0].to, "school@example.com");
    assert.equal(sent[0].replyTo.address, "parent@example.com");
    assert.equal(sent[1].to, "parent@example.com");
    assert.match(sent[1].text, /saved for our admissions team/);
    await run(enquiry, { method: "POST", headers, body });
    assert.equal(sent.length, 2);
  } finally {
    nm.createTransport = original;
    noSmtp();
  }
});
test("scheduled news and images stay hidden until due; albums survive content updates", async () => {
  const imageId = crypto.randomUUID();
  await c.write(`media/${imageId}.json`, { id: imageId });
  const news = {
    id: crypto.randomUUID(),
    title: "Later",
    body: "Scheduled story",
    date: "2026-10-12",
    publishAt: "2099-01-01T09:00:00+06:30",
    published: true,
    imageId,
  };
  const photoId = crypto.randomUUID();
  await c.write(`media/${photoId}.json`, { id: photoId });
  const image = require("../lib/gallery.json")[0].image;
  const site = {
    announcement: "Hello",
    announcementMy: "",
    news: [news],
    photos: [
      {
        id: photoId,
        caption: "A memory",
        category: "graduation",
        published: true,
        album: "Graduation 2026",
      },
    ],
    existingAlbums: { [image]: "Trip 2026" },
  };
  const saved = await run(content, {
    method: "PUT",
    headers,
    body: { content: site, version: null },
  });
  assert.equal(saved.statusCode, 200);
  assert.equal((await run(content)).body.content.news.length, 0);
  assert.equal((await run(media, { query: { id: imageId } })).statusCode, 404);
  assert.equal(
    (await run(content)).body.content.photos[0].album,
    "Graduation 2026",
  );
  const past = {
    ...saved.body.content,
    news: [{ ...news, publishAt: "2020-01-01T09:00:00+06:30" }],
  };
  const result = await run(content, {
    method: "PUT",
    headers,
    body: { content: past, version: saved.body.version },
  });
  assert.equal(result.statusCode, 200);
  assert.equal((await run(content)).body.content.news.length, 1);
  assert.equal(
    (
      await run(content, {
        method: "PUT",
        headers,
        body: {
          content: { ...past, news: [{ ...news, publishAt: "not-a-time" }] },
          version: result.body.version,
        },
      })
    ).statusCode,
    400,
  );
});
test("production sign-in requires a delivered, expiring, one-use email code", async () => {
  const nm = require("nodemailer"),
    original = nm.createTransport,
    env = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  smtp();
  let code;
  nm.createTransport = () => ({
    sendMail: async (msg) => {
      code = msg.text.match(/code is (\d{6})/)[1];
      return { accepted: [msg.to] };
    },
    close() {},
  });
  try {
    const first = await run(sessions, {
      method: "POST",
      headers,
      body: { username: "staff", password: "test-password" },
    });
    assert.ok(first.body.challenge);
    assert.equal(first.headers["Set-Cookie"], undefined);
    const incorrect = await run(sessions, {
      method: "POST",
      headers,
      body: { challenge: first.body.challenge, code: "000000" },
    });
    assert.equal(incorrect.statusCode, 401);
    const correct = await run(sessions, {
      method: "POST",
      headers,
      body: { challenge: first.body.challenge, code },
    });
    assert.equal(correct.statusCode, 200);
    assert.match(correct.headers["Set-Cookie"], /HttpOnly/);
    assert.equal(correct.body.twoFactor, true);
    assert.equal(
      (
        await run(sessions, {
          method: "POST",
          headers,
          body: { challenge: first.body.challenge, code },
        })
      ).statusCode,
      401,
    );
    const expired = c.token({ type: "login-code", id: "unused", exp: 1 });
    assert.equal(
      (
        await run(sessions, {
          method: "POST",
          headers,
          body: { challenge: expired, code },
        })
      ).statusCode,
      401,
    );
    const oldCookie = c.token({ ...staff, mfa: false });
    assert.equal(
      (
        await run(inbox, {
          headers: { ...headers, cookie: `__Host-guru=${oldCookie}` },
        })
      ).statusCode,
      401,
    );
    noSmtp();
    assert.equal(
      (
        await run(sessions, {
          method: "POST",
          headers,
          body: { username: "staff", password: "test-password" },
        })
      ).statusCode,
      503,
    );
  } finally {
    nm.createTransport = original;
    noSmtp();
    if (env === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = env;
  }
});

test("UTF-8 comparisons and JSON byte/type limits fail safely", () => {
  assert.equal(c.equal("é", "a"), false);
  assert.equal(c.equal("é", "é"), true);
  assert.throws(
    () =>
      c.json({ headers: { "content-type": "application/jsonp" }, body: {} }),
    { status: 415 },
  );
  assert.deepEqual(
    c.json({
      headers: { "content-type": "application/json; charset=utf-8" },
      body: "{}",
    }),
    {},
  );
  assert.throws(
    () => c.json({ headers, body: "x".repeat(20) }, 10),
    /too large/,
  );
  assert.throws(
    () => c.json({ headers, body: { text: "é".repeat(10) } }, 20),
    /too large/,
  );
});
test("logout revokes captured cookies across all private endpoints", async () => {
  const id = crypto.randomUUID(),
    cookie = c.token({ ...staff, id });
  const privateHeaders = {
    ...headers,
    cookie: `__Host-guru=${cookie}`,
    "x-csrf-token": c.sign(id),
  };
  assert.equal(
    (await run(sessions, { headers: privateHeaders })).statusCode,
    200,
  );
  assert.equal(
    (await run(sessions, { method: "DELETE", headers: privateHeaders }))
      .statusCode,
    200,
  );
  for (const handler of [
    sessions,
    inbox,
    require("../api/health"),
    require("../api/analytics"),
  ])
    assert.equal(
      (await run(handler, { headers: privateHeaders })).statusCode,
      401,
    );
  assert.equal(
    (await run(content, { method: "PUT", headers: privateHeaders, body: {} }))
      .statusCode,
    401,
  );
});
test("malformed content entries and removed feature payloads are rejected", async () => {
  const current = await run(content, { headers });
  for (const entry of [null, [], 3])
    assert.equal(
      (
        await run(content, {
          method: "PUT",
          headers,
          body: {
            content: { ...current.body.content, news: [entry] },
            version: current.body.version,
          },
        })
      ).statusCode,
      400,
    );
  assert.equal(
    (
      await run(content, {
        method: "PUT",
        headers,
        body: { backupId: crypto.randomUUID(), version: current.body.version },
      })
    ).statusCode,
    400,
  );
  assert.equal(
    (
      await run(enquiry, {
        method: "POST",
        headers,
        body: submission({ slotId: crypto.randomUUID() }),
      })
    ).statusCode,
    400,
  );
  assert.equal(
    (
      await run(enquiry, {
        method: "POST",
        headers,
        body: submission({ phone: [] }),
      })
    ).statusCode,
    400,
  );
});
