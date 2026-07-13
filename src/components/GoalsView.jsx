import { useState } from "react";
import { TERMS, newGoalId, achievedGoalIds, achievedDates } from "../lib/goals.js";
import { formatMedium } from "../lib/date.js";
import { t } from "../lib/i18n.js";
import { IconPlus, IconClose, IconCheck } from "./Icons.jsx";

// Global goals list, grouped by term. Goals are marked "atteint" when validated
// in an entry (derived from entries), and can be added/removed here.
export default function GoalsView({ goals, entries, onChange }) {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("short");

  const achieved = achievedGoalIds(entries);
  const dates = achievedDates(entries);

  function add(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onChange([...goals, { id: newGoalId(), text: t, term, createdAt: new Date().toISOString() }]);
    setText("");
  }

  function remove(id) {
    onChange(goals.filter((g) => g.id !== id));
  }

  const doneCount = goals.filter((g) => achieved.has(g.id)).length;

  return (
    <div className="view">
      <h1 className="page-title">{t("goals.title")}</h1>
      <p className="page-sub">
        {t("goals.sub")}
        {goals.length > 0 && ` · ${t("goals.progress", { done: doneCount, total: goals.length, n: doneCount })}`}
      </p>

      <form onSubmit={add} className="goal-add card">
        <input
          className="goal-add-text"
          placeholder={t("goals.placeholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <select className="goal-term-select" value={term} onChange={(e) => setTerm(e.target.value)}>
          {TERMS.map((tm) => (
            <option key={tm.id} value={tm.id}>{tm.emoji} {t("term." + tm.id)}</option>
          ))}
        </select>
        <button type="submit" className="btn primary" disabled={!text.trim()}>
          <IconPlus width={16} height={16} /> {t("common.add")}
        </button>
      </form>

      {TERMS.map((tm) => {
        const items = goals.filter((g) => g.term === tm.id);
        return (
          <div className="goal-term-block" key={tm.id}>
            <h3 className="goal-term-title">
              <span>{tm.emoji}</span> {t("term." + tm.id)}
              <span className="goal-term-count">{items.length}</span>
            </h3>
            {items.length === 0 ? (
              <div className="goal-empty">{t("goals.emptyTerm", { term: t("term." + tm.id).toLowerCase() })}</div>
            ) : (
              <div className="goal-list">
                {items.map((g) => {
                  const done = achieved.has(g.id);
                  return (
                    <div className={"card goal-item" + (done ? " done" : "")} key={g.id}>
                      <span className={"goal-check" + (done ? " on" : "")}>
                        {done ? <IconCheck width={14} height={14} /> : null}
                      </span>
                      <div className="goal-body">
                        <div className="goal-text">{g.text}</div>
                        {done && dates[g.id] ? (
                          <div className="goal-when" style={{ textTransform: "capitalize" }}>
                            {t("goals.reachedOn", { date: formatMedium(dates[g.id]) })}
                          </div>
                        ) : null}
                      </div>
                      <button className="goal-rm" onClick={() => remove(g.id)} title={t("common.delete")}>
                        <IconClose width={13} height={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
