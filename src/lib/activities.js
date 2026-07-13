// Default activity tags (Daylio-style). Kept in sync with the copy in
// electron/journal-core.cjs (used as the fallback default in the browser).
export const DEFAULT_ACTIVITIES = [
  { id: "sport", emoji: "🏃", name: "Sport" },
  { id: "marche", emoji: "🚶", name: "Marche" },
  { id: "sommeil", emoji: "😴", name: "Sommeil" },
  { id: "sante", emoji: "💊", name: "Santé" },
  { id: "amis", emoji: "👥", name: "Amis" },
  { id: "famille", emoji: "👨‍👩‍👧", name: "Famille" },
  { id: "couple", emoji: "❤️", name: "Couple" },
  { id: "lecture", emoji: "📖", name: "Lecture" },
  { id: "film", emoji: "🎬", name: "Film / Série" },
  { id: "jeux", emoji: "🎮", name: "Jeux" },
  { id: "musique", emoji: "🎵", name: "Musique" },
  { id: "travail", emoji: "💼", name: "Travail" },
  { id: "etudes", emoji: "📚", name: "Études" },
  { id: "cuisine", emoji: "🍳", name: "Cuisine" },
  { id: "courses", emoji: "🛒", name: "Courses" },
  { id: "menage", emoji: "🧹", name: "Ménage" },
  { id: "voyage", emoji: "✈️", name: "Voyage" },
  { id: "nature", emoji: "🌳", name: "Nature" },
  { id: "repos", emoji: "🛋️", name: "Repos" },
];

import { t } from "./i18n.js";

const DEFAULT_IDS = new Set(DEFAULT_ACTIVITIES.map((a) => a.id));

// Localized display name: built-in activities translate; custom ones keep their
// user-defined name.
export function activityLabel(a) {
  if (!a) return "";
  return DEFAULT_IDS.has(a.id) ? t("activity." + a.id) : a.name;
}

export function activityMap(list) {
  const m = {};
  for (const a of list || []) m[a.id] = a;
  return m;
}

export function slugForActivity(name) {
  const base = (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return (base || "act") + "-" + Math.random().toString(36).slice(2, 6);
}
