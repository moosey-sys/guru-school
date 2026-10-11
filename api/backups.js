const c = require("../lib/core"),
  b = require("../lib/backups");
module.exports = c.wrap(async (req, res) => {
  c.staff(req, req.method !== "GET");
  if (req.method === "GET") {
    const page = await c.list({
      prefix: "backups/",
      limit: 30,
      ...(req.query.cursor ? { cursor: req.query.cursor } : {}),
    });
    const items = await Promise.all(
      page.blobs.map(async (blob) => {
        const record = await c.read(blob.pathname);
        if (!record) return null;
        const { id, created, reason, content } = record.data;
        return {
          id,
          created,
          reason,
          news: content.news?.length || 0,
          photos: content.photos?.length || 0,
        };
      }),
    );
    return res.json({
      items: items.filter(Boolean),
      cursor: page.hasMore ? page.cursor : null,
    });
  }
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed." });
  const content = await c.read("content/site.json");
  if (!content)
    return res
      .status(400)
      .json({ error: "Save your website content before creating a backup." });
  const backup = await b.snapshot(content.data);
  res.json({ backup });
});
