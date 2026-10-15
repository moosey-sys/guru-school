import assert from "node:assert/strict";
const base = "https://www.guru-school.org";
for (const path of [
  "/",
  "/about",
  "/programmes",
  "/life",
  "/campus",
  "/team",
  "/gallery",
  "/news",
  "/contact",
  "/privacy.html",
  "/admin",
]) {
  const response = await fetch(base + path, {
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, 200, path);
  assert.ok(response.headers.get("content-security-policy"), path);
  assert.ok(response.headers.get("strict-transport-security"), path);
  const html = await response.text();
  assert.match(html, /<title>/, path);
  if (path === "/admin")
    assert.match(response.headers.get("cache-control"), /no-store/);
  console.log(`${path}: OK`);
}
for (const path of [
  "/api/inbox",
  "/api/analytics",
  "/api/health",
  "/api/session",
])
  assert.equal(
    (await fetch(base + path, { signal: AbortSignal.timeout(20000) })).status,
    401,
    path,
  );
const data = await (
  await fetch(base + "/api/content", { signal: AbortSignal.timeout(20000) })
).json();
assert.equal(data.version, undefined);
assert.ok(
  data.content.news.every(
    (item) =>
      item.published &&
      (!item.publishAt || Date.parse(item.publishAt) <= Date.now()),
  ),
);
console.log("Public availability, headers and private access checks passed.");

const robotsResponse = await fetch(base + "/robots.txt", {
  signal: AbortSignal.timeout(20000),
});
assert.equal(robotsResponse.status, 200);
assert.ok(
  (await robotsResponse.text()).includes(`Sitemap: ${base}/sitemap.xml`),
);
const sitemapResponse = await fetch(base + "/sitemap.xml", {
  signal: AbortSignal.timeout(20000),
});
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
assert.equal([...sitemap.matchAll(/<loc>/g)].length, 10);
assert.ok(!sitemap.includes("/admin"));
console.log("Search sitemap and robots discovery checks passed.");
