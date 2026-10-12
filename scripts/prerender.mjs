import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { render, pages } from "../.build-server/entry-server.mjs";
const template = readFileSync("dist/index.html", "utf8");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
for (const page of [
  ...pages,
  {
    slug: "privacy",
    label: "Privacy",
    description:
      "How Guru handles school enquiries and anonymous visitor statistics.",
  },
]) {
  const path = "/" + page.slug;
  const html = (
    page.slug === "privacy"
      ? readFileSync("dist/privacy.html", "utf8")
      : template
  )
    .replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`)
    .replace(
      /<title>.*?<\/title>/,
      `<title>${page.label} — Guru International School</title>`,
    )
    .replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${escape(page.description)}">`,
    );
  writeFileSync(`dist/${page.slug || "index"}.html`, html);
}
console.log(
  "Pre-rendered 10 React public pages for fast loading and search engines.",
);

// The server bundle is only needed while generating the public HTML.
rmSync(new URL("../.build-server/", import.meta.url), {
  recursive: true,
  force: true,
});
