import { t } from "./i18n.js";

// Localized label for a mood value.
export function moodLabel(value) {
  return t("mood." + value);
}

// Five-level mood scale, in the spirit of Daily You / Daylio.
// value 1 (worst) .. 5 (best). `label` is the French fallback; UI uses moodLabel().
export const MOODS = [
  { value: 5, label: "Génial", emoji: "😄", color: "#3da35d" },
  { value: 4, label: "Bien", emoji: "🙂", color: "#7cb342" },
  { value: 3, label: "Neutre", emoji: "😐", color: "#f0b429" },
  { value: 2, label: "Bof", emoji: "🙁", color: "#ef8b3b" },
  { value: 1, label: "Horrible", emoji: "😢", color: "#e5544b" },
];

export const MOOD_BY_VALUE = Object.fromEntries(MOODS.map((m) => [m.value, m]));

export function moodOf(value) {
  return MOOD_BY_VALUE[value] || null;
}

// Ascending order (worst → best) for charts/distribution.
export const MOODS_ASC = [...MOODS].sort((a, b) => a.value - b.value);
