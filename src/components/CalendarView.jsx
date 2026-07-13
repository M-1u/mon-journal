import { useState } from "react";
import { moodOf } from "../lib/moods.js";
import {
  toKey,
  formatMonthYear,
  mondayIndex,
  weekdaysShort,
  todayKey,
} from "../lib/date.js";
import { IconChevronLeft, IconChevronRight } from "./Icons.jsx";
import { t } from "../lib/i18n.js";

export default function CalendarView({ entriesByDate, onOpenDay }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = mondayIndex(first);
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function shift(delta) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setMonth(m);
    setYear(y);
  }

  const tk = todayKey();

  return (
    <div className="view">
      <h1 className="page-title">{t("cal.title")}</h1>
      <p className="page-sub">{t("cal.sub")}</p>

      <div className="card" style={{ padding: 20 }}>
        <div className="cal-head">
          <button className="icon-btn" onClick={() => shift(-1)}>
            <IconChevronLeft />
          </button>
          <div className="my">{formatMonthYear(year, month)}</div>
          <button className="icon-btn" onClick={() => shift(1)}>
            <IconChevronRight />
          </button>
        </div>

        <div className="cal-grid">
          {weekdaysShort().map((w, i) => (
            <div className="cal-dow" key={i}>
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div className="cal-cell filler" key={"f" + i} />;
            const key = toKey(new Date(year, month, d));
            const list = entriesByDate[key] || [];
            const moods = list.map((e) => e.mood).filter((m) => m != null);
            const avg = moods.length ? Math.round(moods.reduce((s, m) => s + m, 0) / moods.length) : null;
            const mood = avg ? moodOf(avg) : null;
            const hasPhotos = list.some((e) => e.images?.length);
            const future = key > tk;
            const cls = [
              "cal-cell",
              "clickable",
              key === tk ? "today" : "",
              mood ? "has-mood" : "",
              future ? "future" : "",
            ].join(" ");
            return (
              <button
                key={key}
                className={cls}
                style={mood ? { background: color(mood.color), borderColor: "transparent" } : null}
                onClick={() => onOpenDay(key)}
              >
                <span className="num">{d}</span>
                {mood ? <span className="mood-dot">{mood.emoji}</span> : null}
                {list.length > 1 ? <span className="cal-count">{list.length}</span> : null}
                {hasPhotos ? <span className="photo-flag">📷</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function color(hex) {
  return `color-mix(in srgb, ${hex} 20%, var(--surface))`;
}
