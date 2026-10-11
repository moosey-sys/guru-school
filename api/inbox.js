const c = require("../lib/core"),
  v = require("../lib/visits");
const { deliver } = require("../lib/delivery");
const { visitUpdate } = require("../lib/mail");
module.exports = c.wrap(async (req, res) => {
  c.staff(req, req.method !== "GET");
  if (req.method === "GET") {
    const search = String(req.query.search || "")
        .trim()
        .toLowerCase()
        .slice(0, 200),
      status = req.query.status || "",
      programme = req.query.programme || "",
      from = req.query.from || "",
      to = req.query.to || "";
    if (
      (from && !v.validDate(from)) ||
      (to && !v.validDate(to)) ||
      (from && to && from > to)
    )
      return res.status(400).json({ error: "Check the date range." });
    let cursor = req.query.cursor,
      items = [],
      scanned = 0,
      hasMore;
    do {
      const page = await c.list({
        prefix: "enquiries/",
        limit: 50,
        ...(cursor ? { cursor } : {}),
      });
      const records = await Promise.all(
        page.blobs.map(async (b) => {
          const record = await c.read(b.pathname);
          return record ? { ...record.data, version: record.etag } : null;
        }),
      );
      items.push(
        ...records.filter(
          (item) =>
            item &&
            (!search ||
              [item.name, item.email, item.phone, item.message].some((value) =>
                String(value || "")
                  .toLowerCase()
                  .includes(search),
              )) &&
            (!status ||
              (status === "visits"
                ? item.kind === "Book a school visit"
                : item.status === status)) &&
            (!programme || item.programme === programme) &&
            (!from ||
              new Date(Date.parse(item.created) + 23400000)
                .toISOString()
                .slice(0, 10) >= from) &&
            (!to ||
              new Date(Date.parse(item.created) + 23400000)
                .toISOString()
                .slice(0, 10) <= to),
        ),
      );
      cursor = page.cursor;
      hasMore = page.hasMore;
      scanned++;
    } while (hasMore && items.length < 50 && scanned < 10);
    return res.json({
      items: items.sort((a, b) => b.created.localeCompare(a.created)),
      cursor: hasMore ? cursor : null,
    });
  }
  if (!["PATCH", "DELETE"].includes(req.method))
    return res.status(405).json({ error: "Method not allowed." });
  const data = c.json(req, 7000);
  if (
    !c.UUID.test(data.id || "") ||
    typeof data.version !== "string" ||
    !/^\d{13}$/.test(data.createdKey || "")
  )
    return res.status(400).json({ error: "Invalid record." });
  if (
    req.method === "PATCH" &&
    (!["new", "in-progress", "confirmed", "closed"].includes(data.status) ||
      typeof data.notes !== "string" ||
      data.notes.length > 2000 ||
      (data.followUp && !v.validDate(data.followUp)))
  )
    return res
      .status(400)
      .json({ error: "Invalid status, notes or follow-up date." });
  const path = `enquiries/${data.createdKey}-${data.id}.json`,
    item = await c.read(path);
  if (!item) return res.status(404).json({ error: "Record not found." });
  if (item.etag !== data.version)
    return res
      .status(409)
      .json({ error: "Record changed. Refresh before saving." });
  if (req.method === "DELETE") {
    await c.del(path, { ifMatch: item.etag });
    await v.release(item.data.slotId, data.id);
    return res.json({ ok: true });
  }
  let booking = {},
    newReservation = false;
  if (data.slotId && data.slotId !== item.data.slotId) {
    if (item.data.kind !== "Book a school visit" || data.status === "closed")
      return res
        .status(400)
        .json({ error: "Only open visit requests can be rescheduled." });
    booking = await v.reserve(data.slotId, { id: data.id, path });
    newReservation = true;
  }
  const next = {
    ...item.data,
    ...booking,
    status: data.status,
    notes: data.notes.trim(),
    followUp: data.followUp ?? item.data.followUp ?? "",
    updated: new Date().toISOString(),
  };
  if (
    next.status === "confirmed" &&
    next.kind === "Book a school visit" &&
    next.time &&
    !next.slotId
  ) {
    if (newReservation) await v.release(booking.slotId, data.id);
    return res
      .status(400)
      .json({
        error:
          "Choose an available visit time before reopening a closed booking.",
      });
  }
  if (
    data.notify &&
    (!next.date ||
      !next.time ||
      next.kind !== "Book a school visit" ||
      next.status !== "confirmed")
  ) {
    if (newReservation) await v.release(booking.slotId, data.id);
    return res.status(400).json({
      error:
        "Choose a visit time and confirmed status before emailing the family.",
    });
  }
  let saved;
  try {
    saved = await c.write(path, next, item.etag);
  } catch (e) {
    if (newReservation) await v.release(booking.slotId, data.id);
    throw e;
  }
  if (newReservation || data.status === "closed")
    await v.release(item.data.slotId, data.id);
  if (data.status === "closed" && next.slotId) {
    next.slotId = "";
    saved = await c.write(path, next, saved.etag);
  }
  if (data.notify) {
    next.visitEmailStatus = await deliver({
      to: next.email,
      replyTo: process.env.MAIL_TO,
      ...visitUpdate(next),
    });
    saved = await c.write(path, next, saved.etag);
  }
  res.json({ item: { ...next, version: saved.etag } });
});
