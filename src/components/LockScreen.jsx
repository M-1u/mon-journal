import { useState } from "react";
import { IconChevronLeft, IconPlus } from "./Icons.jsx";
import { t } from "../lib/i18n.js";
import BrandMark from "./BrandMark.jsx";

// Access gate: create the first journal, or pick one and unlock it with its
// password. A password is mandatory when creating a journal.
export default function LockScreen({ journals, onUnlock, onCreate }) {
  const hasJournals = journals.length > 0;
  const [mode, setMode] = useState(hasJournals ? "select" : "create");
  const [selected, setSelected] = useState(null); // journal being unlocked
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // create form
  const [name, setName] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");

  async function submitUnlock(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await onUnlock(selected.id, password);
    setBusy(false);
    if (!res) {
      setError(t("lock.wrongPassword"));
      setPassword("");
    }
  }

  async function submitCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setError(t("lock.errName"));
    if (pw1.length < 4) return setError(t("lock.errShort"));
    if (pw1 !== pw2) return setError(t("lock.errMatch"));
    setBusy(true);
    setError("");
    await onCreate(name.trim(), pw1);
    setBusy(false);
  }

  return (
    <div className="lock">
      <div className="lock-card">
        <div className="lock-brand">
          <span className="logo"><BrandMark size={24} /></span>
          <span>{t("app.name")}</span>
        </div>

        {mode === "select" && !selected && (
          <>
            <h2 className="lock-title">{t("lock.chooseJournal")}</h2>
            <p className="lock-sub">{t("lock.chooseJournalSub")}</p>
            <div className="journal-list">
              {journals.map((j) => (
                <button
                  key={j.id}
                  className="journal-item"
                  onClick={() => {
                    setSelected(j);
                    setPassword("");
                    setError("");
                  }}
                >
                  <span className="ji-avatar">{j.name.slice(0, 1).toUpperCase()}</span>
                  <span className="ji-name">{j.name}</span>
                  <span className="ji-lock">🔒</span>
                </button>
              ))}
            </div>
            <button className="lock-secondary" onClick={() => { setMode("create"); setError(""); }}>
              <IconPlus width={16} height={16} /> {t("lock.newJournal")}
            </button>
          </>
        )}

        {mode === "select" && selected && (
          <form onSubmit={submitUnlock}>
            <button type="button" className="lock-back" onClick={() => { setSelected(null); setError(""); }}>
              <IconChevronLeft width={16} height={16} /> {t("common.back")}
            </button>
            <h2 className="lock-title">{selected.name}</h2>
            <p className="lock-sub">{t("lock.enterPassword")}</p>
            <input
              autoFocus
              type="password"
              className="lock-input"
              placeholder={t("lock.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="lock-error">{error}</div>}
            <button type="submit" className="btn primary lock-submit" disabled={busy || !password}>
              {t("lock.open")}
            </button>
          </form>
        )}

        {mode === "create" && (
          <form onSubmit={submitCreate}>
            {hasJournals && (
              <button type="button" className="lock-back" onClick={() => { setMode("select"); setError(""); }}>
                <IconChevronLeft width={16} height={16} /> {t("common.back")}
              </button>
            )}
            <h2 className="lock-title">
              {hasJournals ? t("lock.newJournal") : t("lock.createFirst")}
            </h2>
            <p className="lock-sub">{t("lock.createSub")}</p>
            <input
              autoFocus
              type="text"
              className="lock-input"
              placeholder={t("lock.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="password"
              className="lock-input"
              placeholder={t("lock.password")}
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
            />
            <input
              type="password"
              className="lock-input"
              placeholder={t("lock.confirm")}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
            {error && <div className="lock-error">{error}</div>}
            <button type="submit" className="btn primary lock-submit" disabled={busy}>
              {t("lock.create")}
            </button>
            <p className="lock-hint">{t("lock.warn")}</p>
          </form>
        )}
      </div>
    </div>
  );
}
