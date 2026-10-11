const { get, put, list, del } = require("@vercel/blob");
const {
  randomBytes,
  createHmac,
  timingSafeEqual,
  scryptSync,
} = require("node:crypto");
const { Readable } = require("node:stream");
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const sign = (value) =>
  createHmac("sha256", process.env.SESSION_SECRET).update(value).digest("hex");
function equal(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function token(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}
function decode(value) {
  try {
    const [encoded, sig, ...rest] = String(value || "").split(".");
    if (rest.length || !equal(sig, sign(encoded))) return null;
    const data = JSON.parse(Buffer.from(encoded, "base64url"));
    return Number.isFinite(data.exp) && data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}
function session(req) {
  const value = String(req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("__Host-guru="))
    ?.slice(12);
  const data = decode(value);
  return data?.type === "staff" &&
    typeof data.id === "string" &&
    data.id.length > 0 &&
    data.id.length <= 100 &&
    !(process.env.NODE_ENV === "production" && !data.mfa)
    ? data
    : null;
}
function originOK(req) {
  return new Set([
    "https://guru.edu.mm",
    "https://guru-school.vercel.app",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173"] : []),
  ]).has(req.headers.origin);
}
function json(req, max = 250000) {
  if (
    String(req.headers["content-type"] || "")
      .split(";")[0]
      .trim()
      .toLowerCase() !== "application/json"
  )
    throw Object.assign(new Error("Use JSON."), { status: 415 });
  if (typeof req.body === "string" && Buffer.byteLength(req.body) > max)
    throw Object.assign(new Error("Request is too large or invalid."), {
      status: 400,
    });
  let data;
  try {
    data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    throw Object.assign(new Error("Invalid request."), { status: 400 });
  }
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Buffer.byteLength(JSON.stringify(data)) > max
  )
    throw Object.assign(new Error("Request is too large or invalid."), {
      status: 400,
    });
  return data;
}
async function activeSession(req) {
  const data = session(req);
  if (!data) return null;
  return (await read(`auth/revoked/${sign(data.id)}.json`)) ? null : data;
}
async function staff(req, write = false) {
  const data = await activeSession(req);
  if (!data)
    throw Object.assign(new Error("Sign in to continue."), { status: 401 });
  if (
    write &&
    (!originOK(req) || !equal(req.headers["x-csrf-token"], sign(data.id)))
  )
    throw Object.assign(new Error("Please reload and try again."), {
      status: 403,
    });
  return data;
}
async function read(path) {
  const result = await get(path, { access: "private", useCache: false });
  if (!result) return null;
  return {
    data: await new Response(result.stream).json(),
    etag: result.blob.etag,
  };
}
async function write(path, data, etag) {
  return put(path, JSON.stringify(data), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: !!etag,
    ...(etag ? { ifMatch: etag } : {}),
    cacheControlMaxAge: 60,
  });
}
async function rate(req, kind, limit, minutes = 15) {
  const ip =
    req.headers["x-vercel-forwarded-for"] ||
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    "unknown";
  const hash = sign(`${kind}:${ip}`).slice(0, 32),
    slot = Math.floor(Date.now() / (minutes * 60000));
  // Finite atomic slots cap requests across concurrent function instances.
  for (let i = 0; i < limit; i++) {
    try {
      await write(`limits/${slot}/${hash}-${i}.json`, {
        exp: (slot + 2) * minutes * 60000,
      });
      return;
    } catch (e) {
      if (!/already exists/i.test(e.message)) throw e;
    }
  }
  throw Object.assign(new Error("Too many attempts. Please try again later."), {
    status: 429,
  });
}
function passwordOK(password) {
  try {
    const [salt, hash] = process.env.ADMIN_PASSWORD_HASH.split(":");
    return (
      typeof password === "string" &&
      password.length <= 200 &&
      equal(scryptSync(password, salt, 64).toString("hex"), hash)
    );
  } catch {
    return false;
  }
}
const wrap = (fn) => async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    await fn(req, res);
  } catch (e) {
    res
      .status(
        e.status ||
          (/precondition|already exists/i.test(e.message) ? 409 : 503),
      )
      .json({
        error: e.status
          ? e.message
          : /precondition|already exists/i.test(e.message)
            ? "This record changed. Reload before saving."
            : "Service temporarily unavailable. Please try again.",
      });
  }
};
module.exports = {
  UUID,
  sign,
  equal,
  token,
  decode,
  session,
  activeSession,
  originOK,
  json,
  staff,
  read,
  write,
  rate,
  passwordOK,
  wrap,
  randomBytes,
  list,
  get,
  del,
  Readable,
};
