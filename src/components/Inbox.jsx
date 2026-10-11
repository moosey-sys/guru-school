import React, { useState } from "react";
function RequestCard({ item, save, busy }) {
  const [notes, setNotes] = useState(item.notes || "");
  const [status, setStatus] = useState(item.status);
  return (
    <article className="card">
      <div className="request-heading">
        <h3>{item.name}</h3>
        <span className="badge">{item.kind}</span>
      </div>
      <div className="request-info">
        <a href={`mailto:${item.email}`}>{item.email}</a>
        <span>{item.phone || "No phone supplied"}</span>
        <span>
          {new Date(item.created).toLocaleString("en-GB", {
            timeZone: "Asia/Yangon",
          })}
        </span>
      </div>
      {item.date && <p>Preferred visit: {item.date}</p>}
      <div className="message">{item.message}</div>
      <p className="muted">
        Email notification: {item.emailStatus} · Reference: {item.id}
      </p>
      <label>
        Internal team notes
        <textarea
          value={notes}
          maxLength={2000}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <div className="request-actions">
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {["new", "in-progress", "confirmed", "closed"].map((value) => (
              <option key={value} value={value}>
                {value.replace("-", " ")}
              </option>
            ))}
          </select>
        </label>
        <button disabled={busy} onClick={() => save(item, status, notes)}>
          Save status &amp; notes
        </button>
        <a
          href={`mailto:${item.email}?subject=${encodeURIComponent("Re: Guru school enquiry")}`}
        >
          Reply by email ↗
        </a>
      </div>
    </article>
  );
}
export function Inbox({
  items,
  cursor,
  refresh,
  more,
  save,
  busy,
  mailConfigured,
}) {
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
          <h2>Conversations start here.</h2>
          <p>
            View messages, track visit requests, and keep your team’s notes
            together.
          </p>
        </div>
        <button id="refresh-inbox" disabled={busy} onClick={refresh}>
          Refresh
        </button>
      </div>
      <div id="mail-status" className="notice">
        {mailConfigured
          ? "Enquiries are saved here. Email notifications are configured; each request shows its delivery status."
          : "Enquiries are saved here. Email notifications are not configured yet; review new messages in this dashboard."}
      </div>
      <div className="filters">
        <label>
          Show
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
                {label}
              </option>
            ))}
          </select>
        </label>
        <span id="inbox-count">
          {matching.length} shown · {items.length} loaded
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
            />
          ))
        ) : (
          <div className="card">No requests here yet.</div>
        )}
      </div>
      {cursor && (
        <button id="load-more" disabled={busy} onClick={more}>
          Load more requests
        </button>
      )}
    </section>
  );
}
