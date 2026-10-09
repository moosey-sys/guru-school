import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const root = path.resolve('dist');
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const file = path.join(dir, e.name);
    assert(!e.isSymbolicLink(), `Symlink in public output: ${file}`);
    return e.isDirectory() ? walk(file) : [file];
  });
}
const files = walk(root);
for (const file of files) {
  assert(/\.(html|css|js|webp|png|jpg|jpeg|svg|ico|woff2?)$/i.test(file), `Unexpected public file: ${file}`);
  assert(!path.basename(file).startsWith('.'), `Hidden public file: ${file}`);
  if (!/\.(html|css|js|svg)$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  assert(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bAKIA[A-Z0-9]{16}\b|\bgh[pousr]_[A-Za-z0-9]{30,}/.test(text), `Credential pattern in ${file}`);
  if (file.endsWith('.js')) assert(!/\b(?:eval|Function)\s*\(|\.innerHTML\s*=|document\.write\s*\(/.test(text), `Unsafe script sink in ${file}`);
}
const html = readFileSync('dist/index.html', 'utf8');
assert(!/<script\b[^>]*>(?!\s*<\/script>)/i.test(html), 'Inline scripts are forbidden');
assert(!/\son[a-z]+\s*=|javascript\s*:/i.test(html), 'Inline handlers/JavaScript links are forbidden');
for (const tag of html.matchAll(/<a\b[^>]*>/gi)) {
  if (/target="_blank"/.test(tag[0])) assert(/rel="[^"]*noopener/.test(tag[0]), 'External tab needs noopener');
}
for (const match of html.matchAll(/(?:src|data-image)="([^"]+)"/g)) {
  const asset = match[1].split('?')[0];
  assert(/^assets\/[\w.-]+$|^[\w.-]+\.js$/.test(asset), `Nonlocal asset: ${asset}`);
  assert(files.includes(path.resolve(root, asset)), `Missing asset: ${asset}`);
}
const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const headers = Object.fromEntries(config.headers[0].headers.map(h => [h.key, h.value]));
assert.equal(config.outputDirectory, 'dist');
for (const directive of ["default-src 'none'", "script-src 'self'", "frame-ancestors 'none'", "form-action 'none'", "object-src 'none'"]) assert(headers['Content-Security-Policy'].includes(directive));
assert(!/unsafe-inline|unsafe-eval/.test(headers['Content-Security-Policy']));
assert.equal(headers['X-Content-Type-Options'], 'nosniff');
assert.equal(headers['X-Frame-Options'], 'DENY');
console.log(`Security checks passed for ${files.length} public files.`);
