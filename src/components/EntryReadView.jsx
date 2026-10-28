import { useState, useEffect } from "react";
import { moodOf, moodLabel } from "../lib/moods.js";
import { weatherOf, weatherLabel } from "../lib/weather.js";
import { activityMap, activityLabel } from "../lib/activities.js";
import { goalMap, TERM_BY_ID } from "../lib/goals.js";
import { normImages } from "../lib/images.js";
import { mdToHtml } from "../lib/markdown.js";
import { storage } from "../lib/storage.js";
import { t } from "../lib/i18n.js";
import { IconChevronLeft, IconEdit, IconTrash, IconCheck, IconClose, IconStar } from "./Icons.jsx";

// Read-only view of one entry, with a button to switch to editing.
export default function EntryReadView({ entry, activities, goals, onEdit, onDelete, onToggleFavorite, onBack }) {
  const [lightbox, setLightbox] = useState(null);
  const [fav, setFav] = useState(!!entry.favorite);
  const mood = moodOf(entry.mood);
  const actMap = activityMap(activities);
  const gMap = goalMap(goals);
  const imgs = normImages(entry.images);

  // Escape closes the lightbox first, otherwise leaves the read view.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (lightbox) setLightbox(null);
      else onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, onBack]);

  return (
    <div className="entry-read">
      <div className="ee-head">
        <button className="btn ghost" onClick={onBack}>
          <IconChevronLeft width={16} height={16} /> {t("common.back")}
        </button>
        <div className="er-time">{entry.time}</div>
        <button
          className={"fav-btn" + (fav ? " on" : "")}
          onClick={() => {
            const next = !fav;
            setFav(next);
            onToggleFavorite?.({ ...entry, favorite: fav });
          }}
          title={t("editor.favorite")}
          aria-pressed={fav}
          aria-label={t("editor.favorite")}
        >
          <IconStar width={18} height={18} filled={fav} />
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={() => onDelete(entry)} aria-label={t("common.delete")}>
          <IconTrash width={16} height={16} />
        </button>
        <button className="btn primary" onClick={() => onEdit(entry)}>
          <IconEdit width={16} height={16} /> {t("read.edit")}
        </button>
      </div>

      {mood && (
        <div className="er-mood" style={{ color: mood.color }}>
          <span className="er-mood-emoji">{mood.emoji}</span>
          <span>{moodLabel(mood.value)}</span>
        </div>
      )}

      {(entry.place || entry.weather) ? (
        <div className="er-context">
          {entry.weather ? (
            <span className="er-weather">{weatherOf(entry.weather)?.emoji} {weatherLabel(entry.weather)}</span>
          ) : null}
          {entry.place ? <span className="er-place">📍 {entry.place}</span> : null}
        </div>
      ) : null}

      {entry.activities?.length ? (
        <div className="de-acts" style={{ marginTop: 16 }}>
          {entry.activities.map((id) =>
            actMap[id] ? (
              <span className="de-act" key={id}>
                <span>{actMap[id].emoji}</span> {activityLabel(actMap[id])}
              </span>
            ) : null
          )}
        </div>
      ) : null}

      {entry.goals?.length ? (
        <div className="goal-chips" style={{ marginTop: 12 }}>
          {entry.goals.map((id) =>
            gMap[id] ? (
              <span className="goal-chip" key={id}>
                <IconCheck width={13} height={13} />
                {gMap[id].text}
                <span className="goal-chip-term">{TERM_BY_ID[gMap[id].term]?.emoji}</span>
              </span>
            ) : null
          )}
        </div>
      ) : null}

      {entry.text?.trim() ? (
        <div
          className="er-note md"
          dangerouslySetInnerHTML={{ __html: mdToHtml(entry.text) }}
        />
      ) : null}

      {imgs.length ? (
        <div className="er-photos">
          {imgs.map((im, i) => (
            <figure className="er-photo" key={im.name + i} onClick={() => setLightbox(im)}>
              <img src={storage.imageUrl(im.name)} alt={im.caption || ""} />
              {im.caption ? <figcaption>{im.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      ) : null}

      {lightbox ? (
        <div className="lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true" aria-label={lightbox.caption || t("nav.gallery")}>
          <button className="icon-btn" style={{ position: "absolute", top: 20, right: 20 }} aria-label={t("common.close")}>
            <IconClose />
          </button>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={storage.imageUrl(lightbox.name)} alt={lightbox.caption || ""} />
            {lightbox.caption ? <div className="lightbox-caption">{lightbox.caption}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
