const c = require("../lib/core");
const { randomUUID } = require("node:crypto");
const { notification, acknowledgement } = require("../lib/mail");
const { deliver } = require("../lib/delivery");
const visits = require("../lib/visits");
const kinds = [
  "General enquiry",
  "Programme discussion",
  "Short message",
  "Book a school visit",
];
module.exports = c.wrap(async (req, res) => {
  if (!process.env.SESSION_SECRET || !process.env.BLOB_READ_WRITE_TOKEN)
    return res
      .status(503)
      .json({ error: "Enquiries temporarily unavailable." });
  if (req.method === "GET")
    return res.json({
      token: c.token({
        type: "enquiry",
        nonce: c.randomBytes(24).toString("hex"),
        issued: Date.now(),
        exp: Date.now() + 3600000,
      }),
    });
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed." });
  if (!c.originOK(req))
    return res.status(403).json({ error: "Invalid origin." });
  const data = c.json(req, 12000),
    proof = c.decode(data.token);
  if (
    !proof ||
    proof.type !== "enquiry" ||
    Date.now() - proof.issued < 2000 ||
    data.website
  )
    return res.status(400).json({ error: "Please reload and try again." });
  const field = (key, max) =>
    typeof data[key] === "string" && data[key].trim().length <= max
      ? data[key].trim()
      : "";
  const name = field("name", 100),
    email = field("email", 254),
    phone = field("phone", 40),
    kind = field("kind", 50),
    message = field("message", 3000),
    date = field("date", 10);
  const programme = field("programme", 40);
  if (
    programme &&
    !["Early years", "Lower primary", "Upper primary", "Not sure yet"].includes(
      programme,
    )
  )
    return res.status(400).json({ error: "Choose a programme." });
  const today = new Date(Date.now() + 23400000).toISOString().slice(0, 10);
  if (
    !name ||
    /[\r\n]/.test(name) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !kinds.includes(kind) ||
    message.length < 5 ||
    (date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date)) ||
    (kind === kinds[3] && (!date || date < today))
  )
    return res
      .status(400)
      .json({ error: "Check required fields and visit date." });
  if (data.slotId && (kind !== kinds[3] || !c.UUID.test(data.slotId)))
    return res.status(400).json({ error: "Select a valid visit time." });
  const prior = await c.read(`receipts/${proof.nonce}.json`);
  if (prior) {
    if (
      prior.data.state !== "saved" &&
      !(prior.data.path && (await c.read(prior.data.path)))
    )
      return res
        .status(409)
        .json({ error: "Submission is being processed. Please wait." });
    return res.json({ ok: true, reference: prior.data.id });
  }
  await c.rate(req, "enquiry", 5);
  const id = randomUUID(),
    now = Date.now(),
    createdKey = String(9999999999999 - now),
    path = `enquiries/${createdKey}-${id}.json`;
  // Claim the token before writing so retries and concurrent clicks never create duplicates.
  try {
    await c.write(`receipts/${proof.nonce}.json`, {
      id,
      path,
      state: "pending",
      exp: proof.exp,
    });
  } catch (e) {
    if (/already exists/i.test(e.message))
      return res
        .status(409)
        .json({ error: "Submission is being processed. Please wait." });
    throw e;
  }
  let booking = {};
  if (data.slotId) {
    if (kind !== kinds[3])
      return res.status(400).json({ error: "Select a visit request." });
    try {
      booking = await visits.reserve(data.slotId, { id, path });
    } catch (e) {
      await c.del(`receipts/${proof.nonce}.json`);
      throw e;
    }
  }
  const record = {
    id,
    createdKey,
    name,
    email,
    phone,
    kind,
    message,
    date,
    programme,
    ...booking,
    status: "new",
    notes: "",
    created: new Date(now).toISOString(),
    emailStatus: "not-configured",
  };
  try {
    await c.write(path, record);
  } catch (e) {
    await c.del(`receipts/${proof.nonce}.json`);
    await visits.release(booking.slotId, id);
    throw e;
  }
  const mailStatus = await deliver({
    to: process.env.MAIL_TO,
    replyTo: { name, address: email },
    ...notification(record),
  });
  const acknowledgementStatus = await deliver({
    to: email,
    replyTo: process.env.MAIL_TO,
    ...acknowledgement(record),
  });
  try {
    const saved = await c.read(path);
    await c.write(
      path,
      { ...saved.data, emailStatus: mailStatus, acknowledgementStatus },
      saved.etag,
    );
  } catch {
    /* The enquiry remains saved even when notification tracking is temporarily unavailable. */
  }
  try {
    const receipt = await c.read(`receipts/${proof.nonce}.json`);
    await c.write(
      `receipts/${proof.nonce}.json`,
      { id, path, state: "saved", exp: proof.exp },
      receipt.etag,
    );
  } catch {
    /* The durable enquiry already exists; acknowledge it. */
  }
  res.json({ ok: true, reference: id });
});
