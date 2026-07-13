import { activityLabel } from "../lib/activities.js";
import { t } from "../lib/i18n.js";

// Grid of toggleable activity chips (Daylio-style).
export default function ActivityPicker({ activities, selected, onToggle }) {
  const sel = new Set(selected || []);
  if (!activities.length) {
    return (
      <div style={{ color: "var(--ink-faint)", fontSize: 13 }}>{t("act.none")}</div>
    );
  }
  return (
    <div className="act-grid">
      {activities.map((a) => (
        <button
          key={a.id}
          type="button"
          className={"act-chip" + (sel.has(a.id) ? " on" : "")}
          onClick={() => onToggle(a.id)}
        >
          <span className="act-emoji">{a.emoji}</span>
          <span className="act-name">{activityLabel(a)}</span>
        </button>
      ))}
    </div>
  );
}
