import { useState, useEffect, lazy, Suspense } from "react";
import { moodOf, moodLabel } from "../lib/moods.js";
import { weatherOf } from "../lib/weather.js";
import { activityMap, activityLabel } from "../lib/activities.js";
import { normImages } from "../lib/images.js";
import { storage } from "../lib/storage.js";
import { formatLong, formatDayMonth, isToday, isFuture, addDays, todayKey } from "../lib/date.js";
import { IconChevronLeft, IconChevronRight, IconPlus } from "./Icons.jsx";
import { t } from "../lib/i18n.js";
import EntryReadView from "./EntryReadView.jsx";
import Memories from "./Memories.jsx";
import TasksPanel from "./TasksPanel.jsx";
import TrackersPanel from "./TrackersPanel.jsx";

// The editor pulls in the (heavy) rich-text engine; load it only when needed.
const EntryEditor = lazy(() => import("./EntryEditor.jsx"));

function excerpt(text) {
  return (text || "").replace(/[#*_`>\-[\]]/g, "").replace(/\n+/g, " ").trim();
}

function EntryCard({ entry, actMap, trip, onClick, onOpenLabel }) {
  const mood = moodOf(entry.mood);
  const imgs = normImages(entry.images);
  return (
    <div className="card day-entry" onClick={onClick}>
      <div className="de-left">
        <div className="de-time">{entry.time}</div>
        {mood && <div className="de-mood" style={{ color: mood.color }}>{mood.emoji}</div>}
      </div>
      <div className="de-body">
        {entry.endDate ? (
          <div className="de-range">📅 {formatDayMonth(entry.date)} → {formatDayMonth(entry.endDate)}</div>
        ) : null}
        <span className="de-moodline">
          {mood && <span className="de-moodlabel" style={{ color: mood.color }}>{moodLabel(mood.value)}</span>}
          {entry.weather && <span className="de-weather">{weatherOf(entry.weather)?.emoji}</span>}
          {entry.favorite && <span className="de-fav" aria-label={t("editor.favorite")}>★</span>}
        </span>
        {entry.place ? <div className="de-place">📍 {entry.place}</div> : null}
        {trip ? <div className="de-trip">🧳 {trip.name}</div> : null}
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
        {entry.audio?.length ? <div className="de-audio">🎙️ {t("day.voiceNote", { n: entry.audio.length })}</div> : null}
        {(entry.tags?.length || entry.people?.length) ? (
          <div className="de-labels">
            {(entry.tags || []).map((tg) => (
              <button className="lbl-tag" key={"t" + tg} onClick={(e) => { e.stopPropagation(); onOpenLabel?.("tag", tg); }}>#{tg}</button>
            ))}
            {(entry.people || []).map((p) => (
              <button className="lbl-person" key={"p" + p} onClick={(e) => { e.stopPropagation(); onOpenLabel?.("person", p); }}>@{p}</button>
            ))}
          </div>
        ) : null}
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

export default function DayView({ date, dayEntries, allEntries, activities, goals, newEntrySignal, placeSuggestions, tagSuggestions, peopleSuggestions, trips, tasks, trackers, onDateChange, onSaveEntry, onDeleteEntry, onToggleFavorite, onTasksChange, onTrackersChange, onOpenLabel }) {
  const tripMap = {};
  for (const tr of trips || []) tripMap[tr.id] = tr;
  const [editing, setEditing] = useState(null); // null | 'new' | entry
  const [viewing, setViewing] = useState(null); // null | entry (read mode)
  const [saveError, setSaveError] = useState("");
  const actMap = activityMap(activities);

  // Leave the editor/reader when navigating to another day.
  useEffect(() => {
    setEditing(null);
    setViewing(null);
  }, [date]);

  // Quick-add from the tray: jump straight into a new entry.
  useEffect(() => {
    if (newEntrySignal) {
      setViewing(null);
      setEditing("new");
    }
  }, [newEntrySignal]);

  async function handleSave(entry) {
    try {
      setSaveError("");
      await onSaveEntry(entry);
      setEditing(null);
      setViewing(null);
    } catch (err) {
      // Keep the editor open so nothing the user typed is lost.
      console.error("save entry failed", err);
      setSaveError(t("editor.saveError"));
    }
  }
  async function handleDelete(entry) {
    // Use the entry's own (start) date — a multi-day entry is stored there,
    // not necessarily on the day currently being viewed.
    await onDeleteEntry(entry.date, entry.id);
    setEditing(null);
    setViewing(null);
  }

  if (editing) {
    return (
      <div className="view">
        {saveError && <div className="inline-error" role="alert">{saveError}</div>}
        <Suspense fallback={<div className="editor-loading">{t("common.loading")}</div>}>
          <EntryEditor
            date={date}
            entry={editing === "new" ? null : editing}
            activities={activities}
            goals={goals}
            placeSuggestions={placeSuggestions}
            tagSuggestions={tagSuggestions}
            peopleSuggestions={peopleSuggestions}
            trips={trips}
            onSave={handleSave}
            onDelete={handleDelete}
            onCancel={() => { setEditing(null); setSaveError(""); }}
          />
        </Suspense>
      </div>
    );
  }

  if (viewing) {
    return (
      <div className="view">
        <EntryReadView
          entry={viewing}
          activities={activities}
          goals={goals}
          trip={tripMap[viewing.tripId]}
          onOpenLabel={onOpenLabel}
          onEdit={(entry) => { setViewing(null); setEditing(entry); }}
          onDelete={handleDelete}
          onToggleFavorite={onToggleFavorite}
          onBack={() => setViewing(null)}
        />
      </div>
    );
  }

  const future = isFuture(date);
  const entries = [...dayEntries].sort((a, b) => (a.time < b.time ? 1 : -1)); // recent first

  return (
    <div className="view">
      <div className="day-nav">
        <button className="icon-btn" onClick={() => onDateChange(addDays(date, -1))} title={t("day.prevDay")} aria-label={t("day.prevDay")}>
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
          aria-label={t("day.nextDay")}
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

          <Memories date={date} allEntries={allEntries || []} onOpenDay={onDateChange} />

          <TrackersPanel trackers={trackers} date={date} onChange={onTrackersChange} />
          {isToday(date) && <TasksPanel tasks={tasks} onChange={onTasksChange} />}

          {entries.length === 0 ? (
            <div className="empty">
              <div className="big">📝</div>
              {t("day.empty")}
              <div style={{ marginTop: 6 }}>{t("day.emptyHint")}</div>
            </div>
          ) : (
            <div className="day-entries">
              {entries.map((e) => (
                <EntryCard key={e.id} entry={e} actMap={actMap} trip={tripMap[e.tripId]} onClick={() => setViewing(e)} onOpenLabel={onOpenLabel} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
