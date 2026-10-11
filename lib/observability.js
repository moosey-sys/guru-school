const { randomUUID } = require("node:crypto");
const routes = new Set([
  "/",
  "/about",
  "/programmes",
  "/life",
  "/campus",
  "/team",
  "/gallery",
  "/news",
  "/contact",
  "/admin",
  "/privacy.html",
]);
function route(value) {
  const path = String(value || "").split("?")[0];
  return routes.has(path) ||
    /^\/api\/(session|content|enquiry|inbox|analytics|health|media|traffic|monitor)$/.test(
      path,
    )
    ? path
    : "unknown";
}
function log(event, fields = {}) {
  console.error(
    JSON.stringify({
      event,
      requestId: fields.requestId || randomUUID(),
      route: route(fields.route),
      ...(fields.kind ? { kind: fields.kind } : {}),
      ...(Number.isInteger(fields.status) ? { status: fields.status } : {}),
    }),
  );
}
module.exports = { route, log };
