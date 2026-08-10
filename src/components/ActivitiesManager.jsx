import { useState } from "react";
import { slugForActivity, activityLabel } from "../lib/activities.js";
import { t } from "../lib/i18n.js";
import { IconPlus, IconClose, IconEdit, IconCheck } from "./Icons.jsx";

// Manage the journal's activity tags (add / edit / remove).
export default function ActivitiesManager({ activities, onChange }) {
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [eEmoji, setEEmoji] = useState("");
  const [eName, setEName] = useState("");

  function add(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    onChange([...activities, { id: slugForActivity(n), emoji: emoji.trim() || "🏷️", name: n }]);
    setEmoji("");
    setName("");
  }

  function remove(id) {
    onChange(activities.filter((a) => a.id !== id));
  }

  function startEdit(a) {
    setEditId(a.id);
    setEEmoji(a.emoji);
    setEName(activityLabel(a));
  }
  function saveEdit(e) {
    e.preventDefault();
    const n = eName.trim();
    if (!n) return;
    onChange(activities.map((a) =>
      a.id === editId ? { ...a, emoji: eEmoji.trim() || a.emoji, name: n, custom: true } : a
    ));
    setEditId(null);
  }

  return (
    <div className="card" style={{ marginTop: 18, padding: 18 }}>
      <div className="info" style={{ marginBottom: 14 }}>
        <div className="t">{t("actm.title")}</div>
        <div className="d">{t("actm.sub")}</div>
      </div>

      {editId && (
        <form onSubmit={saveEdit} className="act-edit-row">
          <input className="act-add-emoji" maxLength={4} value={eEmoji} onChange={(e) => setEEmoji(e.target.value)} autoFocus />
          <input className="act-add-name" value={eName} onChange={(e) => setEName(e.target.value)} />
          <button type="submit" className="btn primary" disabled={!eName.trim()}>
            <IconCheck width={16} height={16} /> {t("common.save")}
          </button>
          <button type="button" className="btn ghost" onClick={() => setEditId(null)}>{t("common.cancel")}</button>
        </form>
      )}

      <div className="act-manage">
        {activities.map((a) => (
          <span className="act-tag" key={a.id}>
            <span>{a.emoji}</span> {activityLabel(a)}
            <button className="act-edit" onClick={() => startEdit(a)} title={t("read.edit")}>
              <IconEdit width={12} height={12} />
            </button>
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
