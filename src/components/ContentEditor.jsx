import React from "react";
export const categories = {
  campus: "Campus",
  learning: "Learning",
  "student-life": "Student life",
  community: "Community",
  information: "Information",
};
function Field({ label, value, onChange, multiline, ...props }) {
  const Input = multiline ? "textarea" : "input";
  return (
    <label className={multiline ? "full" : undefined}>
      {label}
      <Input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </label>
  );
}
export function ContentEditor({ content, setContent, save, busy, status }) {
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
            <h2>Keep families in the loop.</h2>
            <p>English is required. Add Myanmar text when available.</p>
          </div>
          <button className="primary" type="submit" disabled={busy}>
            Save changes ↗
          </button>
        </div>
        <div className="card">
          <h3>Announcement ribbon</h3>
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
          <h3>School news</h3>
          <button id="add-news" type="button" onClick={add} disabled={busy}>
            + Add news
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
                  Publish on the website
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
                Remove news
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
  busy,
}) {
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
          <h2>Life at Guru, in pictures.</h2>
          <p>
            Add photos to the existing gallery. JPEG, PNG or WebP, up to 2.5 MB.
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
            Photo
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <label>
            Category
            <select name="category">
              {Object.entries(categories).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Caption — English
            <input name="caption" maxLength={200} required />
          </label>
          <label>
            Caption — Myanmar
            <input name="captionMy" maxLength={200} />
          </label>
        </div>
        <label className="check">
          <input name="published" type="checkbox" defaultChecked />
          Publish on the website
        </label>
        <button className="primary" disabled={busy}>
          Upload photo ↗
        </button>
      </form>
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
                  Category
                  <select
                    value={item.category}
                    onChange={(event) =>
                      change(item.id, "category", event.target.value)
                    }
                  >
                    {Object.entries(categories).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
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
                  Published
                </label>
              </div>
              <div className="editor-actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => savePhoto(item)}
                >
                  Save photo changes
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removePhoto(item)}
                >
                  Remove from website
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
