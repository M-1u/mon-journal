import { useState } from "react";
import { slugForActivity, activityLabel } from "../lib/activities.js";
import { t } from "../lib/i18n.js";
import { IconPlus, IconClose } from "./Icons.jsx";

// Manage the journal's activity tags (add / remove).
export default function ActivitiesManager({ activities, onChange }) {
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");

  function add(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const activity = { id: slugForActivity(n), emoji: emoji.trim() || "🏷️", name: n };
    onChange([...activities, activity]);
    setEmoji("");
    setName("");
  }

  function remove(id) {
    onChange(activities.filter((a) => a.id !== id));
  }

  return (
    <div className="card" style={{ marginTop: 18, padding: 18 }}>
      <div className="info" style={{ marginBottom: 14 }}>
        <div className="t">{t("actm.title")}</div>
        <div className="d">{t("actm.sub")}</div>
      </div>

      <div className="act-manage">
        {activities.map((a) => (
          <span className="act-tag" key={a.id}>
            <span>{a.emoji}</span> {activityLabel(a)}
            <button className="act-rm" onClick={() => remove(a.id)} title={t("common.remove")}>
              <IconClose width={12} height={12} />
            </button>
          </span>
        ))}
      </div>

      <form onSubmit={add} className="act-add">
        <input
          className="act-add-emoji"
          placeholder="🙂"
          maxLength={4}
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
        />
        <input
          className="act-add-name"
          placeholder={t("actm.placeholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn primary" disabled={!name.trim()}>
          <IconPlus width={16} height={16} /> {t("common.add")}
        </button>
      </form>
    </div>
  );
}
