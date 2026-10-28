import { useState } from "react";
import { t } from "../lib/i18n.js";
import { IconPlus, IconClose } from "./Icons.jsx";

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

// Define the daily habits / metrics tracked on the Today page.
export default function TrackersManager({ trackers, onChange }) {
  const defs = trackers?.defs || [];
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("check");
  const [target, setTarget] = useState("");

  function add(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const def = {
      id: uid(),
      emoji: emoji.trim() || (type === "count" ? "🔢" : "✅"),
      name: n,
      type,
      target: type === "count" && target ? Number(target) : null,
    };
    onChange({ ...trackers, defs: [...defs, def] });
    setEmoji(""); setName(""); setTarget(""); setType("check");
  }
  function remove(id) {
    onChange({ ...trackers, defs: defs.filter((d) => d.id !== id) });
  }

  return (
    <div className="card" style={{ marginTop: 18, padding: 18 }}>
      <div className="info" style={{ marginBottom: 14 }}>
        <div className="t">{t("trk.title")}</div>
        <div className="d">{t("trk.sub")}</div>
      </div>

      {defs.length > 0 && (
        <div className="act-manage">
          {defs.map((d) => (
            <span className="act-tag" key={d.id}>
              <span>{d.emoji}</span> {d.name}
              <span style={{ color: "var(--ink-faint)", fontSize: 12 }}>
                {d.type === "count" ? ` · ${t("trk.count")}${d.target ? ` (${d.target})` : ""}` : ` · ${t("trk.check")}`}
              </span>
              <button className="act-rm" onClick={() => remove(d.id)} title={t("common.remove")}>
                <IconClose width={12} height={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={add} className="act-add trk-add">
        <input className="act-add-emoji" placeholder="💧" maxLength={4} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        <input className="act-add-name" placeholder={t("trk.placeholder")} value={name} onChange={(e) => setName(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label={t("trk.type")}>
          <option value="check">{t("trk.check")}</option>
          <option value="count">{t("trk.count")}</option>
        </select>
        {type === "count" && (
          <input className="trk-target" type="number" min="0" placeholder={t("trk.target")} value={target} onChange={(e) => setTarget(e.target.value)} />
        )}
        <button type="submit" className="btn primary" disabled={!name.trim()}>
          <IconPlus width={16} height={16} /> {t("common.add")}
        </button>
      </form>
    </div>
  );
}
