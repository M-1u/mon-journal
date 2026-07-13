import { useState } from "react";
import { MOODS, moodLabel } from "../lib/moods.js";
import { normImages } from "../lib/images.js";
import { goalMap, TERM_BY_ID } from "../lib/goals.js";
import { t } from "../lib/i18n.js";
import MarkdownEditor from "./MarkdownEditor.jsx";
import PhotoStrip from "./PhotoStrip.jsx";
import ActivityPicker from "./ActivityPicker.jsx";
import { IconChevronLeft, IconCheck, IconTrash, IconClose } from "./Icons.jsx";

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Full form to create or edit one entry.
export default function EntryEditor({ date, entry, activities, goals, onSave, onDelete, onCancel }) {
  const isNew = !entry;
  const [time, setTime] = useState(entry?.time || nowTime());
  const [mood, setMood] = useState(entry?.mood ?? null);
  const [acts, setActs] = useState(entry?.activities || []);
  const [goalIds, setGoalIds] = useState(entry?.goals || []);
  const [text, setText] = useState(entry?.text || "");
  const [images, setImages] = useState(normImages(entry?.images));

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

  function save() {
    onSave({ id: entry?.id, date, time, mood, activities: acts, goals: goalIds, text, images });
  }

  const canSave = mood != null || text.trim() || acts.length || images.length || goalIds.length;

  return (
    <div className="entry-editor">
      <div className="ee-head">
        <button className="btn ghost" onClick={onCancel}>
          <IconChevronLeft width={16} height={16} /> {t("common.back")}
        </button>
        <div className="ee-title">{isNew ? t("editor.new") : t("editor.edit")}</div>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          title={t("editor.time")}
        />
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

      <p className="section-label">{t("editor.activities")}</p>
      <ActivityPicker activities={activities} selected={acts} onToggle={toggleAct} />

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

      <p className="section-label" style={{ marginTop: 24 }}>{t("editor.note")}</p>
      <MarkdownEditor value={text} onChange={setText} />

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
