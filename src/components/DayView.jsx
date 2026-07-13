import { useState, useEffect } from "react";
import { moodOf, moodLabel } from "../lib/moods.js";
import { activityMap, activityLabel } from "../lib/activities.js";
import { normImages } from "../lib/images.js";
import { storage } from "../lib/storage.js";
import { formatLong, isToday, isFuture, addDays, todayKey } from "../lib/date.js";
import { IconChevronLeft, IconChevronRight, IconPlus } from "./Icons.jsx";
import { t } from "../lib/i18n.js";
import EntryEditor from "./EntryEditor.jsx";

function excerpt(text) {
  return (text || "").replace(/[#*_`>\-[\]]/g, "").replace(/\n+/g, " ").trim();
}

function EntryCard({ entry, actMap, onClick }) {
  const mood = moodOf(entry.mood);
  const imgs = normImages(entry.images);
  return (
    <div className="card day-entry" onClick={onClick}>
      <div className="de-left">
        <div className="de-time">{entry.time}</div>
        {mood && <div className="de-mood" style={{ color: mood.color }}>{mood.emoji}</div>}
      </div>
      <div className="de-body">
        {mood && <span className="de-moodlabel" style={{ color: mood.color }}>{moodLabel(mood.value)}</span>}
        {entry.activities?.length ? (
          <div className="de-acts">
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
          <div className="de-goals">
            🎯 {t("day.goalsReached", { n: entry.goals.length })}
          </div>
        ) : null}
        {entry.text?.trim() ? <div className="de-note">{excerpt(entry.text)}</div> : null}
        {imgs.length ? (
          <div className="de-thumbs">
            {imgs.slice(0, 5).map((im, i) => (
              <img key={im.name + i} src={storage.imageUrl(im.name)} alt={im.caption || ""} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function DayView({ date, dayEntries, activities, goals, onDateChange, onSaveEntry, onDeleteEntry }) {
  const [editing, setEditing] = useState(null); // null | 'new' | entry
  const actMap = activityMap(activities);

  // Leave the editor when navigating to another day.
  useEffect(() => setEditing(null), [date]);

  async function handleSave(entry) {
    await onSaveEntry(entry);
    setEditing(null);
  }
  async function handleDelete(entry) {
    await onDeleteEntry(date, entry.id);
    setEditing(null);
  }

  if (editing) {
    return (
      <div className="view">
        <EntryEditor
          date={date}
          entry={editing === "new" ? null : editing}
          activities={activities}
          goals={goals}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  const future = isFuture(date);
  const entries = [...dayEntries].sort((a, b) => (a.time < b.time ? 1 : -1)); // recent first

  return (
    <div className="view">
      <div className="day-nav">
        <button className="icon-btn" onClick={() => onDateChange(addDays(date, -1))} title={t("day.prevDay")}>
          <IconChevronLeft />
        </button>
        <div className="date">
          <div className="d1">{isToday(date) ? t("common.today") : formatLong(date).split(" ").slice(0, 3).join(" ")}</div>
          <div className="d2" style={{ textTransform: "capitalize" }}>{formatLong(date)}</div>
        </div>
        <button
          className="icon-btn"
          onClick={() => onDateChange(addDays(date, 1))}
          disabled={isToday(date)}
          style={isToday(date) ? { opacity: 0.35, pointerEvents: "none" } : null}
          title={t("day.nextDay")}
        >
          <IconChevronRight />
        </button>
      </div>

      {future ? (
        <div className="empty">
          <div className="big">🔮</div>
          {t("day.future")}
          <div style={{ marginTop: 16 }}>
            <button className="btn" onClick={() => onDateChange(todayKey())}>{t("day.backToday")}</button>
          </div>
        </div>
      ) : (
        <>
          <button className="add-entry" onClick={() => setEditing("new")}>
            <IconPlus /> {t("day.newEntry")}
          </button>

          {entries.length === 0 ? (
            <div className="empty">
              <div className="big">📝</div>
              {t("day.empty")}
              <div style={{ marginTop: 6 }}>{t("day.emptyHint")}</div>
            </div>
          ) : (
            <div className="day-entries">
              {entries.map((e) => (
                <EntryCard key={e.id} entry={e} actMap={actMap} onClick={() => setEditing(e)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
