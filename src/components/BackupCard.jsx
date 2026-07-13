import { useRef, useState } from "react";
import { storage, isElectron } from "../lib/storage.js";
import { t } from "../lib/i18n.js";
import { IconFolder } from "./Icons.jsx";

// Export the (decrypted) journal to a portable JSON file, and import one back.
export default function BackupCard({ onImported }) {
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);

  function flash(m) {
    setMsg(m);
    setTimeout(() => setMsg(""), 4000);
  }

  async function doExport() {
    const res = await storage.exportJournal();
    if (res?.ok) flash(t("backup.exported"));
    else if (!res?.canceled) flash(t("backup.error"));
  }

  async function doImport() {
    if (isElectron) {
      const res = await storage.importJournal();
      if (res?.ok) {
        flash(t("backup.imported", { n: res.entries }));
        onImported?.();
      } else if (!res?.canceled) {
        flash(t("backup.error"));
      }
    } else {
      fileRef.current?.click();
    }
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const res = await storage.importJournalFile(file);
    if (res?.ok) {
      flash(t("backup.imported", { n: res.entries }));
      onImported?.();
    } else {
      flash(t("backup.error"));
    }
  }

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="set-row">
        <div className="info">
          <div className="t">{t("backup.title")}</div>
          <div className="d">
            {msg ? <span style={{ color: "var(--accent)", fontWeight: 600 }}>{msg}</span> : t("backup.sub")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={doImport}>
            <IconFolder width={16} height={16} /> {t("backup.import")}
          </button>
          <button className="btn primary" onClick={doExport}>
            {t("backup.export")}
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
    </div>
  );
}
