const c = require("../lib/core");
module.exports = c.wrap(async (req, res) => {
  await c.staff(req);
  if (req.method !== "GET") return res.status(405).end();
  res.json({
    twoFactorRequired: process.env.NODE_ENV === "production",
    emailConfigured: [
      "SMTP_HOST",
      "SMTP_USER",
      "SMTP_PASS",
      "MAIL_FROM",
      "MAIL_TO",
    ].every((key) => process.env[key]),
  });
});
