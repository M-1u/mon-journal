import { useState } from "react";
import { todayKey } from "../lib/date.js";
import { t } from "../lib/i18n.js";
import { IconPlus, IconCheck, IconClose } from "./Icons.jsx";

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

// Simple to-do list. Open tasks carry over day to day until checked off;
// tasks completed today stay visible (struck through) so the day feels done.
export default function TasksPanel({ tasks, onChange }) {
  const [draft, setDraft] = useState("");
  const today = todayKey();

  const open = tasks.filter((x) => !x.done);
  const doneToday = tasks.filter((x) => x.done && (x.doneAt || "").slice(0, 10) === today);

  function add(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onChange([...tasks, { id: uid(), text, done: false, createdAt: new Date().toISOString(), doneAt: null }]);
    setDraft("");
  }
  function toggle(id) {
    onChange(tasks.map((x) => (x.id === id ? { ...x, done: !x.done, doneAt: !x.done ? new Date().toISOString() : null } : x)));
  }
  function remove(id) {
    onChange(tasks.filter((x) => x.id !== id));
  }

  return (
    <div className="card panel tasks-panel">
      <div className="panel-head">
        <h3>{t("tasks.title")}</h3>
        {open.length ? <span className="panel-count">{t("tasks.remaining", { n: open.length })}</span> : null}
      </div>

      <form className="task-add" onSubmit={add}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("tasks.placeholder")} aria-label={t("tasks.add")} />
        <button type="submit" className="btn primary" disabled={!draft.trim()}><IconPlus width={15} height={15} /></button>
      </form>

      {open.length === 0 && doneToday.length === 0 ? (
        <p className="task-empty">{t("tasks.empty")}</p>
      ) : (
        <ul className="task-list">
          {open.map((x) => (
            <li className="task" key={x.id}>
              <button className="task-check" onClick={() => toggle(x.id)} aria-label={t("tasks.done")} />
              <span className="task-text">{x.text}</span>
              <button className="task-rm" onClick={() => remove(x.id)} aria-label={t("common.remove")}><IconClose width={12} height={12} /></button>
            </li>
          ))}
          {doneToday.map((x) => (
            <li className="task done" key={x.id}>
              <button className="task-check on" onClick={() => toggle(x.id)} aria-label={t("tasks.undo")}><IconCheck width={12} height={12} /></button>
              <span className="task-text">{x.text}</span>
              <button className="task-rm" onClick={() => remove(x.id)} aria-label={t("common.remove")}><IconClose width={12} height={12} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
