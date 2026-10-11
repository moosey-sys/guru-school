import { ResponsiveImage } from "./components/ResponsiveImage";
import React, { useEffect, useRef, useState } from "react";
import { usePreferences } from "./preferences";
import { request } from "./api";
import { pages } from "./content/pages";
import {
  Hero,
  Ticker,
  About,
  Programmes,
  Life,
  Values,
  Campus,
  Team,
  Community,
  Contact,
  Footer,
} from "./content/SchoolSections";
import { Gallery } from "./components/Gallery";
import { Lightbox } from "./components/Lightbox";
export function SiteHeader({ page, announcement }) {
  const { language, selectLanguage, theme, toggleTheme, t } = usePreferences();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const escape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);
  return (
    <>
      <a className="skip" href="#main">
        {t("Skip to content")}
      </a>
      <div className="announcement">
        <span>
          {announcement || t("A little curiosity. A world of possibility.")}
        </span>
        <a href="/contact#visit">
          {t("Come meet Guru")} <span aria-hidden="true">↗︎</span>
        </a>
      </div>
      <header>
        <a href="/" className="brand" aria-labelledby="header-school-name">
          <ResponsiveImage
            src="/assets/crest.png"
            alt={t("Guru school crest")}
            width="47"
            height="57"
          />
          <span id="header-school-name">
            GURU<small>{t("INTERNATIONAL SCHOOL")}</small>
          </span>
        </a>
        <div className="header-controls">
          <div
            className="language-tabs"
            role="group"
            aria-label="Language / ဘာသာစကား"
          >
            <button
              type="button"
              data-language="en"
              aria-pressed={language === "en"}
              lang="en"
              onClick={() => {
                selectLanguage("en");
                setOpen(false);
              }}
            >
              EN
            </button>
            <button
              type="button"
              data-language="my"
              aria-pressed={language === "my"}
              lang="my"
              onClick={() => {
                selectLanguage("my");
                setOpen(false);
              }}
            >
              မြန်မာ
            </button>
          </div>
          <button
            className="theme-toggle"
            type="button"
            aria-label={t(
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
            )}
            aria-pressed={theme === "dark"}
            onClick={toggleTheme}
          >
            <span className="theme-icon" aria-hidden="true">
              {theme === "dark" ? "☀︎" : "☾︎"}
            </span>
            <span className="theme-label">
              {t(theme === "dark" ? "Light" : "Dark")}
            </span>
          </button>
          <button
            className="menu-toggle"
            aria-controls="nav"
            aria-expanded={open}
            aria-label={t(open ? "Close navigation" : "Open navigation")}
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>
        <nav
          id="nav"
          className={open ? "open" : ""}
          aria-label={t("Main navigation")}
        >
          {pages.map((item) => (
            <a
              key={item.slug}
              href={"/" + item.slug}
              aria-current={item.slug === page.slug ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {t(item.label)}
            </a>
          ))}
        </nav>
      </header>
    </>
  );
}
export function Explore({ selection }) {
  const { t } = usePreferences();
  return (
    <section className="section explore-section" id="explore">
      <p className="eyebrow">{t("YOUR NEXT DISCOVERY")}</p>
      <h2>{t("There’s more to explore.")}</h2>
      <div className="explore-grid">
        {selection.map((page) => (
          <a className="explore-card" key={page.slug} href={"/" + page.slug}>
            <ResponsiveImage
              src={"/assets/" + page.image}
              className={
                page.logoCover
                  ? "school-logo-cover"
                  : page.containCover
                    ? "poster-cover"
                    : undefined
              }
              alt={
                page.logoCover
                  ? t("Guru school crest")
                  : page.updatedCover
                    ? t(page.imageAlt)
                    : ""
              }
              loading="lazy"
              width="600"
              height="450"
            />
            <div>
              <p className="eyebrow">{t(page.label)}</p>
              <h3>{t(page.title)}</h3>
              <p>{t(page.description)}</p>
              <span className="text-link">{t(`Explore ${page.label} ↗︎`)}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
function useSchoolContent() {
  const [content, setContent] = useState(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await request("/api/content");
        if (active) setContent(data.content);
      } catch {
        /* Keep the school's static content available offline. */
      }
    };
    load();
    const visible = () => {
      if (!document.hidden) load();
    };
    const timer = setInterval(visible, 60000);
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return content;
}
function News({ content }) {
  const { language, t } = usePreferences();
  const published =
    content?.news
      .filter(
        (item) =>
          item.published &&
          (!item.publishAt || Date.parse(item.publishAt) <= Date.now()),
      )
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date)) || [];
  if (!published.length)
    return (
      <p className="section news-empty" id="news-empty">
        {t(
          "School updates will appear here when our team publishes them. Please contact us for current admissions information.",
        )}
      </p>
    );
  return (
    <section className="section school-news" id="school-news">
      <div className="section-top">
        <p className="eyebrow">{t("LATEST FROM GURU")}</p>
      </div>
      <h2>{t("Good things are happening.")}</h2>
      <div className="news-grid">
        {published.map((item) => (
          <article className="news-card" key={item.id}>
            {item.imageId && (
              <ResponsiveImage
                className="news-image"
                src={`/api/media?id=${item.imageId}`}
                loading="lazy"
                alt={
                  language === "my"
                    ? item.imageAltMy ||
                      item.imageAlt ||
                      item.titleMy ||
                      item.title
                    : item.imageAlt || item.title
                }
              />
            )}
            <time dateTime={item.date}>{item.date}</time>
            <h3>
              {language === "my" && item.titleMy ? item.titleMy : item.title}
            </h3>
            <p>{language === "my" && item.bodyMy ? item.bodyMy : item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
function useVisitorTracking() {
  useEffect(() => {
    if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return;
    const track = () =>
      fetch("/api/traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/" }),
        keepalive: true,
      }).catch(() => {});
    track();
    let last = Date.now();
    const visible = () => {
      if (!document.hidden && Date.now() - last >= 30 * 60000) {
        last = Date.now();
        track();
      }
    };
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, []);
}
function useSchoolMotion(ref) {
  useEffect(() => {
    const root = ref.current;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    const layers = root.querySelectorAll("[data-parallax]");
    const parallax = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        layers.forEach((layer) => {
          layer.style.translate = motion.matches
            ? "0 0"
            : `0 ${Math.min(window.scrollY, 800) * Number(layer.dataset.parallax)}px`;
        }),
      );
    };
    window.addEventListener("scroll", parallax, { passive: true });
    motion.addEventListener("change", parallax);
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting || motion.matches) return;
                const index = [...entry.target.parentElement.children].indexOf(
                  entry.target,
                );
                entry.target.animate?.(
                  [
                    {
                      opacity: 0,
                      translate: "0 44px",
                      rotate: index === 1 ? "3deg" : "-3deg",
                    },
                    { opacity: 1, translate: "0 0", rotate: "0deg" },
                  ],
                  {
                    duration: 650,
                    delay: index * 100,
                    easing: "cubic-bezier(.2,.8,.2,1)",
                  },
                );
              });
            },
            { threshold: 0.2 },
          )
        : null;
    root
      .querySelectorAll(".programme")
      .forEach((card) => observer?.observe(card));
    const feedback = (event) => {
      const target = event.target.closest("button,a,summary");
      if (target && !motion.matches)
        target.animate?.(
          [
            { scale: "1" },
            { scale: ".95", offset: 0.3 },
            { scale: "1.035", offset: 0.7 },
            { scale: "1" },
          ],
          { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
    };
    root.addEventListener("click", feedback);
    return () => {
      window.removeEventListener("scroll", parallax);
      motion.removeEventListener("change", parallax);
      cancelAnimationFrame(frame);
      observer?.disconnect();
      root.removeEventListener("click", feedback);
    };
  }, [ref]);
}
const sections = {
  about: About,
  values: Values,
  programmes: Programmes,
  life: Life,
  campus: Campus,
  team: Team,
  visit: Contact,
};
export default function PublicApp({ path = "/" }) {
  const { language, t } = usePreferences();
  const slug = path
    .replace(/^\//, "")
    .replace(/\.html$/, "")
    .replace(/\/$/, "");
  const page =
    pages.find((item) => item.slug === (slug === "index" ? "" : slug)) ||
    pages[0];
  const content = useSchoolContent();
  const [photo, setPhoto] = useState(null);
  const ref = useRef(null);
  useSchoolMotion(ref);
  useVisitorTracking();
  useEffect(() => {
    document.title = t(`${page.label} — Guru International School`);
    document.querySelector('meta[name="description"]').content = t(
      page.description,
    );
    setPhoto(null);
  }, [page, language]);
  useEffect(() => {
    const destinations = {
      about: "/about",
      values: "/about#values",
      programmes: "/programmes",
      life: "/life",
      campus: "/campus",
      team: "/team",
      gallery: "/gallery",
      contact: "/contact",
      visit: "/contact#visit",
      "school-news": "/news",
    };
    if (!page.slug && destinations[location.hash.slice(1)])
      location.replace(destinations[location.hash.slice(1)]);
  }, [page.slug]);
  const openStaticPhoto = (event) => {
    const button = event.target.closest("[data-image]");
    if (button)
      setPhoto({
        image: button.dataset.image,
        caption: button.dataset.caption,
      });
  };
  return (
    <div ref={ref} onClick={openStaticPhoto}>
      <SiteHeader
        page={page}
        announcement={
          language === "my" && content?.announcementMy
            ? content.announcementMy
            : content?.announcement
        }
      />
      <main id="main">
        {!page.slug ? (
          <>
            <Hero />
            <Ticker />
            <Explore selection={pages.filter((item) => item.slug)} />
          </>
        ) : (
          <>
            <section
              className={`page-heading section ${page.updatedCover ? "photo-page-heading" : ""}`}
            >
              <div className="page-heading-copy">
                <a className="text-link" href="/">
                  {t("Home ↗︎")}
                </a>
                <p className="eyebrow">{t(page.label)}</p>
                <h1>{t(page.title)}</h1>
                <p className="large-copy">{t(page.description)}</p>
              </div>
              {page.updatedCover && (
                <figure
                  className={`page-heading-photo ${page.containCover ? "poster-heading" : ""}`}
                >
                  <ResponsiveImage
                    src={"/assets/" + page.image}
                    alt={t(page.imageAlt)}
                    width="1280"
                    height="960"
                    fetchPriority="high"
                  />
                  <figcaption>{t(page.label)}</figcaption>
                </figure>
              )}
            </section>
            {page.slug === "gallery" ? (
              <Gallery
                photos={content?.photos}
                hiddenGallery={content?.hiddenGallery}
                existingAlbums={content?.existingAlbums}
                openPhoto={setPhoto}
              />
            ) : page.slug === "news" ? (
              <News content={content} />
            ) : (
              page.ids.map((id) => {
                const Section = sections[id];
                return <Section key={id} />;
              })
            )}
            {page.community && <Community />}
            <section className="section page-cta">
              <div>
                <p className="eyebrow">{t("COME MEET GURU")}</p>
                <h2>{t("Your next chapter starts here.")}</h2>
              </div>
              <a className="button" href="/contact#visit">
                {t("Visit our school ↗︎")}
              </a>
            </section>
            <Explore
              selection={pages
                .filter((item) => item.slug && item.slug !== page.slug)
                .slice(
                  page.slug === "contact" ? 0 : 2,
                  page.slug === "contact" ? 3 : 5,
                )}
            />
          </>
        )}
      </main>
      <Footer />
      <Lightbox photo={photo} close={() => setPhoto(null)} />
    </div>
  );
}
