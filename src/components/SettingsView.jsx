import { useState } from "react";
import { storage, isElectron } from "../lib/storage.js";
import { IconFolder } from "./Icons.jsx";
import ChangePasswordCard from "./ChangePasswordCard.jsx";
import ActivitiesManager from "./ActivitiesManager.jsx";
import BackupCard from "./BackupCard.jsx";
import { t, LANGS } from "../lib/i18n.js";

const ACCENTS = ["#3da35d", "#4c8bf5", "#8b5cf6", "#e5544b", "#ef8b3b", "#e84393", "#0ea5a5"];

export default function SettingsView({
  settings,
  onChange,
  storageRoot,
  journalName,
  onLock,
  activities,
  onActivitiesChange,
  lang,
  onLangChange,
  onImported,
  onMoveJournal,
}) {
  const [moveMsg, setMoveMsg] = useState("");
  const [pdfMsg, setPdfMsg] = useState("");
  const [updMsg, setUpdMsg] = useState("");

  async function exportPdf() {
    setPdfMsg(t("set.pdfWorking"));
    const res = await window.journalAPI?.exportPdf();
    if (res?.ok) setPdfMsg(t("set.pdfDone"));
    else if (res?.canceled) setPdfMsg("");
    else setPdfMsg(t("set.pdfError"));
    setTimeout(() => setPdfMsg(""), 5000);
  }

  async function checkUpdates() {
    setUpdMsg(t("set.updChecking"));
    const res = await window.journalAPI?.checkUpdates();
    if (res?.dev) setUpdMsg(t("set.updDev"));
    else if (res?.ok) setUpdMsg(res.version ? t("set.updFound", { v: res.version }) : t("set.updNone"));
    else setUpdMsg(t("set.updError"));
    setTimeout(() => setUpdMsg(""), 6000);
  }

  const LOCK_OPTS = [0, 1, 5, 15, 30];

  async function move() {
    const res = await onMoveJournal();
    if (res?.ok) {
      setMoveMsg(t("set.moved", { path: res.path }));
      setTimeout(() => setMoveMsg(""), 5000);
    } else if (!res?.canceled) {
      setMoveMsg(t("set.moveError"));
      setTimeout(() => setMoveMsg(""), 5000);
    }
  }

  return (
    <div className="view">
      <h1 className="page-title">{t("set.title")}</h1>
      <p className="page-sub">{t("set.sub")}</p>

      <div className="card">
        <div className="set-row">
          <div className="info">
            <div className="t">{t("set.language")}</div>
            <div className="d">{t("set.languageSub")}</div>
          </div>
          <div className="seg">
            {LANGS.map((l) => (
              <button
                key={l.id}
                className={lang === l.id ? "on" : ""}
                onClick={() => onLangChange(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="set-row">
          <div className="info">
            <div className="t">{t("set.theme")}</div>
            <div className="d">{t("set.themeSub")}</div>
          </div>
          <div className="seg">
            {[
              ["light", t("set.light")],
              ["dark", t("set.dark")],
              ["system", t("set.system")],
            ].map(([val, lbl]) => (
              <button
                key={val}
                className={settings.theme === val ? "on" : ""}
                onClick={() => onChange({ theme: val })}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="set-row">
          <div className="info">
            <div className="t">{t("set.accent")}</div>
            <div className="d">{t("set.accentSub")}</div>
          </div>
          <div className="swatches">
            {ACCENTS.map((c) => (
              <button
                key={c}
                className={"swatch" + (settings.accent === c ? " on" : "")}
                style={{ background: c }}
                onClick={() => onChange({ accent: c })}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="set-row">
          <div className="info">
            <div className="t">{t("set.reminder")}</div>
            <div className="d">{t("set.reminderSub")}</div>
          </div>
          <button
            className={"switch" + (settings.reminderEnabled ? " on" : "")}
            onClick={() => onChange({ reminderEnabled: !settings.reminderEnabled })}
          />
        </div>
        {settings.reminderEnabled ? (
          <div className="set-row">
            <div className="info">
              <div className="t">{t("set.reminderTime")}</div>
              <div className="d">{t("set.reminderTimeSub")}</div>
            </div>
            <input
              type="time"
              value={settings.reminderTime || "20:00"}
              onChange={(e) => onChange({ reminderTime: e.target.value })}
            />
          </div>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="set-row">
          <div className="info">
            <div className="t">{t("set.autoLock")}</div>
            <div className="d">{t("set.autoLockSub")}</div>
          </div>
          <select
            value={settings.autoLockMinutes ?? 0}
            onChange={(e) => onChange({ autoLockMinutes: Number(e.target.value) })}
          >
            {LOCK_OPTS.map((m) => (
              <option key={m} value={m}>
                {m === 0 ? t("set.autoLockOff") : t("set.minutes", { n: m })}
              </option>
            ))}
          </select>
        </div>

        {isElectron && (
          <div className="set-row">
            <div className="info">
              <div className="t">{t("set.privacyBlur")}</div>
              <div className="d">{t("set.privacyBlurSub")}</div>
            </div>
            <button
              className={"switch" + (settings.privacyBlur ? " on" : "")}
              onClick={() => onChange({ privacyBlur: !settings.privacyBlur })}
            />
          </div>
        )}

        {isElectron && (
          <div className="set-row">
            <div className="info">
              <div className="t">{t("set.spellcheck")}</div>
              <div className="d">{t("set.spellcheckSub")}</div>
            </div>
            <button
              className={"switch" + (settings.spellcheck ? " on" : "")}
              onClick={() => onChange({ spellcheck: !settings.spellcheck })}
            />
          </div>
        )}
      </div>

      {isElectron && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="set-row">
            <div className="info">
              <div className="t">{t("set.pdf")}</div>
              <div className="d">
                {pdfMsg ? <span style={{ color: "var(--accent)", fontWeight: 600 }}>{pdfMsg}</span> : t("set.pdfSub")}
              </div>
            </div>
            <button className="btn" onClick={exportPdf}>{t("set.pdfBtn")}</button>
          </div>
          <div className="set-row">
            <div className="info">
              <div className="t">{t("set.updates")}</div>
              <div className="d">
                {updMsg ? <span style={{ color: "var(--accent)", fontWeight: 600 }}>{updMsg}</span> : t("set.updatesSub")}
              </div>
            </div>
            <button className="btn" onClick={checkUpdates}>{t("set.updBtn")}</button>
          </div>
        </div>
      )}

      <ActivitiesManager activities={activities} onChange={onActivitiesChange} />

      <BackupCard onImported={onImported} />

      <ChangePasswordCard />

      <div className="card" style={{ marginTop: 18 }}>
        <div className="set-row">
          <div className="info">
            <div className="t">{t("set.currentJournal", { name: journalName })}</div>
            <div className="d" style={{ wordBreak: "break-all" }}>
              {moveMsg ? (
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>{moveMsg}</span>
              ) : isElectron ? (
                storageRoot
              ) : (
                t("set.previewStore")
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {isElectron && (
              <>
                <button className="btn" onClick={() => storage.openStorageRoot()}>
                  <IconFolder width={16} height={16} /> {t("common.open")}
                </button>
                <button className="btn" onClick={move}>
                  {t("set.move")}
                </button>
              </>
            )}
            <button className="btn" onClick={onLock}>
              {t("set.lockSwitch")}
            </button>
          </div>
        </div>
      </div>

      <p style={{ color: "var(--ink-faint)", fontSize: 12.5, marginTop: 22, textAlign: "center" }}>
        {t("set.footer")}
      </p>
    </div>
  );
}
