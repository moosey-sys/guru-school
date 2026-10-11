import React, { useEffect, useRef, useState } from "react";
import { request } from "./api";
import { usePreferences } from "./preferences";
import { TrafficPanel, initialSelection } from "./components/TrafficPanel";
import { ContentEditor, PhotosEditor } from "./components/ContentEditor";
import { Inbox } from "./components/Inbox";
export default function AdminApp() {
  const { theme, toggleTheme } = usePreferences();
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("overview");
  const [content, setContent] = useState(null);
  const [version, setVersion] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selection, setSelection] = useState(initialSelection);
  const [updated, setUpdated] = useState("Loading visitor activity…");
  const [mailConfigured, setMailConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const lock = useRef(false);
  const csrf = useRef("");
  const analyticsRequest = useRef(0);
  const alive = useRef(true);
  function loggedOut() {
    csrf.current = "";
    setSession(null);
    setContent(null);
    setInbox([]);
    setAnalytics(null);
    setCursor(null);
    setVersion(null);
    setTab("overview");
    ++analyticsRequest.current;
  }
  async function api(path, options = {}) {
    try {
      return await request(path, {
        ...options,
        csrf:
          options.method && options.method !== "GET" ? csrf.current : undefined,
      });
    } catch (error) {
      if (error.status === 401) loggedOut();
      throw error;
    }
  }
  async function work(action) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setStatus("");
    try {
      await action();
    } catch (error) {
      setStatus(error.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function loadContent() {
    const result = await api("/api/content");
    if (!alive.current || !csrf.current) return;
    setContent(result.content);
    setVersion(result.version);
  }
  async function loadInbox(more = false) {
    const result = await api(
      `/api/inbox${more && cursor ? "?cursor=" + encodeURIComponent(cursor) : ""}`,
    );
    if (!alive.current || !csrf.current) return;
    setInbox((current) =>
      more
        ? [
            ...current,
            ...result.items.filter(
              (item) => !current.some((old) => old.id === item.id),
            ),
          ]
        : result.items,
    );
    setCursor(result.cursor);
    const setup = await api("/api/health");
    if (alive.current && csrf.current) setMailConfigured(setup.emailConfigured);
  }
  async function loadAnalytics(next = selection) {
    const id = ++analyticsRequest.current;
    setUpdated("Updating visitor activity…");
    try {
      const result = await api(
        `/api/analytics?year=${next.year}&month=${next.month}`,
      );
      if (!alive.current || id !== analyticsRequest.current || !csrf.current)
        return;
      setAnalytics(result);
      setUpdated(
        `Updated ${new Date(result.updated).toLocaleTimeString("en-GB", { timeZone: "Asia/Yangon", hour: "2-digit", minute: "2-digit" })} · Myanmar time`,
      );
    } catch (error) {
      if (id === analyticsRequest.current)
        setUpdated("Traffic could not be loaded. Use Refresh to try again.");
      throw error;
    }
  }
  async function signedIn(result) {
    if (!alive.current) return;
    csrf.current = result.csrf;
    setSession(result);
    const results = await Promise.allSettled([
      loadContent(),
      loadInbox(),
      loadAnalytics(),
    ]);
    if (alive.current)
      setStatus(
        results
          .filter((item) => item.status === "rejected")
          .map((item) => item.reason.message)
          .join(" "),
      );
  }
  useEffect(() => {
    alive.current = true;
    api("/api/session")
      .then(signedIn)
      .catch((error) => {
        if (alive.current) {
          loggedOut();
          if (error.status !== 401)
            setStatus("Unable to check your session. Please sign in again.");
        }
      });
    return () => {
      alive.current = false;
    };
  }, []);
  async function login(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    await work(async () => {
      await signedIn(
        await api("/api/session", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      );
      form.reset();
    });
  }
  async function saveSite(next = content) {
    const result = await api("/api/content", {
      method: "PUT",
      body: JSON.stringify({ content: next, version }),
    });
    setContent(result.content);
    setVersion(result.version);
    return result;
  }
  async function uploadNewsImage(id, file) {
    await work(async () => {
      if (!file || file.size > 2500000)
        throw Error("Choose a JPEG, PNG or WebP photo under 2.5 MB.");
      setStatus("Uploading news image…");
      const image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(Error("Could not read this photo."));
        reader.readAsDataURL(file);
      });
      const uploaded = await api("/api/media", {
        method: "POST",
        body: JSON.stringify({ image }),
      });
      setContent((current) => ({
        ...current,
        news: current.news.map((item) =>
          item.id === id ? { ...item, imageId: uploaded.id } : item,
        ),
      }));
      setStatus("News image uploaded. Save changes to apply it to the story.");
    });
  }
  async function upload(form) {
    await work(async () => {
      if (content.photos.length >= 100)
        throw Error("Maximum 100 uploaded gallery photos.");
      const file = form.elements.photo.files[0];
      if (!file || file.size > 2500000)
        throw Error("Choose a photo under 2.5 MB.");
      const fields = Object.fromEntries(new FormData(form));
      const published = form.elements.published.checked;
      setStatus("Uploading and preparing photo…");
      const image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(Error("Could not read this photo."));
        reader.readAsDataURL(file);
      });
      const uploaded = await api("/api/media", {
        method: "POST",
        body: JSON.stringify({ image }),
      });
      const next = {
        ...content,
        photos: [
          {
            id: uploaded.id,
            caption: fields.caption,
            captionMy: fields.captionMy,
            category: fields.category,
            published,
          },
          ...content.photos,
        ],
      };
      await saveSite(next);
      form.reset();
      setStatus("Photo uploaded and saved.");
    });
  }
  const choosePeriod = (next) => {
    setSelection(next);
    work(() => loadAnalytics(next));
  };
  return (
    <>
      <header>
        <a className="brand" href="/">
          <img
            src="/assets/crest.png"
            width="40"
            height="50"
            alt="Guru crest"
          />
          <span>
            GURU<small>STAFF DASHBOARD</small>
          </span>
        </a>
        <div className="header-actions">
          <button
            id="admin-theme-toggle"
            aria-pressed={theme === "dark"}
            type="button"
            onClick={toggleTheme}
          >
            {theme === "dark" ? "☀ Light mode" : "☾ Dark mode"}
          </button>
          <a href="/" target="_blank" rel="noopener">
            View website ↗
          </a>
          {session && (
            <button
              id="logout"
              disabled={busy}
              onClick={() =>
                work(async () => {
                  await api("/api/session", { method: "DELETE" });
                  loggedOut();
                  setStatus("Signed out.");
                })
              }
            >
              Sign out
            </button>
          )}
        </div>
      </header>
      <main>
        {!session ? (
          <section id="login-panel" className="login card">
            <p className="eyebrow">WELCOME BACK</p>
            <h1>
              A little care.
              <br />A big difference.
            </h1>
            <p>Sign in to keep your school community up to date.</p>
            <form id="login-form" onSubmit={login}>
              <label>
                Username
                <input
                  name="username"
                  autoComplete="username"
                  required
                  maxLength={100}
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={200}
                />
              </label>
              <button type="submit" className="primary" disabled={busy}>
                Sign in ↗
              </button>
            </form>
          </section>
        ) : (
          <div id="workspace">
            <div className="dashboard-heading">
              <div>
                <p className="eyebrow">YOUR SCHOOL, CONNECTED</p>
                <h1>A clearer view of your school.</h1>
                <p className="heading-caption">
                  Your community, conversations and latest updates — together.
                </p>
              </div>
              <p id="account">Signed in as {session.user}</p>
            </div>
            <nav aria-label="Dashboard sections">
              {[
                ["overview", "Overview & traffic"],
                ["inbox", "Enquiries & visits"],
                ["content", "Announcements & news"],
                ["photos", "Gallery"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  data-tab={value}
                  aria-pressed={tab === value}
                  disabled={busy}
                  onClick={() => {
                    setTab(value);
                    setStatus("");
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div hidden={tab !== "overview"}>
              <TrafficPanel
                analytics={analytics}
                inbox={inbox}
                content={content}
                refresh={() => work(() => loadAnalytics())}
                busy={busy}
                selection={selection}
                setSelection={choosePeriod}
                updated={updated}
              />
            </div>
            <div hidden={tab !== "inbox"}>
              <Inbox
                items={inbox}
                cursor={cursor}
                refresh={() =>
                  work(async () => {
                    await loadInbox();
                    setStatus("Inbox refreshed.");
                  })
                }
                more={() => work(() => loadInbox(true))}
                busy={busy}
                mailConfigured={mailConfigured}
                save={(item, status, notes) =>
                  work(async () => {
                    const result = await api("/api/inbox", {
                      method: "PATCH",
                      body: JSON.stringify({
                        id: item.id,
                        createdKey: item.createdKey,
                        version: item.version,
                        status,
                        notes,
                      }),
                    });
                    setInbox((current) =>
                      current.map((old) =>
                        old.id === item.id ? result.item : old,
                      ),
                    );
                    setStatus(
                      "Request updated. Status changes do not send an email; contact the family to confirm.",
                    );
                  })
                }
              />
            </div>
            <div hidden={tab !== "content"}>
              {content ? (
                <ContentEditor
                  content={content}
                  setContent={setContent}
                  busy={busy}
                  status={setStatus}
                  uploadNewsImage={uploadNewsImage}
                  save={() =>
                    work(async () => {
                      await saveSite();
                      setStatus(
                        "Changes saved. Published content is now available on the website.",
                      );
                    })
                  }
                />
              ) : (
                <p>
                  Content could not be loaded.{" "}
                  <button disabled={busy} onClick={() => work(loadContent)}>
                    Reload content
                  </button>
                </p>
              )}
            </div>
            <div hidden={tab !== "photos"}>
              {content ? (
                <PhotosEditor
                  content={content}
                  setContent={setContent}
                  upload={upload}
                  busy={busy}
                  savePhoto={(item) =>
                    work(async () => {
                      if (!item.caption.trim())
                        throw Error("English caption is required.");
                      await saveSite();
                      setStatus("Photo changes saved.");
                    })
                  }
                  removePhoto={(item) =>
                    work(async () => {
                      await saveSite({
                        ...content,
                        photos: content.photos.filter(
                          (photo) => photo.id !== item.id,
                        ),
                      });
                      setStatus(
                        "Photo removed from the website. Stored image retained.",
                      );
                    })
                  }
                />
              ) : (
                <p>
                  Gallery content could not be loaded.{" "}
                  <button disabled={busy} onClick={() => work(loadContent)}>
                    Reload content
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
        <p id="global-status" role="status" aria-live="polite">
          {status}
        </p>
      </main>
      <footer>Guru International School · Staff access only</footer>
    </>
  );
}
