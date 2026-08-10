// Goals (objectifs) grouped by term.
export const TERMS = [
  { id: "short", label: "Court terme", emoji: "⚡" },
  { id: "medium", label: "Moyen terme", emoji: "📅" },
  { id: "long", label: "Long terme", emoji: "🌱" },
];

export const TERM_BY_ID = Object.fromEntries(TERMS.map((t) => [t.id, t]));

// Ready-made goal suggestions (bilingual) with a suggested term. Selecting one
// pre-fills the "new goal" field.
export const GOAL_PRESETS = [
  { fr: "Faire du sport 3× par semaine", en: "Exercise 3× a week", term: "short" },
  { fr: "Courir 5 km", en: "Run 5 km", term: "short" },
  { fr: "Marcher 10 000 pas par jour", en: "Walk 10,000 steps a day", term: "short" },
  { fr: "Boire 2 L d'eau par jour", en: "Drink 2 L of water a day", term: "short" },
  { fr: "Méditer chaque matin", en: "Meditate every morning", term: "short" },
  { fr: "Dormir 8 h par nuit", en: "Sleep 8 hours a night", term: "short" },
  { fr: "Écrire dans mon journal chaque jour", en: "Journal every day", term: "short" },
  { fr: "Manger plus sainement", en: "Eat healthier", term: "medium" },
  { fr: "Lire 1 livre par mois", en: "Read 1 book a month", term: "medium" },
  { fr: "Réduire mon temps d'écran", en: "Cut down my screen time", term: "medium" },
  { fr: "Économiser de l'argent", en: "Save money", term: "medium" },
  { fr: "Apprendre une nouvelle langue", en: "Learn a new language", term: "long" },
  { fr: "Apprendre un instrument", en: "Learn an instrument", term: "long" },
  { fr: "Voyager dans un nouveau pays", en: "Travel to a new country", term: "long" },
];

export function goalMap(list) {
  const m = {};
  for (const g of list || []) m[g.id] = g;
  return m;
}

export function newGoalId() {
  return "goal-" + Math.random().toString(36).slice(2, 9);
}

// A goal is "achieved" if any entry validated it. Returns a Set of goal ids.
export function achievedGoalIds(entries) {
  const s = new Set();
  for (const e of entries || []) for (const id of e.goals || []) s.add(id);
  return s;
}

// Map goalId -> earliest date it was validated.
export function achievedDates(entries) {
  const m = {};
  for (const e of entries || []) {
    for (const id of e.goals || []) {
      if (!m[id] || e.date < m[id]) m[id] = e.date;
    }
  }
  return m;
}
