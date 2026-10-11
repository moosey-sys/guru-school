import React, { useEffect, useState } from "react";
import { usePreferences } from "../preferences";
import { yangonDate } from "../api";
export function VisitsPanel({ api, work, busy, items, onRefresh }) {
  const { t, language } = usePreferences();
  const [month, setMonth] = useState(yangonDate().slice(0, 7)),
    [day, setDay] = useState("");
  const [yearNumber, monthNumber] = month.split("-").map(Number);
  const days = new Date(Date.UTC(yearNumber, monthNumber, 0)).getUTCDate();
  const offset =
    (new Date(Date.UTC(yearNumber, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const [slots, setSlots] = useState([]),
    [version, setVersion] = useState(null),
    [loaded, setLoaded] = useState(false);
  async function refresh() {
    const data = await api("/api/visits");
    setSlots(data.slots);
    setVersion(data.version);
    setLoaded(true);
  }
  useEffect(() => {
    work(refresh);
  }, []);
  async function save(next) {
    await api("/api/visits", {
      method: "PUT",
      body: JSON.stringify({ slots: next, version }),
    });
    await refresh();
  }
  const upcoming = items
    .filter(
      (item) => item.kind === "Book a school visit" && item.status !== "closed",
    )
    .sort((a, b) =>
      (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")),
    );
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>{t("Visit calendar")}</h2>
          <p>
            {t(
              "Create visit times in Myanmar time. Each time accepts one family; requests require your confirmation.",
            )}
          </p>
        </div>
        <button
          disabled={busy}
          onClick={() =>
            work(async () => {
              await refresh();
              await onRefresh();
            })
          }
        >
          {t("Refresh")}
        </button>
      </div>
      <div className="card">
        <label>
          {t("Calendar month")}
          <input
            type="month"
            value={month}
            onChange={(event) => {
              if (event.target.value) {
                setMonth(event.target.value);
                setDay("");
              }
            }}
          />
        </label>
        <div
          className="visit-calendar"
          role="group"
          aria-label={t("Visit calendar")}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <strong key={"weekday" + i}>
              {new Intl.DateTimeFormat(language === "my" ? "my-MM" : "en-GB", {
                weekday: "short",
                timeZone: "UTC",
              }).format(new Date(Date.UTC(2026, 9, 12 + i)))}
            </strong>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={"blank" + i} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = month + "-" + String(i + 1).padStart(2, "0"),
              count = slots.filter((slot) => slot.date === date).length;
            return (
              <button
                key={date}
                aria-pressed={day === date}
                onClick={() => setDay(day === date ? "" : date)}
              >
                {i + 1}
                {count > 0 && <small>{count}</small>}
              </button>
            );
          })}
        </div>
        <button onClick={() => setDay("")}>{t("All dates")}</button>
      </div>
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget,
            fields = Object.fromEntries(new FormData(form));
          work(async () => {
            await save([
              ...slots,
              { id: crypto.randomUUID(), ...fields, open: true },
            ]);
            form.reset();
          });
        }}
      >
        <h3>{t("Add an available visit time")}</h3>
        <div className="two-columns">
          <label>
            {t("Visit date")}
            <input name="date" type="date" min={yangonDate()} required />
          </label>
          <label>
            {t("Visit time (Myanmar time)")}
            <input name="time" type="time" required />
          </label>
        </div>
        <button disabled={busy || !loaded} className="primary">
          {t("Add visit time")}
        </button>
      </form>
      <div className="card">
        <h3>{t("Available and reserved times")}</h3>
        {loaded && !slots.length && (
          <p>
            {t(
              "No visit times yet. Families can still request a preferred date.",
            )}
          </p>
        )}
        <div className="visit-slot-list">
          {slots
            .filter((slot) => !day || slot.date === day)
            .map((slot) => (
              <div key={slot.id} className="visit-slot-row">
                <strong>
                  {slot.date} · {slot.time}
                </strong>
                <span>
                  {t(
                    slot.available
                      ? "Available"
                      : !slot.open
                        ? "Closed"
                        : "Reserved or past",
                  )}
                </span>
                <button
                  disabled={busy}
                  onClick={() =>
                    work(() =>
                      save(
                        slots.map((s) =>
                          s.id === slot.id ? { ...s, open: !s.open } : s,
                        ),
                      ),
                    )
                  }
                >
                  {t(slot.open ? "Close time" : "Open time")}
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    work(() => save(slots.filter((s) => s.id !== slot.id)))
                  }
                >
                  {t("Remove time")}
                </button>
              </div>
            ))}
        </div>
      </div>
      <div className="card">
        <h3>{t("Visit requests")}</h3>
        <p>
          {t(
            "Confirm or reschedule a family in Enquiries & visits. Load more enquiries there to include older requests.",
          )}
        </p>
        {upcoming.map((item) => (
          <div className="visit-slot-row" key={item.id}>
            <strong>
              {item.date} {item.time || ""}
            </strong>
            <span>{item.name}</span>
            <span className="badge">
              {t(
                item.status === "confirmed"
                  ? "Visit scheduled"
                  : "Awaiting confirmation",
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
