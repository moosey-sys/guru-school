import { ResponsiveImage } from "./ResponsiveImage";
import React, { useState, useId } from "react";
import { galleryPhotos } from "../content/gallery";
import { usePreferences } from "../preferences";
export function Gallery({
  photos = [],
  hiddenGallery = [],
  existingAlbums = {},
  openPhoto,
}) {
  const { language, t } = usePreferences();
  const [category, setCategory] = useState("all");
  const [album, setAlbum] = useState("");
  const [expanded, setExpanded] = useState(false);
  const uploaded = photos
    .filter((photo) => photo.published)
    .map((photo) => ({
      ...photo,
      image: `/api/media?id=${photo.id}`,
      caption:
        language === "my" && photo.captionMy ? photo.captionMy : photo.caption,
      category: photo.category === "student-life" ? "life" : photo.category,
    }));
  const cards = [
    ...uploaded,
    ...galleryPhotos
      .filter((photo) => !hiddenGallery.includes(photo.image))
      .map((photo) => ({
        ...photo,
        image: "/assets/" + photo.image,
        caption: t(photo.caption),
        alt: t(photo.alt || photo.caption),
        story: photo.story ? t(photo.story) : "",
        album: existingAlbums[photo.image] || "",
      })),
  ];
  const matching = cards.filter(
    (photo) =>
      (!album || photo.album === album) &&
      (category === "all" ||
        photo.category === category ||
        (category === "events" && photo.category === "graduation")),
  );
  const shown = expanded ? matching.length : Math.min(8, matching.length);
  const filters = {
    all: "All photos",
    events: "Events",
    graduation: "Graduation",
    trips: "Trips",
    campus: "Campus",
    learning: "Learning",
    life: "Student life",
    community: "Community",
    information: "Information",
  };
  return (
    <section className="photo-gallery section" id="gallery">
      <div className="section-top">
        <p className="eyebrow">{t("EXPLORE GURU IN PICTURES")}</p>
        <span>{t("School moments, celebrations and adventures.")}</span>
      </div>
      <p className="gallery-intro">
        {t(
          "Every small step has a story. Explore proud milestones, moments of togetherness and the spaces where new discoveries begin.",
        )}
      </p>
      <div className="heading-row">
        <h2>
          {t("A closer look")}
          <br />
          <em>{t("at our world.")}</em>
        </h2>
        <div
          className="gallery-filters filters"
          role="group"
          aria-label={t("Filter school gallery")}
        >
          {Object.entries(filters).map(([value, label]) => (
            <button
              key={value}
              data-gallery-filter={value}
              aria-pressed={category === value}
              className={category === value ? "active" : ""}
              onClick={() => {
                setCategory(value);
                setExpanded(false);
              }}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>
      {cards.some((photo) => photo.album) && (
        <label className="gallery-album-filter">
          {t("Browse an album")}
          <select
            value={album}
            onChange={(event) => {
              setAlbum(event.target.value);
              setExpanded(false);
            }}
          >
            <option value="">{t("All albums")}</option>
            {[...new Set(cards.map((photo) => photo.album).filter(Boolean))]
              .sort()
              .map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
          </select>
        </label>
      )}
      <p className="gallery-status" aria-live="polite">
        {language === "my"
          ? `ဓာတ်ပုံ ${matching.length} ပုံမှ ${shown} ပုံကို ပြထားပါသည်။`
          : `Showing ${shown} of ${matching.length} photos.`}
      </p>
      <div className="full-gallery">
        {matching.slice(0, shown).map((photo) => (
          <GalleryCard
            key={photo.id || photo.image}
            photo={photo}
            openPhoto={openPhoto}
          />
        ))}
      </div>
      {matching.length > 8 && (
        <button
          className="button gallery-more"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {t(expanded ? "Show fewer photos" : "Show all photos")}
        </button>
      )}
      <p className="gallery-visit-link">
        <a className="text-link" href="/contact#visit">
          {t("Picture your child here? Come meet Guru ↗︎")}
        </a>
      </p>
    </section>
  );
}

function GalleryCard({ photo, openPhoto }) {
  const id = useId();
  return (
    <button
      type="button"
      className={photo.id ? "campus-card" : "full-gallery-card"}
      data-gallery-category={photo.category}
      data-featured={photo.featured ? "true" : undefined}
      aria-labelledby={`${id}-caption`}
      aria-describedby={photo.story ? `${id}-story` : undefined}
      onClick={() => openPhoto(photo)}
    >
      <ResponsiveImage
        src={photo.image}
        alt={photo.alt || photo.caption}
        loading="lazy"
        width={photo.width || 600}
        height={photo.height || 450}
      />
      <span className="gallery-photo-copy">
        <strong id={`${id}-caption`}>{photo.caption} ↗︎</strong>
        {photo.story && <small id={`${id}-story`}>{photo.story}</small>}
      </span>
    </button>
  );
}
