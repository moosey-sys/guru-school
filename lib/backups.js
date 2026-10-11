const c = require("./core");
const { randomUUID } = require("node:crypto");
async function snapshot(content, reason = "manual") {
  const id = randomUUID(),
    created = new Date().toISOString();
  await c.write(`backups/${String(9999999999999 - Date.now())}-${id}.json`, {
    id,
    created,
    reason,
    content,
  });
  return { id, created, reason };
}
async function find(id) {
  if (!c.UUID.test(id || ""))
    throw Object.assign(new Error("Invalid backup."), { status: 400 });
  let cursor;
  do {
    const page = await c.list({
      prefix: "backups/",
      limit: 100,
      ...(cursor ? { cursor } : {}),
    });
    const blob = page.blobs.find((b) => b.pathname.endsWith(`-${id}.json`));
    if (blob) return c.read(blob.pathname);
    cursor = page.hasMore ? page.cursor : null;
  } while (cursor);
  throw Object.assign(new Error("Backup not found."), { status: 404 });
}
module.exports = { snapshot, find };
