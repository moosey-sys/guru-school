const c = require("../lib/core"),
  v = require("../lib/visits");
module.exports = c.wrap(async (req, res) => {
  if (req.method === "GET") {
    const schedule = await v.slots(),
      staff = !!c.session(req);
    const slots = await Promise.all(
      schedule.data.slots.map(async (slot) => ({
        ...slot,
        available: await v.available(slot),
      })),
    );
    return res.json({
      slots: staff
        ? slots
        : slots
            .filter((s) => s.available)
            .map(({ id, date, time }) => ({ id, date, time })),
      ...(staff ? { version: schedule.etag } : {}),
    });
  }
  if (req.method !== "PUT")
    return res.status(405).json({ error: "Method not allowed." });
  c.staff(req, true);
  const input = c.json(req),
    schedule = await v.slots();
  if (input.version !== schedule.etag)
    return res
      .status(409)
      .json({ error: "Visit schedule changed. Refresh before saving." });
  const slots = v.cleanSlots(input.slots);
  for (const old of schedule.data.slots) {
    const next = slots.find((s) => s.id === old.id);
    if (
      (!next || old.date !== next.date || old.time !== next.time) &&
      (await c.read(`visits/reservations/${old.id}.json`))
    )
      return res
        .status(409)
        .json({
          error:
            "Reschedule or close the associated enquiry before changing a reserved time.",
        });
  }
  const saved = await c.write("visits/schedule.json", { slots }, schedule.etag);
  res.json({ slots, version: saved.etag });
});
