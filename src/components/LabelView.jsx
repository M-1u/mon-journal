import { useMemo } from "react";
import { moodOf, moodLabel } from "../lib/moods.js";
import { activityMap, activityLabel } from "../lib/activities.js";
import { fromKey, monthShort } from "../lib/date.js";
import { normImages } from "../lib/images.js";
import { storage } from "../lib/storage.js";
import { t } from "../lib/i18n.js";
import { IconChevronLeft } from "./Icons.jsx";

function plain(text) {
  return (text || "").replace(/[#*_`>[\]]/g, "").replace(/\n+/g, " ");
}

// All moments tied to one tag (#) or person (@): a header with the count and
// average mood, then a timeline of matching entries.
export default function LabelView({ label, entries, activities, onOpenDay, onOpenLabel, onBack }) {
  const actMap = activityMap(activities);
  const { type, value } = label;

  const matches = useMemo(() => {
    const field = type === "tag" ? "tags" : "people";
    return entries
      .filter((e) => (e[field] || []).some((v) => v.toLowerCase() === value.toLowerCase()))
      .sort((a, b) => (a.date === b.date ? (a.time < b.time ? 1 : -1) : a.date < b.date ? 1 : -1));
  }, [entries, type, value]);

  const rated = matches.filter((e) => e.mood != null);
  const avg = rated.length ? rated.reduce((s, e) => s + e.mood, 0) / rated.length : null;
  const avgMood = avg != null ? moodOf(Math.round(avg)) : null;
  const prefix = type === "tag" ? "#" : "@";

  return (
    <div className="view">
      <div className="label-head">
        <button className="btn ghost" onClick={onBack}>
          <IconChevronLeft width={16} height={16} /> {t("common.back")}
        </button>
      </div>

      <h1 className="page-title">
        <span className={type === "tag" ? "lbl-tag big" : "lbl-person big"}>{prefix}{value}</span>
      </h1>
      <p className="page-sub">
        {t("label.count", { n: matches.length })}
        {avgMood ? <> · {avgMood.emoji} {avg.toFixed(1)}</> : null}
      </p>

      <div className="timeline">
        {matches.map((e) => {
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
                </div>
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
                      <button className="lbl-tag" key={"t" + tg} onClick={(ev) => { ev.stopPropagation(); onOpenLabel("tag", tg); }}>#{tg}</button>
                    ))}
                    {(e.people || []).map((p) => (
                      <button className="lbl-person" key={"p" + p} onClick={(ev) => { ev.stopPropagation(); onOpenLabel("person", p); }}>@{p}</button>
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
    </div>
  );
}
