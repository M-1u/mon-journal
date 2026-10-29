import { useMemo, useState } from "react";
import { MOODS, moodOf, moodLabel } from "../lib/moods.js";
import { weatherOf } from "../lib/weather.js";
import { activityMap, activityLabel } from "../lib/activities.js";
import { fromKey, monthShort } from "../lib/date.js";
import { normImages } from "../lib/images.js";
import { storage } from "../lib/storage.js";
import { t } from "../lib/i18n.js";
import { IconSearch, IconClose } from "./Icons.jsx";

function plain(text) {
  return (text || "").replace(/[#*_`>[\]]/g, "").replace(/\n+/g, " ");
}

export default function SearchView({ entries, activities, onOpenDay, onOpenLabel }) {
  const [q, setQ] = useState("");
  const [moods, setMoods] = useState(() => new Set());
  const [acts, setActs] = useState(() => new Set());
  const [tagSet, setTagSet] = useState(() => new Set());
  const [peopleSet, setPeopleSet] = useState(() => new Set());
  const [favOnly, setFavOnly] = useState(false);
  const actMap = activityMap(activities);

  // All tags / people in use, ordered by frequency, for the filter chips.
  const { allTags, allPeople } = useMemo(() => {
    const tc = {}, pc = {};
    for (const e of entries) {
      for (const tg of e.tags || []) tc[tg] = (tc[tg] || 0) + 1;
      for (const p of e.people || []) pc[p] = (pc[p] || 0) + 1;
    }
    const sort = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([v]) => v);
    return { allTags: sort(tc), allPeople: sort(pc) };
  }, [entries]);

  const toggle = (set, val, setter) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };
  const active = q.trim() || moods.size || acts.size || tagSet.size || peopleSet.size || favOnly;

  const results = useMemo(() => {
    if (!active) return [];
    const needle = q.trim().toLowerCase();
    return entries
      .filter((e) => {
        if (needle) {
          const hay = (plain(e.text) + " " + (e.place || "") + " " +
            (e.tags || []).join(" ") + " " + (e.people || []).join(" ")).toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        if (moods.size && !moods.has(e.mood)) return false;
        if (acts.size && !(e.activities || []).some((id) => acts.has(id))) return false;
        if (tagSet.size && !(e.tags || []).some((tg) => tagSet.has(tg))) return false;
        if (peopleSet.size && !(e.people || []).some((p) => peopleSet.has(p))) return false;
        if (favOnly && !e.favorite) return false;
        return true;
      })
      .sort((a, b) => (a.date === b.date ? (a.time < b.time ? 1 : -1) : a.date < b.date ? 1 : -1));
  }, [entries, q, moods, acts, tagSet, peopleSet, favOnly, active]);

  return (
    <div className="view">
      <h1 className="page-title">{t("search.title")}</h1>

      <div className="search-box">
        <IconSearch width={18} height={18} />
        <input
          autoFocus
          className="search-input"
          placeholder={t("search.placeholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button className="search-clear" onClick={() => setQ("")}>
            <IconClose width={15} height={15} />
          </button>
        )}
      </div>

      <div className="search-filters">
        <div className="sf-group">
          <span className="sf-label">{t("search.moods")}</span>
          {MOODS.map((m) => (
            <button
              key={m.value}
              className={"sf-chip" + (moods.has(m.value) ? " on" : "")}
              style={moods.has(m.value) ? { "--m-color": m.color, borderColor: m.color, color: m.color } : null}
              onClick={() => toggle(moods, m.value, setMoods)}
              title={moodLabel(m.value)}
            >
              {m.emoji}
            </button>
          ))}
        </div>
        {activities.length > 0 && (
          <div className="sf-group">
            <span className="sf-label">{t("search.activities")}</span>
            {activities.map((a) => (
              <button
                key={a.id}
                className={"sf-chip act" + (acts.has(a.id) ? " on" : "")}
                onClick={() => toggle(acts, a.id, setActs)}
              >
                <span>{a.emoji}</span> {activityLabel(a)}
              </button>
            ))}
          </div>
        )}
        {allTags.length > 0 && (
          <div className="sf-group">
            <span className="sf-label">{t("search.tags")}</span>
            {allTags.map((tg) => (
              <button key={tg} className={"sf-chip" + (tagSet.has(tg) ? " on" : "")} onClick={() => toggle(tagSet, tg, setTagSet)}>
                #{tg}
              </button>
            ))}
          </div>
        )}
        {allPeople.length > 0 && (
          <div className="sf-group">
            <span className="sf-label">{t("search.people")}</span>
            {allPeople.map((p) => (
              <button key={p} className={"sf-chip" + (peopleSet.has(p) ? " on" : "")} onClick={() => toggle(peopleSet, p, setPeopleSet)}>
                @{p}
              </button>
            ))}
          </div>
        )}
        <div className="sf-group">
          <button
            className={"sf-chip" + (favOnly ? " on" : "")}
            style={favOnly ? { borderColor: "#f0b429", color: "#f0b429" } : null}
            onClick={() => setFavOnly((v) => !v)}
            aria-pressed={favOnly}
          >
            ★ {t("search.favorites")}
          </button>
        </div>
        {active ? (
          <button className="sf-reset" onClick={() => { setQ(""); setMoods(new Set()); setActs(new Set()); setTagSet(new Set()); setPeopleSet(new Set()); setFavOnly(false); }}>
            {t("search.clear")}
          </button>
        ) : null}
      </div>

      {!active ? (
        <div className="empty"><div className="big">🔎</div>{t("search.start")}</div>
      ) : results.length === 0 ? (
        <div className="empty"><div className="big">🤔</div>{t("search.empty")}</div>
      ) : (
        <>
          <p className="page-sub" style={{ margin: "4px 0 18px" }}>{t("search.count", { n: results.length })}</p>
          <div className="timeline">
            {results.map((e) => {
              const d = fromKey(e.date);
              const mood = moodOf(e.mood);
              const imgs = normImages(e.images);
              return (
                <div className="card tl-card" key={e.id} onClick={() => onOpenDay(e.date)}>
                  <div className="tl-date">
                    <div className="dd">{d.getDate()}</div>
                    <div className="mm">{monthShort(d.getMonth())}</div>
                    <div className="tl-time">{e.time}</div>
                  </div>
                  <div className="tl-body">
                    <div className="top">
                      {mood ? (
                        <>
                          <span className="emoji">{mood.emoji}</span>
                          <span className="mlabel" style={{ color: mood.color }}>{moodLabel(mood.value)}</span>
                        </>
                      ) : null}
                      {e.weather ? <span className="tl-weather">{weatherOf(e.weather)?.emoji}</span> : null}
                      {e.favorite ? <span className="tl-fav">★</span> : null}
                    </div>
                    {e.place ? <div className="tl-place">📍 {e.place}</div> : null}
                    {e.activities?.length ? (
                      <div className="tl-acts">
                        {e.activities.map((id) => actMap[id] ? (
                          <span className="tl-act" key={id}><span>{actMap[id].emoji}</span> {activityLabel(actMap[id])}</span>
                        ) : null)}
                      </div>
                    ) : null}
                    {e.text?.trim() ? <div className="excerpt">{plain(e.text)}</div> : null}
                    {(e.tags?.length || e.people?.length) ? (
                      <div className="de-labels">
                        {(e.tags || []).map((tg) => (
                          <button className="lbl-tag" key={"t" + tg} onClick={(ev) => { ev.stopPropagation(); onOpenLabel?.("tag", tg); }}>#{tg}</button>
                        ))}
                        {(e.people || []).map((p) => (
                          <button className="lbl-person" key={"p" + p} onClick={(ev) => { ev.stopPropagation(); onOpenLabel?.("person", p); }}>@{p}</button>
                        ))}
                      </div>
                    ) : null}
                    {imgs.length ? (
                      <div className="tl-thumbs">
                        {imgs.slice(0, 4).map((im, i) => (
                          <img key={im.name + i} src={storage.imageUrl(im.name)} alt="" />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
