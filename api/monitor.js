const c = require("../lib/core"),
  o = require("../lib/observability");
module.exports = c.wrap(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  if (!c.originOK(req))
    return res.status(403).json({ error: "Invalid origin." });
  const data = c.json(req, 1000);
  if (
    !["runtime", "promise", "render", "request"].includes(data.kind) ||
    typeof data.path !== "string" ||
    o.route(data.path) === "unknown" ||
    Object.keys(data).some((key) => !["kind", "path"].includes(key))
  )
    return res.status(400).json({ error: "Invalid diagnostic event." });
  await c.rate(req, "diagnostic", 5, 15);
  o.log("browser_error", { kind: data.kind, route: data.path });
  res.status(204).end();
});
