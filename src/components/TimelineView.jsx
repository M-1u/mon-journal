import { moodOf, moodLabel } from "../lib/moods.js";
import { fromKey, monthShort } from "../lib/date.js";
import { storage } from "../lib/storage.js";
import { normImages } from "../lib/images.js";
import { activityMap, activityLabel } from "../lib/activities.js";
import { t } from "../lib/i18n.js";

function excerpt(text) {
  return (text || "").replace(/[#*_`>\-[\]]/g, "").replace(/\n+/g, " ").trim();
}

export default function TimelineView({ entries, activities, onOpenDay }) {
  const actMap = activityMap(activities);
  const filled = entries.filter((e) => e.mood || e.text?.trim() || e.images?.length || e.activities?.length);

  if (!filled.length) {
    return (
      <div className="view">
        <h1 className="page-title">{t("tl.title")}</h1>
        <div className="empty">
          <div className="big">📝</div>
          {t("tl.empty")}
          <div style={{ marginTop: 6 }}>{t("tl.emptyHint")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <h1 className="page-title">{t("tl.title")}</h1>
      <p className="page-sub">{t("tl.count", { n: filled.length })}</p>

      <div className="timeline">
        {filled.map((e) => {
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
                  ) : (
                    <span className="mlabel" style={{ color: "var(--ink-faint)" }}>{t("tl.noMood")}</span>
                  )}
                </div>
                {e.activities?.length ? (
                  <div className="tl-acts">
                    {e.activities.map((id) =>
                      actMap[id] ? (
                        <span className="tl-act" key={id}>
                          <span>{actMap[id].emoji}</span> {activityLabel(actMap[id])}
                        </span>
                      ) : null
                    )}
                  </div>
                ) : null}
                {e.text?.trim() ? <div className="excerpt">{excerpt(e.text)}</div> : null}
                {imgs.length ? (
                  <div className="tl-thumbs">
                    {imgs.slice(0, 4).map((im, i) => (
                      <img key={im.name + i} src={storage.imageUrl(im.name)} alt={im.caption || ""} title={im.caption || ""} />
                    ))}
                    {imgs.length > 4 ? <div className="more">+{imgs.length - 4}</div> : null}
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
