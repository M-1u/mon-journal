import { t } from "../lib/i18n.js";

// Daily habit/metric input for one date. Check-type trackers toggle 0/1;
// count-type trackers step up/down. Values live in trackers.log[date][id].
export default function TrackersPanel({ trackers, date, onChange }) {
  const defs = trackers?.defs || [];
  if (!defs.length) return null;
  const day = (trackers.log && trackers.log[date]) || {};

  function setVal(id, value) {
    const log = { ...(trackers.log || {}) };
    const d = { ...(log[date] || {}) };
    if (value) d[id] = value;
    else delete d[id];
    if (Object.keys(d).length) log[date] = d;
    else delete log[date];
    onChange({ ...trackers, log });
  }

  return (
    <div className="card panel trackers-panel">
      <div className="panel-head"><h3>{t("trackers.title")}</h3></div>
      <div className="tracker-row">
        {defs.map((trk) => {
          const v = day[trk.id] || 0;
          const reached = trk.target && v >= trk.target;
          if (trk.type === "count") {
            return (
              <div className={"tracker count" + (v ? " active" : "") + (reached ? " reached" : "")} key={trk.id}>
                <span className="trk-emoji">{trk.emoji}</span>
                <span className="trk-name">{trk.name}</span>
                <div className="trk-counter">
                  <button onClick={() => setVal(trk.id, Math.max(0, v - 1))} aria-label="−">−</button>
                  <span className="trk-val">{v}{trk.target ? <small>/{trk.target}</small> : null}</span>
                  <button onClick={() => setVal(trk.id, v + 1)} aria-label="+">+</button>
                </div>
              </div>
            );
          }
          return (
            <button
              className={"tracker check" + (v ? " active" : "")}
              key={trk.id}
              onClick={() => setVal(trk.id, v ? 0 : 1)}
              aria-pressed={!!v}
            >
              <span className="trk-emoji">{trk.emoji}</span>
              <span className="trk-name">{trk.name}</span>
              {v ? <span className="trk-tick">✓</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
