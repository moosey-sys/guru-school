import React, { useEffect, useRef } from "react";
import { usePreferences } from "../preferences";
export function Lightbox({ photo, close }) {
  const ref = useRef(null);
  const { t } = usePreferences();
  useEffect(() => {
    const dialog = ref.current;
    if (photo && !dialog.open) dialog.showModal();
    if (!photo && dialog.open) dialog.close();
  }, [photo]);
  return (
    <dialog
      id="lightbox"
      ref={ref}
      aria-label={t("School photo viewer")}
      onClose={close}
      onClick={(event) => {
        if (event.target !== ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          close();
      }}
    >
      <button
        className="close-dialog"
        aria-label={t("Close photo viewer")}
        onClick={close}
      >
        ×
      </button>
      <img
        src={photo?.image || "/assets/hero.webp"}
        alt={photo?.caption || ""}
      />
      <p>{photo?.caption || ""}</p>
    </dialog>
  );
}
