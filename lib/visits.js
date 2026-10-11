const c = require("./core");
const { randomUUID } = require("node:crypto");
const error = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const today = () => new Date(Date.now() + 23400000).toISOString().slice(0, 10);
function validDate(date) {
  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date
  );
}
function future(slot) {
  return Date.parse(`${slot.date}T${slot.time}:00+06:30`) > Date.now();
}
async function slots() {
  return (
    (await c.read("visits/schedule.json")) || {
      data: { slots: [] },
      etag: null,
    }
  );
}
async function available(slot) {
  return (
    slot.open &&
    future(slot) &&
    !(await c.read(`visits/reservations/${slot.id}.json`))
  );
}
async function reserve(id, record) {
  if (!c.UUID.test(id || "")) throw error("Choose an available visit time.");
  const schedule = await slots(),
    slot = schedule.data.slots.find((s) => s.id === id);
  if (!slot || !(await available(slot)))
    throw error(
      "This visit time is no longer available. Choose another time.",
      409,
    );
  await c.write(`visits/reservations/${id}.json`, {
    id: record.id,
    path: record.path,
  });
  return { slotId: id, date: slot.date, time: slot.time };
}
async function release(slotId, enquiryId) {
  if (!slotId) return;
  const path = `visits/reservations/${slotId}.json`,
    reservation = await c.read(path);
  if (reservation?.data.id === enquiryId)
    await c.del(path, { ifMatch: reservation.etag });
}
function cleanSlots(items) {
  if (!Array.isArray(items) || items.length > 120)
    throw error("Maximum 120 visit times.");
  const cleaned = items.map((s) => {
    if (
      !c.UUID.test(s.id || "") ||
      !validDate(s.date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time || "")
    )
      throw error("Check the visit date and time.");
    return { id: s.id, date: s.date, time: s.time, open: !!s.open };
  });
  if (
    new Set(cleaned.map((s) => s.id)).size !== cleaned.length ||
    new Set(cleaned.map((s) => s.date + " " + s.time)).size !== cleaned.length
  )
    throw error("Visit times must be unique.");
  return cleaned.sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time),
  );
}
module.exports = {
  error,
  today,
  validDate,
  future,
  slots,
  available,
  reserve,
  release,
  cleanSlots,
  randomUUID,
};
