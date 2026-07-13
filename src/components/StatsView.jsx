import { MOODS_ASC, moodOf, moodLabel } from "../lib/moods.js";
import { todayKey, addDays } from "../lib/date.js";
import { activityMap, activityLabel } from "../lib/activities.js";
import { t } from "../lib/i18n.js";
import { IconFlame, IconTimeline, IconImage, IconStats } from "./Icons.jsx";

function isFilled(e) {
  return !!(e && (e.mood || e.text?.trim() || e.images?.length || e.activities?.length));
}

function currentStreak(byDate) {
  const has = (d) => (byDate[d] || []).some(isFilled);
  let streak = 0;
  let d = todayKey();
  if (!has(d)) d = addDays(d, -1);
  while (has(d)) {
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

export default function StatsView({ entries, entriesByDate, activities }) {
  const actMap = activityMap(activities);
  const filled = entries.filter(isFilled);

  if (!filled.length) {
    return (
      <div className="view">
        <h1 className="page-title">Statistiques</h1>
        <div className="empty">
          <div className="big">📈</div>
          {t("stats.empty")}
          <div style={{ marginTop: 6 }}>{t("stats.emptyHint")}</div>
        </div>
      </div>
    );
  }

  const withMood = filled.filter((e) => e.mood);
  const avg = withMood.length ? withMood.reduce((s, e) => s + e.mood, 0) / withMood.length : 0;
  const avgMood = moodOf(Math.round(avg));
  const photoCount = filled.reduce((s, e) => s + (e.images?.length || 0), 0);
  const daysCount = Object.keys(entriesByDate).filter((d) => (entriesByDate[d] || []).some(isFilled)).length;
  const streak = currentStreak(entriesByDate);

  // Mood distribution (over entries)
  const counts = Object.fromEntries(MOODS_ASC.map((m) => [m.value, 0]));
  for (const e of withMood) counts[e.mood]++;
  const maxCount = Math.max(1, ...Object.values(counts));

  // 30-day trend (average mood per day)
  const trend = [];
  for (let i = 29; i >= 0; i--) {
    const key = addDays(todayKey(), -i);
    const list = (entriesByDate[key] || []).map((e) => e.mood).filter((m) => m != null);
    const a = list.length ? Math.round(list.reduce((s, m) => s + m, 0) / list.length) : null;
    trend.push({ key, mood: a });
  }

  // Activity frequency
  const actCount = {};
  for (const e of filled) for (const id of e.activities || []) actCount[id] = (actCount[id] || 0) + 1;
  const topActs = Object.entries(actCount)
    .map(([id, n]) => ({ id, n, act: actMap[id] }))
    .filter((x) => x.act)
    .sort((a, b) => b.n - a.n)
    .slice(0, 10);
  const maxAct = Math.max(1, ...topActs.map((x) => x.n));

  return (
    <div className="view">
      <h1 className="page-title">{t("stats.title")}</h1>
      <p className="page-sub">{t("stats.sub")}</p>

      <div className="stat-grid">
        <StatTile icon={<IconFlame width={16} height={16} />} k={t("stats.streak")}
          v={<>{streak} <small>{t("stats.days", { n: streak })}</small></>} />
        <StatTile icon={<IconTimeline width={16} height={16} />} k={t("stats.entries")} v={filled.length} />
        <StatTile icon={<IconStats width={16} height={16} />} k={t("stats.avgMood")}
          v={avgMood ? <>{avgMood.emoji} <small>{avg.toFixed(1)}</small></> : "—"} />
        <StatTile icon={<IconImage width={16} height={16} />} k={t("stats.daysLogged")} v={daysCount} />
      </div>

      <div className="card panel">
        <h3>{t("stats.moodDist")}</h3>
        {MOODS_ASC.slice().reverse().map((m) => {
          const c = counts[m.value];
          const pct = (c / maxCount) * 100;
          return (
            <div className="dist-row" key={m.value}>
              <span className="lbl"><span style={{ fontSize: 17 }}>{m.emoji}</span>{moodLabel(m.value)}</span>
              <div className="dist-track"><div className="dist-fill" style={{ width: `${pct}%`, background: m.color }} /></div>
              <span className="cnt">{c}</span>
            </div>
          );
        })}
      </div>

      {topActs.length > 0 && (
        <div className="card panel">
          <h3>{t("stats.topActs")}</h3>
          {topActs.map(({ id, n, act }) => (
            <div className="dist-row" key={id}>
              <span className="lbl"><span style={{ fontSize: 16 }}>{act.emoji}</span>{activityLabel(act)}</span>
              <div className="dist-track">
                <div className="dist-fill" style={{ width: `${(n / maxAct) * 100}%`, background: "var(--accent)" }} />
              </div>
              <span className="cnt">{n}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card panel">
        <h3>{t("stats.trend")}</h3>
        <div className="trend">
          {trend.map((pt) => {
            const m = moodOf(pt.mood);
            const h = m ? 15 + (m.value / 5) * 85 : 6;
            return (
              <div key={pt.key} className="bar"
                style={{ height: `${h}%`, background: m ? m.color : "var(--surface-2)" }}
                title={`${pt.key}${m ? " · " + moodLabel(m.value) : ""}`} />
            );
          })}
        </div>
        <div className="trend-axis"><span>{t("stats.trendStart")}</span><span>{t("stats.trendEnd")}</span></div>
      </div>
    </div>
  );
}

function StatTile({ icon, k, v }) {
  return (
    <div className="card stat-tile">
      <div className="k">{icon}{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
