import fs from "node:fs/promises";
import sharp from "sharp";
const mapping = {};
for (const name of await fs.readdir("public/assets")) {
  if (!/\.(webp|jpe?g|png)$/i.test(name) || name.startsWith("responsive-"))
    continue;
  const path = `public/assets/${name}`,
    stat = await fs.stat(path);
  if (stat.size < 80000) continue;
  const meta = await sharp(path).metadata();
  const variants = [];
  for (const width of (name === "crest.png" ? [80, 160, 400, 800, 1200] : [400, 800, 1200]).filter((w) => w <= meta.width)) {
    const target = `responsive-${name.replace(/\.[^.]+$/, "")}-${width}.webp`;
    await sharp(path)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(`public/assets/${target}`);
    variants.push(`/assets/${target} ${width}w`);
  }
  if (variants.length)
    mapping[`/assets/${name}`] = { srcSet: variants.join(", ") };
}
await fs.writeFile(
  "src/content/responsive-images.json",
  JSON.stringify(mapping, null, 2) + "\n",
);
console.log(
  `Prepared responsive variants for ${Object.keys(mapping).length} images.`,
);
