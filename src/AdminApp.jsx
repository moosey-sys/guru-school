import React, { useEffect, useRef, useState } from "react";
import { request } from "./api";
import { usePreferences } from "./preferences";
import { TrafficPanel, initialSelection } from "./components/TrafficPanel";
import { ContentEditor, PhotosEditor } from "./components/ContentEditor";
import { Inbox } from "./components/Inbox";
export default function AdminApp() {
  const { theme, toggleTheme, language, selectLanguage, t } = usePreferences();
  const [challenge, setChallenge] = useState(null);
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
  const shell = useRef(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        shell.current?.style.setProperty(
          "--parallax-offset",
          `${reduced.matches ? 0 : Math.min(window.scrollY * 0.08, 120)}px`,
        );
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    reduced.addEventListener("change", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      reduced.removeEventListener("change", update);
    };
  }, []);
  const lock = useRef(false);
  const csrf = useRef("");
  const inboxFilters = useRef({});
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
  async function loadInbox(more = false, filters = null) {
    const params = new URLSearchParams(filters || inboxFilters.current);
    if (more && cursor) params.set("cursor", cursor);
    const result = await api(
      "/api/inbox" + (params.size ? "?" + params.toString() : ""),
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
    const resume = (event) => {
      if (event.persisted) {
        loggedOut();
        api("/api/session")
          .then(signedIn)
          .catch(() => {});
      }
    };
    window.addEventListener("pageshow", resume);
    return () => {
      alive.current = false;
      window.removeEventListener("pageshow", resume);
    };
  }, []);
  async function login(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    await work(async () => {
      const result = await request("/api/session", {
        method: "POST",
        body: JSON.stringify(challenge ? { challenge, code: data.code } : data),
      });
      if (result.challenge) {
        setChallenge(result.challenge);
        setStatus(result.message);
      } else {
        setChallenge(null);
        await signedIn(result);
      }
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
            album: String(fields.album || "").trim(),
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
    <div className="admin-shell" ref={shell}>
      <a className="admin-skip" href="#admin-main">
        {t("Skip to content")}
      </a>
      <div className="admin-decoration" aria-hidden="true">
        <span className="deco-square" />
        <span className="deco-ring" />
        <span className="deco-cross">✳</span>
      </div>
      <header>
        <a className="brand" href="/">
          <img
            src="/assets/crest.png"
            width="40"
            height="50"
            alt="Guru crest"
          />
          <span>
            GURU<small>{t("STAFF DASHBOARD")}</small>
          </span>
        </a>
        <div className="header-actions">
          <div
            className="admin-language"
            role="group"
            aria-label="Dashboard language"
          >
            <button
              type="button"
              lang="en"
              aria-pressed={language === "en"}
              onClick={() => selectLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              lang="my"
              aria-pressed={language === "my"}
              onClick={() => selectLanguage("my")}
            >
              မြန်မာ
            </button>
          </div>
          <button
            id="admin-theme-toggle"
            aria-pressed={theme === "dark"}
            type="button"
            onClick={toggleTheme}
          >
            {t(theme === "dark" ? "☀ Light mode" : "☾ Dark mode")}
          </button>
          <a href="/" target="_blank" rel="noopener">
            {t("View website ↗")}
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
              {t("Sign out")}
            </button>
          )}
        </div>
      </header>
      <main id="admin-main" tabIndex={-1}>
        {!session ? (
          <section id="login-panel" className="login card">
            <p className="eyebrow">{t("WELCOME BACK")}</p>
            <h1>
              {t("A little care.")}
              <br />
              {t("A big difference.")}
            </h1>
            <p>{t("Sign in to keep your school community up to date.")}</p>
            <form id="login-form" onSubmit={login}>
              {!challenge && (
                <>
                  <label>
                    {t("Username")}
                    <input
                      name="username"
                      autoComplete="username"
                      required
                      maxLength={100}
                    />
                  </label>
                  <label>
                    {t("Password")}
                    <input
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      maxLength={200}
                    />
                  </label>
                </>
              )}
              {challenge && (
                <>
                  <p>
                    {t(
                      "Enter the six-digit code sent to the school admin inbox. It expires in 10 minutes.",
                    )}
                  </p>
                  <label>
                    {t("Sign-in code")}
                    <input
                      name="code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      autoComplete="one-time-code"
                      required
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setChallenge(null);
                      setStatus("");
                    }}
                  >
                    {t("Start sign-in again")}
                  </button>
                </>
              )}
              <button type="submit" className="primary" disabled={busy}>
                {t("Sign in ↗")}
              </button>
            </form>
          </section>
        ) : (
          <div id="workspace">
            <div className="dashboard-heading">
              <div>
                <p className="eyebrow">{t("YOUR SCHOOL, CONNECTED")}</p>
                <h1>{t("A clearer view of your school.")}</h1>
                <p className="heading-caption">
                  {t(
                    "Your community, conversations and latest updates — together.",
                  )}
                </p>
              </div>
              <p id="account">
                {t("Signed in as")} {session.user}
              </p>
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
                  {t(label)}
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
                filterRequests={(filters) =>
                  work(async () => {
                    inboxFilters.current = filters;
                    await loadInbox(false, filters);
                  })
                }
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
                remove={(item) =>
                  work(async () => {
                    await api("/api/inbox", {
                      method: "DELETE",
                      body: JSON.stringify({
                        id: item.id,
                        createdKey: item.createdKey,
                        version: item.version,
                      }),
                    });
                    setInbox((current) =>
                      current.filter((old) => old.id !== item.id),
                    );
                    setStatus(
                      "Message deleted from the dashboard. Existing emails remain in your mailbox.",
                    );
                  })
                }
                save={(item, status, notes, extra = {}) =>
                  work(async () => {
                    const result = await api("/api/inbox", {
                      method: "PATCH",
                      body: JSON.stringify({
                        id: item.id,
                        createdKey: item.createdKey,
                        version: item.version,
                        status,
                        notes,
                        ...extra,
                      }),
                    });
                    setInbox((current) =>
                      current.map((old) =>
                        old.id === item.id ? result.item : old,
                      ),
                    );
                    setStatus(
                      extra.notify
                        ? result.item.visitEmailStatus === "accepted"
                          ? "Visit email accepted for delivery."
                          : "Visit saved, but the email could not be sent. Please contact the family."
                        : "Request updated. Status changes do not send an email; contact the family to confirm.",
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
                  {t("Content could not be loaded.")}{" "}
                  <button disabled={busy} onClick={() => work(loadContent)}>
                    {t("Reload content")}
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
                  saveAlbums={() =>
                    work(async () => {
                      await saveSite();
                      setStatus("Gallery albums saved.");
                    })
                  }
                  toggleExisting={(image, hidden) =>
                    work(async () => {
                      const hiddenGallery = content.hiddenGallery || [];
                      await saveSite({
                        ...content,
                        hiddenGallery: hidden
                          ? hiddenGallery.filter((value) => value !== image)
                          : [...hiddenGallery, image],
                      });
                      setStatus(
                        hidden
                          ? "Photo is visible on the website."
                          : "Photo hidden from the website. You can show it again here.",
                      );
                    })
                  }
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
                  {t("Gallery content could not be loaded.")}{" "}
                  <button disabled={busy} onClick={() => work(loadContent)}>
                    {t("Reload content")}
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
        <p id="global-status" role="status" aria-live="polite">
          {t(status)}
        </p>
      </main>
      <footer>{t("Guru International School · Staff access only")}</footer>
    </div>
  );
}
