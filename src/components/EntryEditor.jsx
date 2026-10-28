import { useState } from "react";
import { MOODS, moodLabel } from "../lib/moods.js";
import { normImages } from "../lib/images.js";
import { goalMap, TERM_BY_ID } from "../lib/goals.js";
import { WEATHERS, weatherLabel } from "../lib/weather.js";
import { addDays, formatDayMonth } from "../lib/date.js";
import { storage } from "../lib/storage.js";
import { t } from "../lib/i18n.js";
import MarkdownEditor from "./MarkdownEditor.jsx";
import PhotoStrip from "./PhotoStrip.jsx";
import ActivityPicker from "./ActivityPicker.jsx";
import ChipInput from "./ChipInput.jsx";
import VoiceRecorder from "./VoiceRecorder.jsx";
import { IconChevronLeft, IconCheck, IconTrash, IconClose, IconStar, IconMapPin } from "./Icons.jsx";

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const TEMPLATES = [
  ["tpl.gratitude", "tpl.gratitudeBody"],
  ["tpl.review", "tpl.reviewBody"],
  ["tpl.morning", "tpl.morningBody"],
  ["tpl.feelings", "tpl.feelingsBody"],
];

// Full form to create or edit one entry.
export default function EntryEditor({ date, entry, activities, goals, placeSuggestions, tagSuggestions, peopleSuggestions, trips, onSave, onDelete, onCancel }) {
  const isNew = !entry;
  const [time, setTime] = useState(entry?.time || nowTime());
  const [mood, setMood] = useState(entry?.mood ?? null);
  const [acts, setActs] = useState(entry?.activities || []);
  const [goalIds, setGoalIds] = useState(entry?.goals || []);
  const [text, setText] = useState(entry?.text || "");
  const [images, setImages] = useState(normImages(entry?.images));
  const [audio, setAudio] = useState(entry?.audio || []);
  const [place, setPlace] = useState(entry?.place || "");
  const [weather, setWeather] = useState(entry?.weather || null);
  const [favorite, setFavorite] = useState(!!entry?.favorite);
  const [tags, setTags] = useState(entry?.tags || []);
  const [people, setPeople] = useState(entry?.people || []);
  const [tripId, setTripId] = useState(entry?.tripId || "");
  const [endDate, setEndDate] = useState(entry?.endDate || "");
  const [multiDay, setMultiDay] = useState(!!entry?.endDate);
  const [dragOver, setDragOver] = useState(false);

  async function addImageFiles(fileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const names = await storage.addImageFiles(files);
    setImages((cur) => [...cur, ...names.map((name) => ({ name, caption: "" }))]);
  }

  function onPaste(e) {
    const files = Array.from(e.clipboardData?.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length) {
      e.preventDefault();
      addImageFiles(files);
    }
  }
  function onDrop(e) {
    if (e.dataTransfer?.files?.length) {
      e.preventDefault();
      setDragOver(false);
      addImageFiles(e.dataTransfer.files);
    }
  }

  const gMap = goalMap(goals);
  const available = (goals || []).filter((g) => !goalIds.includes(g.id));

  function toggleAct(id) {
    setActs((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }
  function addGoal(id) {
    if (id && !goalIds.includes(id)) setGoalIds((cur) => [...cur, id]);
  }
  function removeGoal(id) {
    setGoalIds((cur) => cur.filter((x) => x !== id));
  }

  function applyTemplate(bodyKey) {
    if (!bodyKey) return;
    const body = t(bodyKey);
    setText((cur) => (cur.trim() ? cur.replace(/\s+$/, "") + "\n\n" + body : body));
  }

  function save() {
    onSave({ id: entry?.id, date, endDate: multiDay && endDate > date ? endDate : null, time, mood, activities: acts, goals: goalIds, text, images, audio, place: place.trim(), weather, favorite, tags, people, tripId: tripId || null });
  }

  const canSave =
    mood != null || text.trim() || acts.length || images.length || goalIds.length ||
    place.trim() || weather || tags.length || people.length || audio.length;

  return (
    <div
      className={"entry-editor" + (dragOver ? " drag-over" : "")}
      onPaste={onPaste}
      onDrop={onDrop}
      onDragOver={(e) => { if (e.dataTransfer?.types?.includes("Files")) { e.preventDefault(); setDragOver(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
    >
      <div className="ee-head">
        <button className="btn ghost" onClick={onCancel}>
          <IconChevronLeft width={16} height={16} /> {t("common.back")}
        </button>
        <div className="ee-title">{isNew ? t("editor.new") : t("editor.edit")}</div>
        <button
          type="button"
          className={"fav-btn" + (favorite ? " on" : "")}
          onClick={() => setFavorite((f) => !f)}
          title={t("editor.favorite")}
          aria-pressed={favorite}
          aria-label={t("editor.favorite")}
        >
          <IconStar width={18} height={18} filled={favorite} />
        </button>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          title={t("editor.time")}
        />
      </div>

      <div className="ee-multiday">
        <label className="ee-multiday-toggle">
          <button
            type="button"
            className={"switch" + (multiDay ? " on" : "")}
            onClick={() => { setMultiDay((v) => !v); if (!multiDay && !endDate) setEndDate(addDays(date, 1)); }}
            aria-pressed={multiDay}
            aria-label={t("editor.multiDay")}
          />
          <span>{t("editor.multiDay")}</span>
        </label>
        {multiDay && (
          <span className="ee-range-dates">
            {formatDayMonth(date)} →
            <input type="date" min={addDays(date, 1)} value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label={t("editor.endDate")} />
          </span>
        )}
      </div>

      <p className="section-label">{t("editor.mood")}</p>
      <div className="mood-row">
        {MOODS.map((m) => (
          <button
            key={m.value}
            className={"mood-btn" + (mood === m.value ? " selected" : "")}
            style={{ "--m-color": m.color }}
            onClick={() => setMood(mood === m.value ? null : m.value)}
          >
            <span className="emoji">{m.emoji}</span>
            <span className="name">{moodLabel(m.value)}</span>
          </button>
        ))}
      </div>

      <p className="section-label">{t("editor.context")}</p>
      <div className="context-row">
        <div className="place-field">
          <IconMapPin width={16} height={16} aria-hidden="true" />
          <input
            className="place-input"
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder={t("editor.placePlaceholder")}
            aria-label={t("editor.place")}
            list="place-suggestions"
          />
          {placeSuggestions?.length ? (
            <datalist id="place-suggestions">
              {placeSuggestions.map((p) => <option key={p} value={p} />)}
            </datalist>
          ) : null}
        </div>
        <div className="weather-row" role="group" aria-label={t("editor.weather")}>
          {WEATHERS.map((w) => (
            <button
              key={w.id}
              type="button"
              className={"weather-btn" + (weather === w.id ? " selected" : "")}
              onClick={() => setWeather(weather === w.id ? null : w.id)}
              title={weatherLabel(w.id)}
              aria-label={weatherLabel(w.id)}
              aria-pressed={weather === w.id}
            >
              {w.emoji}
            </button>
          ))}
        </div>
      </div>

      {trips && trips.length > 0 && (
        <>
          <p className="section-label">🧳 {t("editor.trip")}</p>
          <select className="goal-select" value={tripId} onChange={(e) => setTripId(e.target.value)} aria-label={t("editor.trip")}>
            <option value="">{t("editor.noTrip")}</option>
            {trips.map((tr) => (
              <option key={tr.id} value={tr.id}>{tr.name || t("trip.untitled")}</option>
            ))}
          </select>
        </>
      )}

      <p className="section-label">{t("editor.activities")}</p>
      <ActivityPicker activities={activities} selected={acts} onToggle={toggleAct} />

      <div className="chip-fields">
        <div>
          <p className="section-label" style={{ marginTop: 24 }}>{t("editor.tags")}</p>
          <ChipInput
            values={tags}
            onChange={setTags}
            prefix="#"
            placeholder={t("editor.tagsPlaceholder")}
            suggestions={tagSuggestions || []}
            listId="tag-suggestions"
            ariaLabel={t("editor.tags")}
          />
        </div>
        <div>
          <p className="section-label" style={{ marginTop: 24 }}>{t("editor.people")}</p>
          <ChipInput
            values={people}
            onChange={setPeople}
            prefix="@"
            placeholder={t("editor.peoplePlaceholder")}
            suggestions={peopleSuggestions || []}
            listId="people-suggestions"
            ariaLabel={t("editor.people")}
          />
        </div>
      </div>

      <p className="section-label" style={{ marginTop: 24 }}>{t("editor.goals")}</p>
      {goals && goals.length ? (
        <>
          {goalIds.length > 0 && (
            <div className="goal-chips">
              {goalIds.map((id) =>
                gMap[id] ? (
                  <span className="goal-chip" key={id}>
                    <IconCheck width={13} height={13} />
                    {gMap[id].text}
                    <span className="goal-chip-term">{TERM_BY_ID[gMap[id].term]?.emoji}</span>
                    <button className="goal-chip-rm" onClick={() => removeGoal(id)} title={t("common.remove")}>
                      <IconClose width={11} height={11} />
                    </button>
                  </span>
                ) : null
              )}
            </div>
          )}
          {available.length > 0 ? (
            <select
              className="goal-select"
              value=""
              onChange={(e) => { addGoal(e.target.value); e.target.value = ""; }}
            >
              <option value="" disabled>{t("editor.pickGoal")}</option>
              {available.map((g) => (
                <option key={g.id} value={g.id}>
                  {TERM_BY_ID[g.term]?.emoji} {g.text}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ color: "var(--ink-faint)", fontSize: 13 }}>
              {t("editor.allGoals")}
            </div>
          )}
        </>
      ) : (
        <div style={{ color: "var(--ink-faint)", fontSize: 13 }}>
          {t("editor.noGoals")}
        </div>
      )}

      <div className="note-head">
        <p className="section-label" style={{ margin: 0 }}>{t("editor.note")}</p>
        <select
          className="tpl-select"
          value=""
          onChange={(e) => { applyTemplate(e.target.value); e.target.value = ""; }}
        >
          <option value="" disabled>{t("tpl.label")}</option>
          {TEMPLATES.map(([labelKey, bodyKey]) => (
            <option key={bodyKey} value={bodyKey}>{t(labelKey)}</option>
          ))}
        </select>
      </div>
      <MarkdownEditor value={text} onChange={setText} />

      <p className="section-label" style={{ marginTop: 24 }}>{t("editor.voice")}</p>
      <VoiceRecorder audio={audio} onChange={setAudio} />

      <p className="section-label" style={{ marginTop: 24 }}>{t("editor.photos")}</p>
      <PhotoStrip images={images} onChange={setImages} />

      <div className="ee-actions">
        {!isNew && (
          <button className="btn danger" onClick={() => onDelete(entry)}>
            <IconTrash width={16} height={16} /> {t("common.delete")}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn ghost" onClick={onCancel}>{t("common.cancel")}</button>
        <button className="btn primary" onClick={save} disabled={!canSave}>
          <IconCheck width={16} height={16} /> {t("common.save")}
        </button>
      </div>
    </div>
  );
}
