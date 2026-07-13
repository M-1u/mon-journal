// Goals (objectifs) grouped by term.
export const TERMS = [
  { id: "short", label: "Court terme", emoji: "⚡" },
  { id: "medium", label: "Moyen terme", emoji: "📅" },
  { id: "long", label: "Long terme", emoji: "🌱" },
];

export const TERM_BY_ID = Object.fromEntries(TERMS.map((t) => [t.id, t]));

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
