const c = require("../lib/core");
const { visible } = require("../lib/publishing");
const galleryImages = new Set(
  require("../lib/gallery.json").map((photo) => photo.image),
);
const categories = [
  "events",
  "graduation",
  "trips",
  "campus",
  "learning",
  "student-life",
  "community",
  "information",
];
function text(value, max, required = false) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw Object.assign(
      new Error("Please check content length and required fields."),
      { status: 400 },
    );
  return value.trim();
}
function bilingual(item, key, max, required = false) {
  return {
    [key]: text(item[key], max, required),
    [`${key}My`]: text(item[`${key}My`] || "", max),
  };
}
module.exports = c.wrap(async (req, res) => {
  if (!["GET", "PUT"].includes(req.method))
    return res.status(405).json({ error: "Method not allowed." });
  if (req.method === "PUT") await c.staff(req, true);
  const record = await c.read("content/site.json");
  const content = record?.data || {
    announcement: "A little curiosity. A world of possibility.",
    announcementMy: "စူးစမ်းလိုစိတ်မှ အခွင့်အလမ်းများဆီသို့။",
    news: [],
    photos: [],
  };
  if (req.method === "GET") {
    const isStaff = !!(await c.activeSession(req));
    return res.json({
      content: isStaff
        ? content
        : {
            ...content,
            news: content.news.filter((x) => visible(x)),
            photos: content.photos.filter((x) => x.published),
          },
      ...(isStaff ? { version: record?.etag || null } : {}),
    });
  }
  if (req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const data = c.json(req);
  if (data.version !== (record?.etag || null))
    return res
      .status(409)
      .json({ error: "Content changed. Reload before saving." });
  if (data.backupId !== undefined)
    return res
      .status(400)
      .json({ error: "Backup restoration is no longer supported." });
  const input = data.content;
  if (
    !input ||
    !Array.isArray(input.news) ||
    !Array.isArray(input.photos) ||
    input.news.length > 40 ||
    input.photos.length > 100 ||
    input.news.some(
      (item) => !item || typeof item !== "object" || Array.isArray(item),
    ) ||
    input.photos.some(
      (item) => !item || typeof item !== "object" || Array.isArray(item),
    )
  )
    return res
      .status(400)
      .json({ error: "Maximum 40 news items and 100 photos." });
  const hiddenGallery = input.hiddenGallery ?? content.hiddenGallery ?? [];
  if (
    !Array.isArray(hiddenGallery) ||
    hiddenGallery.length > galleryImages.size ||
    hiddenGallery.some((image) => !galleryImages.has(image)) ||
    new Set(hiddenGallery).size !== hiddenGallery.length
  )
    return res
      .status(400)
      .json({ error: "Invalid existing gallery photo selection." });
  const existingAlbums = input.existingAlbums ?? content.existingAlbums ?? {};
  if (
    !existingAlbums ||
    typeof existingAlbums !== "object" ||
    Array.isArray(existingAlbums) ||
    Object.entries(existingAlbums).some(
      ([image, album]) =>
        !galleryImages.has(image) ||
        typeof album !== "string" ||
        album.length > 100,
    )
  )
    return res.status(400).json({ error: "Invalid gallery album." });
  const clean = {
    existingAlbums: Object.fromEntries(
      Object.entries(existingAlbums).map(([image, album]) => [
        image,
        album.trim(),
      ]),
    ),
    ...bilingual(input, "announcement", 240, true),
    news: [],
    photos: [],
    hiddenGallery,
  };
  for (const item of input.news) {
    if (
      item.publishAt &&
      (typeof item.publishAt !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:\d{2})$/.test(
          item.publishAt,
        ) ||
        !Number.isFinite(Date.parse(item.publishAt)))
    )
      return res.status(400).json({ error: "Invalid publication time." });
    if (!c.UUID.test(item.id))
      return res.status(400).json({ error: "Invalid news ID." });
    let imageId = "";
    if (item.imageId) {
      if (
        !c.UUID.test(item.imageId) ||
        !(await c.read(`media/${item.imageId}.json`))
      )
        return res
          .status(400)
          .json({ error: "Upload a valid news image first." });
      imageId = item.imageId;
    }
    clean.news.push({
      id: item.id,
      imageId,
      ...bilingual({ ...item, imageAlt: item.imageAlt ?? "" }, "imageAlt", 200),
      ...bilingual(item, "title", 160, true),
      ...bilingual(item, "body", 3000, true),
      published: !!item.published,
      publishAt: item.publishAt ? new Date(item.publishAt).toISOString() : "",
      date: text(item.date, 10, true),
    });
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
      Number.isNaN(Date.parse(item.date)) ||
      new Date(item.date).toISOString().slice(0, 10) !== item.date
    )
      return res.status(400).json({ error: "Invalid date." });
  }
  for (const item of input.photos) {
    if (!c.UUID.test(item.id) || !categories.includes(item.category))
      return res.status(400).json({ error: "Invalid photo." });
    const image = await c.read(`media/${item.id}.json`);
    if (!image)
      return res.status(400).json({ error: "Upload the image first." });
    clean.photos.push({
      id: item.id,
      ...bilingual(item, "caption", 200, true),
      category: item.category,
      album: text(item.album || "", 100),
      published: !!item.published,
    });
  }
  if (
    new Set(clean.news.map((x) => x.id)).size !== clean.news.length ||
    new Set(clean.photos.map((x) => x.id)).size !== clean.photos.length
  )
    return res.status(400).json({ error: "Duplicate records." });
  const result = await c.write("content/site.json", clean, record?.etag);
  res.json({ content: clean, version: result.etag });
});
