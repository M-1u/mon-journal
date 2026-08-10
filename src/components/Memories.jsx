import { moodOf } from "../lib/moods.js";
import { fromKey, toKey, addDays } from "../lib/date.js";
import { t } from "../lib/i18n.js";

function excerpt(text) {
  return (text || "").replace(/[#*_`>\-[\]]/g, "").replace(/\n+/g, " ").trim();
}

// "On this day" memories for the given date: same calendar day in earlier years,
// one month ago, and one week ago. Renders nothing when there's nothing to show.
export default function Memories({ date, allEntries, onOpenDay }) {
  const d = fromKey(date);
  const byDate = {};
  for (const e of allEntries) (byDate[e.date] ||= []).push(e);

  const sections = [];

  // same month/day, earlier years
  const years = {};
  for (const e of allEntries) {
    const ed = fromKey(e.date);
    if (ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate() && ed.getFullYear() < d.getFullYear()) {
      const n = d.getFullYear() - ed.getFullYear();
      (years[n] ||= []).push(e);
    }
  }
  Object.keys(years)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((n) => sections.push({ label: t("memories.yearsAgo", { n }), entries: years[n] }));

  // one month ago
  const monthAgo = toKey(new Date(d.getFullYear(), d.getMonth() - 1, d.getDate()));
  if (byDate[monthAgo]) sections.push({ label: t("memories.monthAgo"), entries: byDate[monthAgo] });

  // one week ago
  const weekAgo = addDays(date, -7);
  if (byDate[weekAgo]) sections.push({ label: t("memories.weekAgo"), entries: byDate[weekAgo] });

  if (!sections.length) return null;

  return (
    <div className="memories">
      <div className="mem-head">✨ {t("memories.title")}</div>
      {sections.map((s, i) => (
        <div className="mem-section" key={i}>
          <div className="mem-when">{s.label}</div>
          {s.entries.map((e) => {
            const mood = moodOf(e.mood);
            return (
              <button className="mem-item" key={e.id} onClick={() => onOpenDay(e.date)}>
                {mood ? <span className="mem-emoji">{mood.emoji}</span> : <span className="mem-emoji">📝</span>}
                <span className="mem-text">{excerpt(e.text) || "—"}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
