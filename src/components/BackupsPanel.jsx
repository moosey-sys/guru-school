import React, { useEffect, useState } from "react";
import { usePreferences } from "../preferences";
export function BackupsPanel({ api, work, busy, restore, session }) {
  const { t } = usePreferences();
  const [items, setItems] = useState([]),
    [cursor, setCursor] = useState(null),
    [selected, setSelected] = useState(null);
  async function refresh(more = false) {
    const data = await api(
      "/api/backups" +
        (more && cursor ? "?cursor=" + encodeURIComponent(cursor) : ""),
    );
    setItems((old) => (more ? [...old, ...data.items] : data.items));
    setCursor(data.cursor);
  }
  useEffect(() => {
    work(() => refresh());
  }, []);
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>{t("Security & backups")}</h2>
          <p>
            {t(
              "Private snapshots protect your announcements, news, gallery captions, albums and visibility settings.",
            )}
          </p>
        </div>
        <button
          disabled={busy}
          onClick={() =>
            work(async () => {
              await api("/api/backups", { method: "POST", body: "{}" });
              await refresh();
            })
          }
        >
          {t("Create backup")}
        </button>
      </div>
      <div className="card">
        <h3>{t("Two-step sign-in")}</h3>
        <p>
          {t(
            session.twoFactor
              ? "Your session was verified with an email code. New sign-ins require your password and a one-time code from the school admin inbox."
              : "New production sign-ins require your password and a one-time code from the school admin inbox.",
          )}
        </p>
      </div>
      <div className="card">
        <h3>{t("Website content backups")}</h3>
        <p>
          {t(
            "A snapshot is saved before every content change. Uploaded images stay in private storage so previous galleries can be restored. Restoring content does not change enquiries, visitor statistics or visit times.",
          )}
        </p>
        {!items.length && (
          <p>{t("No backups yet. Create your first backup above.")}</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="visit-slot-row">
            <span>
              {new Date(item.created).toLocaleString("en-GB", {
                timeZone: "Asia/Yangon",
              })}{" "}
              · {item.news} {t("news items")} · {item.photos}{" "}
              {t("uploaded photos")}
            </span>
            <button disabled={busy} onClick={() => setSelected(item)}>
              {t("Restore this backup")}
            </button>
          </div>
        ))}
      </div>
      {cursor && (
        <button disabled={busy} onClick={() => work(() => refresh(true))}>
          {t("Load older backups")}
        </button>
      )}
      {selected && (
        <div className="card" role="alert">
          <p>
            {t(
              "Restore the selected website content? A backup of your current content will be saved first.",
            )}
          </p>
          <button disabled={busy} onClick={() => setSelected(null)}>
            {t("Cancel")}
          </button>
          <button
            className="primary"
            disabled={busy}
            onClick={() =>
              work(async () => {
                await restore(selected.id);
                setSelected(null);
                await refresh();
              })
            }
          >
            {t("Confirm restore")}
          </button>
        </div>
      )}
    </section>
  );
}
