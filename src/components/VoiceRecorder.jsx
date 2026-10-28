import { useRef, useState, useEffect } from "react";
import { storage } from "../lib/storage.js";
import { t } from "../lib/i18n.js";
import { IconMic, IconStop, IconClose } from "./Icons.jsx";

function pickMime() {
  const cands = [
    ["audio/webm;codecs=opus", ".webm"],
    ["audio/webm", ".webm"],
    ["audio/ogg;codecs=opus", ".ogg"],
    ["audio/mp4", ".m4a"],
  ];
  for (const [mime, ext] of cands) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) return { mime, ext };
  }
  return { mime: "", ext: ".webm" };
}

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Record voice notes for an entry. Clips are stored encrypted like photos and
// played back from the local journalimg:// stream.
export default function VoiceRecorder({ audio, onChange }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rec = useRef(null);
  const chunks = useRef([]);
  const startedAt = useRef(0);
  const extRef = useRef(".webm");
  const timer = useRef(null);

  useEffect(() => () => {
    clearInterval(timer.current);
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  }, []);

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { mime, ext } = pickMime();
      extRef.current = ext;
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const duration = Math.round((Date.now() - startedAt.current) / 1000);
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        setBusy(true);
        try {
          const name = await storage.addAudio(blob, extRef.current);
          onChange([...(audio || []), { name, duration }]);
        } catch {
          setError(t("voice.saveError"));
        }
        setBusy(false);
      };
      rec.current = mr;
      startedAt.current = Date.now();
      mr.start();
      setRecording(true);
      setElapsed(0);
      timer.current = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 200);
    } catch {
      setError(t("voice.noMic"));
    }
  }

  function stop() {
    clearInterval(timer.current);
    setRecording(false);
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  }

  function remove(name) {
    onChange((audio || []).filter((a) => a.name !== name));
  }

  return (
    <div className="voice">
      <div className="voice-controls">
        {!recording ? (
          <button type="button" className="btn voice-rec" onClick={start} disabled={busy}>
            <IconMic width={16} height={16} /> {busy ? t("voice.saving") : t("voice.record")}
          </button>
        ) : (
          <button type="button" className="btn voice-stop" onClick={stop}>
            <IconStop width={14} height={14} /> {t("voice.stop")} · {fmt(elapsed)}
          </button>
        )}
        {recording ? <span className="voice-live" aria-hidden="true" /> : null}
      </div>
      {error ? <div className="voice-error" role="alert">{error}</div> : null}
      {(audio || []).length > 0 && (
        <div className="voice-list">
          {audio.map((a) => (
            <div className="voice-clip" key={a.name}>
              <audio controls preload="metadata" src={storage.imageUrl(a.name)} />
              {a.duration ? <span className="voice-dur">{fmt(a.duration)}</span> : null}
              <button type="button" className="voice-rm" onClick={() => remove(a.name)} aria-label={t("common.remove")}>
                <IconClose width={14} height={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
