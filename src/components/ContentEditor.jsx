import { usePreferences } from "../preferences";
import React from "react";
import { galleryPhotos } from "../content/gallery";
export const categories = {
  campus: "Campus",
  learning: "Learning",
  "student-life": "Student life",
  community: "Community",
  information: "Information",
};
function Field({ label, value, onChange, multiline, ...props }) {
  const { t, language } = usePreferences();
  const Input = multiline ? "textarea" : "input";
  return (
    <label className={multiline ? "full" : undefined}>
      {t(label)}
      <Input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </label>
  );
}
export function ContentEditor({
  content,
  setContent,
  save,
  busy,
  status,
  uploadNewsImage,
}) {
  const { t, language } = usePreferences();
  const changeNews = (id, key, value) =>
    setContent((current) => ({
      ...current,
      news: current.news.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  function add() {
    if (content.news.length >= 40) return status("Maximum 40 news items.");
    setContent((current) => ({
      ...current,
      news: [
        {
          id: crypto.randomUUID(),
          title: "",
          titleMy: "",
          body: "",
          bodyMy: "",
          date: new Date().toISOString().slice(0, 10),
          published: false,
        },
        ...current.news,
      ],
    }));
  }
  return (
    <section id="panel-content">
      <form
        id="content-form"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="section-heading">
          <div>
            <h2>{t("Keep families in the loop.")}</h2>
            <p>{t("English is required. Add Myanmar text when available.")}</p>
          </div>
          <button className="primary" type="submit" disabled={busy}>
            {t("Save changes ↗")}
          </button>
        </div>
        <div className="card">
          <h3>{t("Announcement ribbon")}</h3>
          <div className="two-columns">
            <Field
              label="Announcement — English"
              id="announcement"
              value={content.announcement}
              onChange={(value) =>
                setContent((current) => ({ ...current, announcement: value }))
              }
              maxLength={240}
              required
            />
            <Field
              label="Announcement — Myanmar"
              id="announcement-my"
              value={content.announcementMy}
              onChange={(value) =>
                setContent((current) => ({ ...current, announcementMy: value }))
              }
              maxLength={240}
            />
          </div>
        </div>
        <div className="section-heading">
          <h3>{t("School news")}</h3>
          <button id="add-news" type="button" onClick={add} disabled={busy}>
            {t("+ Add news")}
          </button>
        </div>
        <div id="news-editor">
          {content.news.map((item) => (
            <article className="card" key={item.id}>
              <div className="two-columns">
                <Field
                  label="Title — English"
                  value={item.title}
                  onChange={(value) => changeNews(item.id, "title", value)}
                  maxLength={160}
                  required
                />
                <Field
                  label="Title — Myanmar"
                  value={item.titleMy}
                  onChange={(value) => changeNews(item.id, "titleMy", value)}
                  maxLength={160}
                />
                <Field
                  label="Date"
                  type="date"
                  value={item.date}
                  onChange={(value) => changeNews(item.id, "date", value)}
                  required
                />
                <label className="check">
                  <input
                    type="checkbox"
                    checked={item.published}
                    onChange={(event) =>
                      changeNews(item.id, "published", event.target.checked)
                    }
                  />
                  {t("Publish on the website")}
                </label>
                <Field
                  label="Story — English"
                  value={item.body}
                  onChange={(value) => changeNews(item.id, "body", value)}
                  maxLength={3000}
                  required
                  multiline
                />
                <Field
                  label="Story — Myanmar"
                  value={item.bodyMy}
                  onChange={(value) => changeNews(item.id, "bodyMy", value)}
                  maxLength={3000}
                  multiline
                />
              </div>
              <div className="news-image-editor">
                <label>
                  {t("News image (optional)")}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={busy}
                    onChange={(event) => {
                      const file = event.target.files[0];
                      if (file) uploadNewsImage(item.id, file);
                      event.target.value = "";
                    }}
                  />
                </label>
                <p>
                  {t(
                    "JPEG, PNG or WebP, up to 2.5 MB. Save changes after uploading.",
                  )}
                </p>
                {item.imageId && (
                  <>
                    <img
                      src={`/api/media?id=${item.imageId}`}
                      alt={item.imageAlt || item.title || "News image preview"}
                    />
                    <div className="two-columns">
                      <Field
                        label="Image description — English"
                        value={item.imageAlt}
                        maxLength={200}
                        onChange={(value) =>
                          changeNews(item.id, "imageAlt", value)
                        }
                      />
                      <Field
                        label="Image description — Myanmar"
                        value={item.imageAltMy}
                        maxLength={200}
                        onChange={(value) =>
                          changeNews(item.id, "imageAltMy", value)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => changeNews(item.id, "imageId", "")}
                    >
                      {t("Remove image")}
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setContent((current) => ({
                    ...current,
                    news: current.news.filter((news) => news.id !== item.id),
                  }));
                  status(
                    "News removed from the editor. Save changes to apply.",
                  );
                }}
              >
                {t("Remove news")}
              </button>
            </article>
          ))}
        </div>
      </form>
    </section>
  );
}
export function PhotosEditor({
  content,
  setContent,
  upload,
  savePhoto,
  removePhoto,
  toggleExisting,
  busy,
}) {
  const { t, language } = usePreferences();
  const change = (id, key, value) =>
    setContent((current) => ({
      ...current,
      photos: current.photos.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  return (
    <section id="panel-photos">
      <div className="section-heading">
        <div>
          <h2>{t("Life at Guru, in pictures.")}</h2>
          <p>
            {t(
              "Add photos to the existing gallery. JPEG, PNG or WebP, up to 2.5 MB.",
            )}
          </p>
        </div>
      </div>
      <form
        id="photo-form"
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          upload(event.currentTarget);
        }}
      >
        <div className="two-columns">
          <label>
            {t("Photo")}
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <label>
            {t("Category")}
            <select name="category">
              {Object.entries(categories).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Caption — English")}
            <input name="caption" maxLength={200} required />
          </label>
          <label>
            {t("Caption — Myanmar")}
            <input name="captionMy" maxLength={200} />
          </label>
        </div>
        <label className="check">
          <input name="published" type="checkbox" defaultChecked />
          {t("Publish on the website")}
        </label>
        <button className="primary" disabled={busy}>
          {t("Upload photo ↗")}
        </button>
      </form>
      <section className="existing-gallery">
        <div className="section-heading">
          <div>
            <h3>{t("Existing website photos")}</h3>
            <p>
              {t(
                "Hide a photo to remove it from the gallery. You can show it again at any time.",
              )}
            </p>
          </div>
          <span>
            {galleryPhotos.length - (content.hiddenGallery || []).length}{" "}
            {t("of")} {galleryPhotos.length} {t("visible")}
          </span>
        </div>
        <div className="existing-photo-grid">
          {galleryPhotos.map((photo) => {
            const hidden = (content.hiddenGallery || []).includes(photo.image);
            return (
              <article className="card existing-photo" key={photo.image}>
                <img
                  src={`/assets/${photo.image}`}
                  alt={photo.caption}
                  loading="lazy"
                />
                <div>
                  <span className="badge">
                    {t(hidden ? "Hidden" : "Visible")}
                  </span>
                  <h4>{photo.caption}</h4>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`${hidden ? "Show" : "Hide"} ${photo.caption}`}
                    onClick={() => toggleExisting(photo.image, hidden)}
                  >
                    {t(hidden ? "Show on website" : "Hide from website")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {content.photos.length > 0 && <h3>{t("Uploaded photos")}</h3>}
      <div id="photos-editor">
        {content.photos.map((item) => (
          <article key={item.id} className="card photo-editor">
            <img src={`/api/media?id=${item.id}`} alt={item.caption} />
            <div>
              <div className="two-columns">
                <Field
                  label="Caption — English"
                  value={item.caption}
                  onChange={(value) => change(item.id, "caption", value)}
                  maxLength={200}
                  required
                />
                <Field
                  label="Caption — Myanmar"
                  value={item.captionMy}
                  onChange={(value) => change(item.id, "captionMy", value)}
                  maxLength={200}
                />
                <label>
                  {t("Category")}
                  <select
                    value={item.category}
                    onChange={(event) =>
                      change(item.id, "category", event.target.value)
                    }
                  >
                    {Object.entries(categories).map(([value, label]) => (
                      <option key={value} value={value}>
                        {t(label)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={item.published}
                    onChange={(event) =>
                      change(item.id, "published", event.target.checked)
                    }
                  />
                  {t("Published")}
                </label>
              </div>
              <div className="editor-actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => savePhoto(item)}
                >
                  {t("Save photo changes")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removePhoto(item)}
                >
                  {t("Remove from website")}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
