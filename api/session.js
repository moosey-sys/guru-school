const c = require("../lib/core");
const { randomInt } = require("node:crypto");
const { configured, deliver } = require("../lib/delivery");
function signedIn(res) {
  const s = {
    type: "staff",
    id: c.randomBytes(24).toString("hex"),
    exp: Date.now() + 8 * 3600000,
    mfa: configured(),
  };
  res.setHeader(
    "Set-Cookie",
    `__Host-guru=${c.token(s)}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800`,
  );
  return res.json({
    user: process.env.ADMIN_USERNAME,
    csrf: c.sign(s.id),
    twoFactor: s.mfa,
  });
}
module.exports = c.wrap(async (req, res) => {
  if (req.method === "GET") {
    const s = c.session(req);
    return res
      .status(s ? 200 : 401)
      .json(
        s
          ? {
              user: process.env.ADMIN_USERNAME,
              csrf: c.sign(s.id),
              twoFactor: !!s.mfa,
            }
          : { error: "Please sign in." },
      );
  }
  if (!c.originOK(req))
    return res.status(403).json({ error: "Invalid origin." });
  if (req.method === "DELETE") {
    c.staff(req, true);
    res.setHeader(
      "Set-Cookie",
      "__Host-guru=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0",
    );
    return res.json({ ok: true });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const data = c.json(req, 2000);
  if (data.challenge) {
    const proof = c.decode(data.challenge);
    if (!proof || proof.type !== "login-code")
      return res
        .status(401)
        .json({ error: "Code expired. Start sign-in again." });
    await c.rate(req, `code-${proof.id}`, 5, 10);
    const path = `auth/challenges/${proof.id}.json`,
      record = await c.read(path);
    if (
      !record ||
      record.data.used ||
      record.data.exp < Date.now() ||
      !/^\d{6}$/.test(data.code || "") ||
      !c.equal(record.data.hash, c.sign(`${proof.id}:${data.code}`))
    )
      return res
        .status(401)
        .json({ error: "Incorrect or expired sign-in code." });
    await c.write(path, { ...record.data, used: true }, record.etag);
    return signedIn(res);
  }
  await c.rate(req, "login", 10);
  if (
    !c.equal(data.username, process.env.ADMIN_USERNAME) ||
    !c.passwordOK(data.password)
  )
    return res.status(401).json({ error: "Incorrect username or password." });
  if (!configured()) {
    if (process.env.NODE_ENV === "production")
      return res
        .status(503)
        .json({
          error:
            "Secure sign-in email is unavailable. Contact the site administrator.",
        });
    return signedIn(res);
  }
  const id = c.randomBytes(24).toString("hex"),
    code = String(randomInt(100000, 1000000)),
    exp = Date.now() + 10 * 60000;
  await c.write(`auth/challenges/${id}.json`, {
    hash: c.sign(`${id}:${code}`),
    exp,
    used: false,
  });
  const destination = process.env.ADMIN_2FA_EMAIL || process.env.MAIL_TO;
  const sent = await deliver({
    to: destination,
    subject: "Guru staff dashboard — sign-in code",
    text: `Your Guru staff dashboard sign-in code is ${code}.\n\nIt expires in 10 minutes and can be used once. Do not share this code. If you did not attempt to sign in, ignore this email.`,
  });
  if (sent !== "accepted")
    return res
      .status(503)
      .json({
        error: "Could not send your sign-in code. Please try again later.",
      });
  return res.json({
    challenge: c.token({ type: "login-code", id, exp }),
    message: "A sign-in code was sent to the school admin inbox.",
  });
});
