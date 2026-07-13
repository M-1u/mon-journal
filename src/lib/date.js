// All dates are handled as local "YYYY-MM-DD" keys.
import { localeTag } from "./i18n.js";

export function toKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toKey(new Date());
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

// Intl formatters are built per-locale on demand (cheap) so they follow the
// currently selected language.
const fmtCache = {};
function fmt(kind, opts) {
  const loc = localeTag();
  const key = loc + ":" + kind;
  if (!fmtCache[key]) fmtCache[key] = new Intl.DateTimeFormat(loc, opts);
  return fmtCache[key];
}

export function formatLong(key) {
  return fmt("long", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(fromKey(key));
}
export function formatMedium(key) {
  return fmt("medium", { weekday: "short", day: "numeric", month: "short" }).format(fromKey(key));
}
export function formatMonthYear(year, month) {
  return fmt("monthYear", { month: "long", year: "numeric" }).format(new Date(year, month, 1));
}
// Short month name for a 0-based month index, in the current locale.
export function monthShort(monthIndex) {
  return fmt("monthShort", { month: "short" }).format(new Date(2020, monthIndex, 1));
}

export function isToday(key) {
  return key === todayKey();
}

export function isFuture(key) {
  return key > todayKey();
}

// Monday-first weekday index (0 = Monday .. 6 = Sunday).
export function mondayIndex(d) {
  return (d.getDay() + 6) % 7;
}

// Monday-first short weekday names in the current locale.
export function weekdaysShort() {
  const f = fmt("weekdayShort", { weekday: "short" });
  const out = [];
  // 2024-01-01 is a Monday.
  for (let i = 0; i < 7; i++) out.push(f.format(new Date(2024, 0, 1 + i)));
  return out;
}
