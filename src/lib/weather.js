import { t } from "./i18n.js";

// Simple, offline weather tags (Daylio / Day One style). No network, no GPS —
// the user picks the sky they had. `id` is stored; the emoji/label are display.
export const WEATHERS = [
  { id: "sunny", emoji: "☀️" },
  { id: "partly", emoji: "🌤️" },
  { id: "cloudy", emoji: "☁️" },
  { id: "rainy", emoji: "🌧️" },
  { id: "stormy", emoji: "⛈️" },
  { id: "snowy", emoji: "❄️" },
  { id: "foggy", emoji: "🌫️" },
  { id: "windy", emoji: "💨" },
];

const BY_ID = Object.fromEntries(WEATHERS.map((w) => [w.id, w]));

export function weatherOf(id) {
  return id ? BY_ID[id] || null : null;
}

export function weatherLabel(id) {
  return id ? t("weather." + id) : "";
}
