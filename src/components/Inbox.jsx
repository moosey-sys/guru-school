import { usePreferences } from "../preferences";
import React, { useState } from "react";
function RequestCard({ item, save, remove, busy }) {
  const { t, language } = usePreferences();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const [status, setStatus] = useState(item.status);
  return (
    <article className="card">
      <div className="request-heading">
        <h3>{item.name}</h3>
        <div className="request-badges">
          <span className="badge">{t(item.kind)}</span>
          <span className={`badge request-status status-${item.status}`}>
            {t(
              {
                new: "New",
                "in-progress": "In progress",
                confirmed: "Confirmed",
                closed: "Closed",
              }[item.status] || item.status,
            )}
          </span>
        </div>
      </div>
      <div className="request-info">
        <a href={`mailto:${item.email}`}>{item.email}</a>
        {item.phone && (
          <a href={`tel:${item.phone.replace(/[^+0-9]/g, "")}`}>{item.phone}</a>
        )}
        <span>
          {new Date(item.created).toLocaleString(
            language === "my" ? "my-MM" : "en-GB",
            {
              timeZone: "Asia/Yangon",
            },
          )}
        </span>
      </div>
      {item.date && (
        <p>
          {t("Preferred visit:")} {item.date}
        </p>
      )}
      <div className="message">{item.message}</div>
      {item.emailStatus === "failed" && (
        <p className="request-email-warning">
          {t("Email notification failed. This message is saved here.")}
        </p>
      )}
      <details className="request-notes">
        <summary>
          {t("Team notes")}
          {t(notes ? " · added" : " (optional)")}
        </summary>
        <label>
          {t("Internal team notes")}
          <textarea
            value={notes}
            maxLength={2000}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </details>
      <div className="request-actions">
        <label>
          {t("Status")}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {["new", "in-progress", "confirmed", "closed"].map((value) => (
              <option key={value} value={value}>
                {t(value.replace("-", " "))}
              </option>
            ))}
          </select>
        </label>
        <button disabled={busy} onClick={() => save(item, status, notes)}>
          {t("Save update")}
        </button>
        <a
          href={`mailto:${item.email}?subject=${encodeURIComponent("Re: Guru school enquiry")}`}
        >
          {t("Reply by email ↗")}
        </a>
        <button
          className="request-delete"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          {t("Delete message")}
        </button>
      </div>
      {confirmDelete && (
        <div className="delete-confirmation" role="alert">
          <p>
            {t("Delete this message from")} {item.name}
            {t(
              "? This permanently removes the dashboard record and team notes. Emails already in your mailbox remain.",
            )}
          </p>
          <button disabled={busy} onClick={() => setConfirmDelete(false)}>
            {t("Cancel")}
          </button>
          <button
            className="request-delete"
            disabled={busy}
            onClick={() => remove(item)}
          >
            {t("Confirm deletion")}
          </button>
        </div>
      )}
    </article>
  );
}
export function Inbox({
  items,
  cursor,
  refresh,
  more,
  save,
  remove,
  busy,
  mailConfigured,
}) {
  const { t, language } = usePreferences();
  const [filter, setFilter] = useState("all");
  const matching = items.filter(
    (item) =>
      filter === "all" ||
      (filter === "visits"
        ? item.kind === "Book a school visit"
        : item.status === filter),
  );
  return (
    <section id="panel-inbox">
      <div className="section-heading">
        <div>
          <h2>{t("Enquiries & visits")}</h2>
          <p>{t("Read messages, contact families and track requests.")}</p>
        </div>
        <button id="refresh-inbox" disabled={busy} onClick={refresh}>
          {t("Refresh")}
        </button>
      </div>
      {!mailConfigured && (
        <div id="mail-status" className="notice">
          {t("Email notifications are unavailable. Messages are saved here.")}
        </div>
      )}
      <div className="filters">
        <label>
          {t("Show")}
          <select
            id="status-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            {[
              ["all", "All requests"],
              ["new", "New"],
              ["in-progress", "In progress"],
              ["confirmed", "Confirmed"],
              ["closed", "Closed"],
              ["visits", "Visit requests"],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
        </label>
        <span id="inbox-count">
          {matching.length} {t("shown")}
          {cursor ? ` · ${items.length} ${t("loaded")}` : ""}
        </span>
      </div>
      <div id="inbox-list">
        {matching.length ? (
          matching.map((item) => (
            <RequestCard
              key={item.id + ":" + item.version}
              item={item}
              busy={busy}
              save={save}
              remove={remove}
            />
          ))
        ) : (
          <div className="card">
            {t(
              items.length
                ? "No requests match this filter."
                : "No enquiries yet. New messages will appear here.",
            )}
          </div>
        )}
      </div>
      {cursor && (
        <button id="load-more" disabled={busy} onClick={more}>
          {t("Load more requests")}
        </button>
      )}
    </section>
  );
}
