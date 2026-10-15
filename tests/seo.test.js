const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
test("public pages have matching canonical, description and social metadata in crawlable HTML", async () => {
  const { parse } = await import("parse5"),
    { pages } = await import("../src/content/pages.js");
  const publicPages = [
    ...pages,
    {
      slug: "privacy",
      label: "Privacy",
      description:
        "How Guru handles school enquiries and anonymous visitor statistics.",
    },
  ];
  const descriptions = new Set();
  for (const page of publicPages) {
    const html = fs.readFileSync(`dist/${page.slug || "index"}.html`, "utf8"),
      nodes = [];
    function walk(node) {
      nodes.push(node);
      for (const child of node.childNodes || []) walk(child);
    }
    walk(parse(html));
    const metas = nodes
      .filter((n) => n.tagName === "meta")
      .map((n) => Object.fromEntries(n.attrs.map((a) => [a.name, a.value])));
    const url =
      "https://www.guru-school.org/" +
      (page.slug === "privacy" ? "privacy.html" : page.slug);
    assert.equal(metas.filter((m) => m.name === "description").length, 1);
    assert.equal(
      metas.find((m) => m.name === "description").content,
      page.description,
    );
    assert.equal(
      metas.find((m) => m.property === "og:description").content,
      page.description,
    );
    assert.equal(metas.find((m) => m.property === "og:url").content, url);
    assert.ok(
      metas.find((m) => m.name === "robots").content.startsWith("index,follow"),
    );
    const canonical = nodes.filter(
      (n) =>
        n.tagName === "link" &&
        n.attrs.some((a) => a.name === "rel" && a.value === "canonical"),
    );
    assert.equal(canonical.length, 1);
    assert.equal(canonical[0].attrs.find((a) => a.name === "href").value, url);
    const image = metas.find((m) => m.property === "og:image").content;
    assert.ok(fs.existsSync("dist/" + new URL(image).pathname));
    descriptions.add(page.description);
  }
  assert.equal(descriptions.size, publicPages.length);
});
test("sitemap lists public canonical URLs, robots allows public rendering and admin stays noindex", () => {
  const xml = fs.readFileSync("dist/sitemap.xml", "utf8"),
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.match(xml, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
  assert.equal(urls.length, 10);
  assert.equal(new Set(urls).size, 10);
  assert.ok(
    urls.every(
      (url) =>
        url.startsWith("https://www.guru-school.org/") &&
        !url.includes("/admin") &&
        !url.includes("/api/"),
    ),
  );
  const robots = fs.readFileSync("dist/robots.txt", "utf8");
  for (const text of [
    "Allow: /api/content",
    "Allow: /api/media",
    "Disallow: /admin",
    "Sitemap: https://www.guru-school.org/sitemap.xml",
  ])
    assert.ok(robots.includes(text));
  assert.ok(!robots.includes("Disallow: /\n"));
  assert.match(
    fs.readFileSync("dist/admin.html", "utf8"),
    /name="robots" content="noindex,nofollow"/,
  );
  const config = JSON.parse(fs.readFileSync("vercel.json"));
  for (const route of ["/admin", "/admin.html"])
    assert.ok(
      config.headers
        .find((r) => r.source === route)
        .headers.some(
          (h) => h.key === "X-Robots-Tag" && h.value.includes("noindex"),
        ),
    );
});
