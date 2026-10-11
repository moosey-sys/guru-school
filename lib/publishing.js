function visible(item, now = Date.now()) {
  return (
    !!item.published && (!item.publishAt || Date.parse(item.publishAt) <= now)
  );
}
module.exports = { visible };
