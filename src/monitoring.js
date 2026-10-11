const paths = new Set([
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
let reports = 0;
export function reportError(kind) {
  if (!import.meta.env.PROD || reports >= 3 || !paths.has(location.pathname))
    return;
  reports++;
  // Never transmit messages, stacks, form fields, URLs with query strings, or credentials.
  fetch("/api/monitor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, path: location.pathname }),
    keepalive: true,
  }).catch(() => {});
}
export function installMonitoring() {
  window.addEventListener("error", () => reportError("runtime"));
  window.addEventListener("unhandledrejection", () => reportError("promise"));
}
