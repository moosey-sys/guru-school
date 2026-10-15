import { readFileSync, readdirSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import { parseEnv } from "node:util";
const configured = Object.assign(
  {},
  ...[".env", ".env.local"]
    .filter(existsSync)
    .map((file) => parseEnv(readFileSync(file, "utf8"))),
  process.env,
);
const secrets = [
  "SESSION_SECRET",
  "BLOB_READ_WRITE_TOKEN",
  "ADMIN_PASSWORD_HASH",
  "SMTP_PASS",
]
  .map((key) => [key, configured[key]])
  .filter(
    ([, value]) =>
      typeof value === "string" &&
      value.length >= 12 &&
      value !== "[SENSITIVE]",
  );
const root = path.resolve("dist");
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const file = path.join(dir, e.name);
    assert(!e.isSymbolicLink(), `Symlink in public output: ${file}`);
    return e.isDirectory() ? walk(file) : [file];
  });
}
const files = walk(root);
for (const file of files) {
  assert(
    /\.(html|css|js|webp|png|jpg|jpeg|svg|ico|woff2?)$/i.test(file) ||
      ["robots.txt", "sitemap.xml"].includes(path.relative(root, file)),
    `Unexpected public file: ${file}`,
  );
  assert(!path.basename(file).startsWith("."), `Hidden public file: ${file}`);
  if (!/\.(html|css|js|svg|xml|txt)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const [key, value] of secrets)
    assert(!text.includes(value), `Configured ${key} leaked into ${file}`);
  assert(
    !/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bAKIA[A-Z0-9]{16}\b|\bgh[pousr]_[A-Za-z0-9]{30,}/.test(
      text,
    ),
    `Credential pattern in ${file}`,
  );
}
for (const file of files.filter((file) => file.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  assert(
    !/<script\b[^>]*>(?!\s*<\/script>)/i.test(html),
    "Inline scripts are forbidden",
  );
  assert(
    !/\son[a-z]+\s*=|javascript\s*:/i.test(html),
    "Inline handlers/JavaScript links are forbidden",
  );
  for (const tag of html.matchAll(/<a\b[^>]*>/gi)) {
    if (/target="_blank"/.test(tag[0]))
      assert(/rel="[^"]*noopener/.test(tag[0]), "External tab needs noopener");
  }
  for (const match of html.matchAll(/(?:src|data-image)="([^"]+)"/g)) {
    const asset = match[1].split("?")[0].replace(/^\//, "");
    assert(
      /^assets\/[\w.-]+$|^[\w.-]+\.js$/.test(asset),
      `Nonlocal asset: ${asset}`,
    );
    assert(
      files.includes(path.resolve(root, asset)),
      `Missing asset: ${asset}`,
    );
  }
}
for (const file of walk(path.resolve("src")).filter((file) =>
  /\.(js|jsx)$/.test(file),
)) {
  const text = readFileSync(file, "utf8");
  assert(
    !/\b(?:eval|Function)\s*\(|\.innerHTML\s*=|dangerouslySetInnerHTML|document\.write\s*\(/.test(
      text,
    ),
    `Unsafe application source in ${file}`,
  );
}
const config = JSON.parse(readFileSync("vercel.json", "utf8"));
const headers = Object.fromEntries(
  config.headers[0].headers.map((h) => [h.key, h.value]),
);
assert.equal(config.outputDirectory, "dist");
for (const directive of [
  "default-src 'none'",
  "script-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "connect-src 'self'",
  "object-src 'none'",
])
  assert(headers["Content-Security-Policy"].includes(directive));
assert(!/unsafe-inline|unsafe-eval/.test(headers["Content-Security-Policy"]));
assert.equal(headers["X-Content-Type-Options"], "nosniff");
assert.equal(headers["X-Frame-Options"], "DENY");
assert.equal(headers["Strict-Transport-Security"], "max-age=31536000");
for (const route of ["/admin", "/admin.html"])
  assert(
    config.headers.some(
      (rule) =>
        rule.source === route &&
        rule.headers.some(
          (header) =>
            header.key === "Cache-Control" && header.value === "no-store",
        ),
    ),
  );
console.log(`Security checks passed for ${files.length} public files.`);
