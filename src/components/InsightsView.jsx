import { useMemo } from "react";
import { moodOf, moodLabel } from "../lib/moods.js";
import { activityMap, activityLabel } from "../lib/activities.js";
import { weatherOf, weatherLabel } from "../lib/weather.js";
import { todayKey, addDays, fromKey, mondayIndex, formatLong, formatDayMonth } from "../lib/date.js";
import { t } from "../lib/i18n.js";

// Average mood grouped by a dimension. keyFn returns the keys an entry belongs
// to (one for weather, many for activities/people). Only groups with >= 2 rated
// entries are kept, so a single good day doesn't dominate.
function avgMoodBy(entries, keyFn) {
  const agg = {};
  for (const e of entries) {
    if (e.mood == null) continue;
    for (const k of keyFn(e)) {
      if (k == null || k === "") continue;
      (agg[k] ||= { sum: 0, n: 0 });
      agg[k].sum += e.mood;
      agg[k].n++;
    }
  }
  return Object.entries(agg)
    .map(([key, { sum, n }]) => ({ key, avg: sum / n, n }))
    .filter((x) => x.n >= 2)
    .sort((a, b) => b.avg - a.avg);
}

function CorrelationPanel({ title, rows, label }) {
  if (!rows.length) return null;
  return (
    <div className="card panel">
      <h3>{title}</h3>
      {rows.map((r) => {
        const m = moodOf(Math.round(r.avg));
        return (
          <div className="corr-row" key={r.key}>
            <span className="corr-label">{label(r.key)}</span>
            <div className="corr-bar">
              <div className="corr-fill" style={{ width: `${(r.avg / 5) * 100}%`, background: m ? m.color : "var(--surface-2)" }} />
            </div>
            <span className="corr-val">
              {m ? <span style={{ fontSize: 15 }}>{m.emoji}</span> : null} {r.avg.toFixed(1)}
              <small>·{r.n}</small>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function InsightsView({ entries, entriesByDate, activities }) {
  const actMap = activityMap(activities);
  const rated = entries.filter((e) => e.mood != null);

  const byWeather = useMemo(() => avgMoodBy(entries, (e) => (e.weather ? [e.weather] : [])), [entries]);
  const byActivity = useMemo(() => avgMoodBy(entries, (e) => e.activities || []), [entries]);
  const byPeople = useMemo(() => avgMoodBy(entries, (e) => e.people || []), [entries]);

  // 52-week mood heatmap ending today, aligned to Monday columns.
  const heat = useMemo(() => {
    const today = todayKey();
    let start = addDays(today, -7 * 51);
    start = addDays(start, -mondayIndex(fromKey(start)));
    const weeks = [];
    let cur = start;
    while (cur <= today) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        if (cur <= today) {
          const list = (entriesByDate[cur] || []).map((e) => e.mood).filter((m) => m != null);
          const avg = list.length ? list.reduce((s, m) => s + m, 0) / list.length : null;
          week.push({ key: cur, mood: avg == null ? null : Math.round(avg) });
        } else {
          week.push(null);
        }
        cur = addDays(cur, 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [entriesByDate]);

  if (rated.length < 2) {
    return (
      <div className="view">
        <h1 className="page-title">{t("insights.title")}</h1>
        <div className="empty"><div className="big">🔎</div>{t("insights.empty")}</div>
      </div>
    );
  }

  return (
    <div className="view">
      <h1 className="page-title">{t("insights.title")}</h1>
      <p className="page-sub">{t("insights.sub")}</p>

      <div className="card panel">
        <h3>{t("insights.heatmap")}</h3>
        <div className="heatmap">
          {heat.map((week, wi) => (
            <div className="heat-week" key={wi}>
              {week.map((cell, di) => {
                if (!cell) return <div className="heat-cell empty" key={di} />;
                const m = cell.mood != null ? moodOf(cell.mood) : null;
                return (
                  <div
                    className="heat-cell"
                    key={di}
                    style={{ background: m ? m.color : "var(--surface-2)" }}
                    title={`${formatLong(cell.key)}${m ? " · " + moodLabel(m.value) : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="heat-legend">
          <span>{t("insights.worse")}</span>
          {[1, 2, 3, 4, 5].map((v) => <i key={v} style={{ background: moodOf(v).color }} />)}
          <span>{t("insights.better")}</span>
        </div>
      </div>

      <CorrelationPanel title={t("insights.byWeather")} rows={byWeather}
        label={(k) => <>{weatherOf(k)?.emoji} {weatherLabel(k)}</>} />
      <CorrelationPanel title={t("insights.byActivity")} rows={byActivity}
        label={(k) => actMap[k] ? <>{actMap[k].emoji} {activityLabel(actMap[k])}</> : k} />
      <CorrelationPanel title={t("insights.byPeople")} rows={byPeople}
        label={(k) => <>@{k}</>} />
    </div>
  );
}
