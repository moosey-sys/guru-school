const c = require("../lib/core");
const { visible } = require("../lib/publishing");
const sharp = require("sharp");
const { randomUUID } = require("node:crypto");
module.exports = c.wrap(async (req, res) => {
  if (req.method === "POST") {
    await c.staff(req, true);
    const data = c.json(req, 3900000);
    if (typeof data.image !== "string" || !/^[A-Za-z0-9+/=]+$/.test(data.image))
      return res
        .status(400)
        .json({ error: "Choose a JPEG, PNG or WebP photo under 2.5 MB." });
    const buffer = Buffer.from(data.image, "base64");
    if (buffer.length > 2500000)
      return res.status(413).json({ error: "Photo must be under 2.5 MB." });
    let output;
    try {
      const image = sharp(buffer, {
        limitInputPixels: 40000000,
        animated: false,
      });
      const meta = await image.metadata();
      if (!["jpeg", "png", "webp"].includes(meta.format)) throw Error();
      output = await image
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      return res
        .status(400)
        .json({ error: "Choose a valid JPEG, PNG or WebP photo." });
    }
    const id = randomUUID();
    await require("@vercel/blob").put(`media/${id}.webp`, output, {
      access: "private",
      addRandomSuffix: false,
      contentType: "image/webp",
    });
    await c.write(`media/${id}.json`, { id });
    return res.json({ id });
  }
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed." });
  const id = req.query.id;
  if (!c.UUID.test(id || "")) return res.status(404).end();
  const staffSession = await c.activeSession(req);
  if (!staffSession) {
    const site = await c.read("content/site.json");
    if (
      !site?.data.photos.some((photo) => photo.id === id && photo.published) &&
      !site?.data.news.some((item) => item.imageId === id && visible(item))
    )
      return res.status(404).end();
  }
  const image = await c.get(`media/${id}.webp`, { access: "private" });
  if (!image) return res.status(404).end();
  res.setHeader("Content-Type", "image/webp");
  res.setHeader(
    "Cache-Control",
    staffSession ? "no-store" : "private, max-age=60",
  );
  c.Readable.fromWeb(image.stream).pipe(res);
});
