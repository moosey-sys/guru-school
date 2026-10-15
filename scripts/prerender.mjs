import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { render, pages } from "../.build-server/entry-server.mjs";
import { siteOrigin, pageTitle, pageUrl } from "../src/content/seo.mjs";
const template = readFileSync("dist/index.html", "utf8");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
const publicPages = [
  ...pages,
  {
    slug: "privacy",
    label: "Privacy",
    description:
      "How Guru handles school enquiries and anonymous visitor statistics.",
  },
];
for (const page of publicPages) {
  const path = "/" + page.slug;
  const html = (
    page.slug === "privacy"
      ? readFileSync("dist/privacy.html", "utf8")
      : template
  )
    .replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`)
    .replace(/<title>.*?<\/title>/, `<title>${escape(pageTitle(page))}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escape(page.description)}">`,
    );
  const title = escape(pageTitle(page)),
    description = escape(page.description),
    url = pageUrl(page);
  const image = `${siteOrigin}/assets/${page.image || "hero.webp"}`;
  const metadata = `<link rel="canonical" href="${url}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Guru International School" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:alt" content="${escape(page.imageAlt || page.label + " at Guru International School")}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />`;
  writeFileSync(
    `dist/${page.slug || "index"}.html`,
    html.replace("</head>", metadata + "\n</head>"),
  );
}
writeFileSync(
  "dist/sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    publicPages
      .map((page) => `  <url><loc>${pageUrl(page)}</loc></url>`)
      .join("\n") +
    "\n</urlset>\n",
);
writeFileSync(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nAllow: /api/content\nAllow: /api/media\nDisallow: /api/\nDisallow: /admin\nSitemap: ${siteOrigin}/sitemap.xml\n`,
);
console.log(
  "Pre-rendered 10 React public pages for fast loading and search engines.",
);

// The server bundle is only needed while generating the public HTML.
rmSync(new URL("../.build-server/", import.meta.url), {
  recursive: true,
  force: true,
});
