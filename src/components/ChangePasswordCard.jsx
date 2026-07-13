import { useState } from "react";
import { storage } from "../lib/storage.js";
import { t } from "../lib/i18n.js";

export default function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  function reset() {
    setOldPw("");
    setPw1("");
    setPw2("");
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setDone(false);
    if (pw1.length < 4) return setError(t("pw.errShort"));
    if (pw1 !== pw2) return setError(t("pw.errMatch"));
    setBusy(true);
    setError("");
    const res = await storage.changePassword(oldPw, pw1);
    setBusy(false);
    if (res?.ok) {
      reset();
      setOpen(false);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } else if (res?.error === "bad") {
      setError(t("pw.errBad"));
    } else {
      setError(t("pw.errGeneric"));
    }
  }

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="set-row">
        <div className="info">
          <div className="t">{t("pw.title")}</div>
          <div className="d">
            {done ? (
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>{t("pw.updated")}</span>
            ) : (
              t("pw.sub")
            )}
          </div>
        </div>
        {!open && (
          <button className="btn" onClick={() => { setOpen(true); reset(); }}>
            {t("common.change")}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} style={{ padding: "0 18px 18px" }}>
          <input
            autoFocus
            type="password"
            className="lock-input"
            placeholder={t("pw.current")}
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
          />
          <input
            type="password"
            className="lock-input"
            placeholder={t("pw.new")}
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
          />
          <input
            type="password"
            className="lock-input"
            placeholder={t("pw.confirm")}
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />
          {error && <div className="lock-error">{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn primary" disabled={busy || !oldPw}>
              {t("common.save")}
            </button>
            <button type="button" className="btn ghost" onClick={() => { setOpen(false); reset(); }}>
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
