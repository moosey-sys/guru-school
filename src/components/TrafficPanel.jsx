import React, { useState } from "react";
import { yangonDate } from "../api";
const fmt = (value) => new Intl.NumberFormat("en").format(value);
export const monthNames = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2026, i, 1)),
  ),
);
export function TrafficChart({ rows, measure, period }) {
  const max = Math.max(1, ...rows.map((row) => row[measure]));
  const step = Math.max(1, Math.ceil(max / 4));
  const spacing = 930 / Math.max(1, rows.length);
  const width = Math.min(48, spacing * 0.62);
  const label = measure === "visitors" ? "Unique visitors" : "Visits";
  return (
    <div
      id="traffic-chart"
      className="traffic-chart"
      role="img"
      aria-label={`${label} by ${period} period`}
    >
      <svg
        viewBox="0 0 1000 300"
        role="img"
        aria-label={`${label}, ${period} traffic. ${rows.map((row) => `${row.key}: ${row[measure]}`).join("; ")}`}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i}>
            <line
              x1="55"
              x2="985"
              y1={250 - i * 52}
              y2={250 - i * 52}
              className="chart-grid"
            />
            <text
              x="44"
              y={254 - i * 52}
              textAnchor="end"
              className="chart-tick"
            >
              {fmt(step * i)}
            </text>
          </g>
        ))}
        <text x="55" y="20" className="chart-tick">
          {label}
        </text>
        {rows.map((row, i) => {
          const height = (row[measure] / (step * 4)) * 208;
          const x = 55 + i * spacing + spacing / 2;
          return (
            <g key={row.key}>
              <rect
                x={x - width / 2}
                y={250 - height}
                width={width}
                height={Math.max(height, row[measure] ? 3 : 0)}
                rx="4"
                className="chart-bar"
                tabIndex={0}
              >
                <title>{`${row.key}: ${fmt(row.visitors)} unique visitors, ${fmt(row.visits)} visits`}</title>
              </rect>
              {(rows.length <= 16 || i % 2 === 0) && (
                <text x={x} y="276" textAnchor="middle" className="chart-tick">
                  {row.label}
                </text>
              )}
              {row[measure] > 0 && rows.length <= 16 && (
                <text
                  x={x}
                  y={240 - height}
                  textAnchor="middle"
                  className="chart-label"
                >
                  {fmt(row[measure])}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
export function TrafficPanel({
  analytics,
  inbox,
  content,
  refresh,
  busy,
  selection,
  setSelection,
  updated,
}) {
  const [period, setPeriod] = useState("daily");
  const [measure, setMeasure] = useState("visitors");
  const rows = analytics?.[period] || [];
  const total = rows.reduce((sum, row) => sum + row[measure], 0);
  const availableYears = [
    ...new Set([...(analytics?.availableYears || []), selection.year]),
  ]
    .sort()
    .reverse();
  const metrics = [
    { key: "today", label: "Visitors today", icon: "↗" },
    { key: "month", label: "Visitors this month", icon: "▦" },
    { key: "year", label: "Visitors this year", icon: "◷" },
  ];
  function exportCsv() {
    if (!analytics) return;
    const csv = [
      "Period,Unique browser visitors,Visits",
      ...rows.map((row) => `${row.key},${row.visitors},${row.visits}`),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `guru-traffic-${period}-${selection.year}-${selection.month}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section id="panel-overview">
      <div className="overview-top">
        <div>
          <span className="live-dot" />
          <span id="analytics-updated">{updated}</span>
        </div>
        <button
          id="refresh-analytics"
          type="button"
          disabled={busy}
          onClick={refresh}
        >
          ↻ Refresh traffic
        </button>
      </div>
      <div className="metric-grid">
        {metrics.map(({ key, label, icon }) => (
          <article className="metric-card" key={key}>
            <span className="metric-icon" aria-hidden="true">
              {icon}
            </span>
            <p>{label}</p>
            <strong id={"metric-" + key}>
              {analytics ? fmt(analytics[key].visitors) : "—"}
            </strong>
            <small id={"metric-" + key + "-visits"}>
              {analytics
                ? `${fmt(analytics[key].visits)} visits · unique browsers`
                : "Unique browser visitors"}
            </small>
          </article>
        ))}
        <article className="metric-card accent-card">
          <span className="metric-icon" aria-hidden="true">
            ✉
          </span>
          <p>New enquiries</p>
          <strong id="metric-enquiries">
            {fmt(inbox.filter((item) => item.status === "new").length)}
          </strong>
          <small>In the loaded inbox</small>
        </article>
      </div>
      <article className="chart-card card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WEBSITE ACTIVITY</p>
            <h2>Every visit is a new possibility.</h2>
            <p id="traffic-range">
              {period === "daily"
                ? `${monthNames[Number(selection.month) - 1]} ${selection.year} · day by day`
                : period === "monthly"
                  ? `${selection.year} · month by month`
                  : "All recorded years"}
            </p>
          </div>
          <button
            id="export-traffic"
            type="button"
            disabled={busy || !analytics}
            onClick={exportCsv}
          >
            Download CSV ↓
          </button>
        </div>
        <div className="chart-controls">
          <div className="segmented" role="group" aria-label="Traffic interval">
            {["daily", "monthly", "yearly"].map((value) => (
              <button
                key={value}
                data-period={value}
                aria-pressed={period === value}
                disabled={busy}
                onClick={() => setPeriod(value)}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          <div className="chart-selects">
            <label>
              Measure
              <select
                id="traffic-measure"
                value={measure}
                onChange={(event) => setMeasure(event.target.value)}
              >
                <option value="visitors">Unique visitors</option>
                <option value="visits">Visits</option>
              </select>
            </label>
            <label id="traffic-year-label" hidden={period === "yearly"}>
              Year
              <select
                id="traffic-year"
                value={selection.year}
                disabled={busy}
                onChange={(event) =>
                  setSelection({ ...selection, year: event.target.value })
                }
              >
                {availableYears.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </label>
            <label id="traffic-month-label" hidden={period !== "daily"}>
              Month
              <select
                id="traffic-month"
                value={selection.month}
                disabled={busy}
                onChange={(event) =>
                  setSelection({ ...selection, month: event.target.value })
                }
              >
                {monthNames.map((name, i) => (
                  <option value={String(i + 1).padStart(2, "0")} key={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <TrafficChart rows={rows} measure={measure} period={period} />
        {analytics && !total && (
          <p id="traffic-empty" className="chart-empty">
            No visits recorded for this period yet.
          </p>
        )}
        <div className="chart-footer">
          <p id="traffic-total">
            {measure === "visitors"
              ? `${fmt(total)} visitor-period counts · a returning browser can appear in multiple periods`
              : `${fmt(total)} visits in this view`}
          </p>
          <span>Myanmar time · Asia/Yangon</span>
        </div>
        <details className="traffic-details">
          <summary>View traffic data</summary>
          <div className="table-scroll">
            <table>
              <caption>Website traffic for the selected period</caption>
              <thead>
                <tr>
                  <th scope="col">Period</th>
                  <th scope="col">Unique visitors</th>
                  <th scope="col">Visits</th>
                </tr>
              </thead>
              <tbody id="traffic-table">
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">{row.key}</th>
                    <td>{fmt(row.visitors)}</td>
                    <td>{fmt(row.visits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </article>
      <div className="overview-bottom">
        <article className="card">
          <p className="eyebrow">YOUR PUBLISHING DESK</p>
          <h3>Keep your community connected.</h3>
          <div className="content-totals">
            <div>
              <strong id="metric-news">
                {content?.news.filter((item) => item.published).length || 0}
              </strong>
              <span>Published stories</span>
            </div>
            <div>
              <strong id="metric-photos">
                {content?.photos.filter((item) => item.published).length || 0}
              </strong>
              <span>Uploaded gallery photos</span>
            </div>
            <div>
              <strong id="metric-visits">
                {
                  inbox.filter(
                    (item) =>
                      item.kind === "Book a school visit" &&
                      !["confirmed", "closed"].includes(item.status),
                  ).length
                }
              </strong>
              <span>Open visit requests</span>
            </div>
          </div>
        </article>
        <article className="card tracking-note">
          <p className="eyebrow">ABOUT THESE NUMBERS</p>
          <h3>Visitors, with privacy in mind.</h3>
          <p>
            Visitors are counted by anonymous browser ID. A visit lasts up to 30
            minutes. Reloads stay in the same visit; different devices count
            separately.
          </p>
          <p id="tracking-start">
            {analytics?.firstTrackedDate
              ? `First recorded visit: ${analytics.firstTrackedDate}. Earlier traffic is unavailable.`
              : "Tracking has started. Your first visitor will appear here; earlier traffic is unavailable."}
          </p>
          <p>
            Signed-in staff, known bots and browsers requesting Do Not Track are
            excluded.
          </p>
        </article>
      </div>
    </section>
  );
}
export const initialSelection = () => ({
  year: yangonDate().slice(0, 4),
  month: yangonDate().slice(5, 7),
});
