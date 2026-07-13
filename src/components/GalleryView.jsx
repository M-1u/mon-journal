import { useState } from "react";
import { storage } from "../lib/storage.js";
import { formatMedium } from "../lib/date.js";
import { normImages } from "../lib/images.js";
import { t } from "../lib/i18n.js";
import { IconClose } from "./Icons.jsx";

export default function GalleryView({ entries, onOpenDay }) {
  const [lightbox, setLightbox] = useState(null);

  // Flatten all photos, newest first, keeping their day and caption.
  const photos = [];
  for (const e of entries) {
    for (const im of normImages(e.images)) {
      photos.push({ name: im.name, caption: im.caption, date: e.date });
    }
  }

  if (!photos.length) {
    return (
      <div className="view">
        <h1 className="page-title">{t("gallery.title")}</h1>
        <div className="empty">
          <div className="big">🖼️</div>
          {t("gallery.empty")}
          <div style={{ marginTop: 6 }}>{t("gallery.emptyHint")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <h1 className="page-title">{t("gallery.title")}</h1>
      <p className="page-sub">{t("gallery.sub", { n: photos.length })}</p>

      <div className="gallery-grid">
        {photos.map((p, i) => (
          <div
            className="gallery-item"
            key={p.name + i}
            onClick={() => setLightbox(p)}
          >
            <img src={storage.imageUrl(p.name)} alt={p.caption || ""} />
            <div className="cap">
              {p.caption ? <div className="cap-desc">{p.caption}</div> : null}
              <div className="cap-date" style={{ textTransform: "capitalize" }}>
                {formatMedium(p.date)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {lightbox ? (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button
            className="icon-btn"
            style={{ position: "absolute", top: 20, right: 20 }}
            onClick={() => setLightbox(null)}
          >
            <IconClose />
          </button>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img
              src={storage.imageUrl(lightbox.name)}
              alt={lightbox.caption || ""}
              onClick={() => onOpenDay(lightbox.date)}
              title={t("gallery.openDay")}
            />
            {lightbox.caption ? (
              <div className="lightbox-caption">{lightbox.caption}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
