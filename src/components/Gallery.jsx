import React, { useState } from "react";
import { galleryPhotos } from "../content/gallery";
import { usePreferences } from "../preferences";
export function Gallery({ photos = [], hiddenGallery = [], openPhoto }) {
  const { language, t } = usePreferences();
  const [category, setCategory] = useState("all");
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
      })),
  ];
  const matching = cards.filter(
    (photo) => category === "all" || photo.category === category,
  );
  const shown = expanded ? matching.length : Math.min(8, matching.length);
  const filters = {
    all: "All photos",
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
      <p className="gallery-status" aria-live="polite">
        {language === "my"
          ? `ဓာတ်ပုံ ${matching.length} ပုံမှ ${shown} ပုံကို ပြထားပါသည်။`
          : `Showing ${shown} of ${matching.length} photos.`}
      </p>
      <div className="full-gallery">
        {matching.slice(0, shown).map((photo) => (
          <button
            key={photo.id || photo.image}
            type="button"
            className={photo.id ? "campus-card" : "full-gallery-card"}
            data-gallery-category={photo.category}
            onClick={() => openPhoto(photo)}
          >
            <img
              src={photo.image}
              alt={photo.caption}
              loading="lazy"
              width={photo.width || 600}
              height={photo.height || 450}
            />
            <span>{photo.caption} ↗︎</span>
          </button>
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
    </section>
  );
}
