const nodemailer = require("nodemailer");
function configured() {
  return (
    ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "MAIL_TO"].every(
      (key) => process.env[key],
    ) && [465, 587].includes(Number(process.env.SMTP_PORT || 465))
  );
}
async function deliver(message) {
  if (!configured()) return "not-configured";
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
  });
  try {
    const result = await transport.sendMail({
      from: process.env.MAIL_FROM,
      ...message,
    });
    return result.accepted?.length ? "accepted" : "failed";
  } catch {
    return "failed";
  } finally {
    transport.close();
  }
}
module.exports = { configured, deliver };
