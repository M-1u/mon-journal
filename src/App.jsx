import { useEffect, useMemo, useState, useCallback } from "react";
import Sidebar from "./components/Sidebar.jsx";
import DayView from "./components/DayView.jsx";
import CalendarView from "./components/CalendarView.jsx";
import TimelineView from "./components/TimelineView.jsx";
import StatsView from "./components/StatsView.jsx";
import GalleryView from "./components/GalleryView.jsx";
import SettingsView from "./components/SettingsView.jsx";
import GoalsView from "./components/GoalsView.jsx";
import SearchView from "./components/SearchView.jsx";
import LockScreen from "./components/LockScreen.jsx";
import { storage } from "./lib/storage.js";
import { todayKey } from "./lib/date.js";
import { getLang, setLang, t } from "./lib/i18n.js";

const DEFAULT_SETTINGS = {
  theme: "system",
  accent: "#3da35d",
  reminderEnabled: false,
  reminderTime: "20:00",
  autoLockMinutes: 0,
  privacyBlur: false,
  spellcheck: true,
};

function inkFor(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? "#1a2230" : "#ffffff";
}

export default function App() {
  const [phase, setPhase] = useState("loading"); // loading | locked | unlocked
  const [journals, setJournals] = useState([]);
  const [journalName, setJournalName] = useState("");
  const [lang, setLangState] = useState(getLang());

  const [view, setView] = useState("today");
  const [date, setDate] = useState(todayKey());
  const [entries, setEntries] = useState([]); // flat list of entries
  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [storageRoot, setStorageRoot] = useState("");
  const [newEntrySignal, setNewEntrySignal] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);

  const enterJournal = useCallback(async (journal) => {
    const [s, list, acts, gls, root] = await Promise.all([
      storage.getSettings(),
      storage.listEntries(),
      storage.getActivities(),
      storage.getGoals(),
      storage.getStorageRoot(),
    ]);
    setSettings({ ...DEFAULT_SETTINGS, ...s });
    setEntries(list);
    setActivities(acts);
    setGoals(gls);
    setStorageRoot(root);
    setJournalName(journal.name);
    setView("today");
    setDate(todayKey());
    setPhase("unlocked");
  }, []);

  useEffect(() => {
    (async () => {
      const current = await storage.currentJournal();
      if (current) {
        await enterJournal(current);
      } else {
        setJournals(await storage.listJournals());
        setPhase("locked");
      }
    })();
  }, [enterJournal]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      let theme = settings.theme;
      if (theme === "system") {
        theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      root.setAttribute("data-theme", theme);
    };
    apply();
    if (settings.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", settings.accent);
    document.documentElement.style.setProperty("--accent-ink", inkFor(settings.accent));
  }, [settings.accent]);

  // Group entries by date for the calendar / day view.
  const entriesByDate = useMemo(() => {
    const map = {};
    for (const e of entries) (map[e.date] ||= []).push(e);
    return map;
  }, [entries]);

  const dayEntries = entriesByDate[date] || [];

  // Distinct places already used, most recent first, for autocomplete.
  const placeSuggestions = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const e of entries) {
      const p = (e.place || "").trim();
      if (p && !seen.has(p.toLowerCase())) {
        seen.add(p.toLowerCase());
        out.push(p);
      }
    }
    return out.slice(0, 50);
  }, [entries]);

  // --- Auth handlers ---
  const handleUnlock = useCallback(
    async (id, password) => {
      const res = await storage.unlockJournal(id, password);
      if (res) await enterJournal(res);
      return res;
    },
    [enterJournal]
  );
  const handleCreate = useCallback(
    async (name, password) => {
      const res = await storage.createJournal(name, password);
      if (res) await enterJournal(res);
      return res;
    },
    [enterJournal]
  );
  const handleLock = useCallback(async () => {
    await storage.lockJournal();
    setEntries([]);
    setActivities([]);
    setGoals([]);
    setSettings(DEFAULT_SETTINGS);
    setJournalName("");
    setJournals(await storage.listJournals());
    setPhase("locked");
  }, []);

  // --- Entry handlers ---
  const handleSaveEntry = useCallback(async (entry) => {
    const saved = await storage.upsertEntry(entry);
    setEntries((prev) => {
      const rest = prev.filter((e) => e.id !== saved.id);
      return [{ ...saved }, ...rest];
    });
    return saved;
  }, []);

  const handleDeleteEntry = useCallback(async (d, id) => {
    await storage.deleteEntry(d, id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleToggleFavorite = useCallback(async (entry) => {
    const updated = { ...entry, favorite: !entry.favorite };
    const saved = await storage.upsertEntry(updated);
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...saved } : e)));
    return saved;
  }, []);

  const openDay = useCallback((d) => {
    setDate(d);
    setView("today");
  }, []);

  const handleSettingChange = useCallback(async (patch) => {
    const merged = await storage.setSettings(patch);
    setSettings((s) => ({ ...s, ...merged }));
  }, []);

  const handleActivitiesChange = useCallback(async (list) => {
    const saved = await storage.setActivities(list);
    setActivities(saved);
  }, []);

  const handleGoalsChange = useCallback(async (list) => {
    const saved = await storage.setGoals(list);
    setGoals(saved);
  }, []);

  const changeLang = useCallback((l) => {
    setLang(l);
    document.documentElement.lang = l;
    setLangState(l); // re-render the whole tree so every t() updates
  }, []);

  const handleMoveJournal = useCallback(async () => {
    const res = await storage.moveJournal();
    if (res?.ok) setStorageRoot(res.path);
    return res;
  }, []);

  const handleImported = useCallback(async () => {
    const [list, acts, gls] = await Promise.all([
      storage.listEntries(),
      storage.getActivities(),
      storage.getGoals(),
    ]);
    setEntries(list);
    setActivities(acts);
    setGoals(gls);
  }, []);

  // Auto-lock after a period of inactivity (per-journal setting, minutes).
  useEffect(() => {
    const mins = Number(settings.autoLockMinutes) || 0;
    if (phase !== "unlocked" || mins <= 0) return;
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => handleLock(), mins * 60 * 1000);
    };
    const evts = ["mousemove", "mousedown", "keydown", "wheel", "touchstart"];
    evts.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      evts.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [phase, settings.autoLockMinutes, handleLock]);

  // Privacy: blur the whole app when the window loses focus.
  useEffect(() => {
    const api = window.journalAPI;
    if (!api?.onWindowBlur) return;
    const onBlur = () => {
      if (settings.privacyBlur && phase === "unlocked") {
        document.body.classList.add("privacy-blur");
      }
    };
    const onFocus = () => document.body.classList.remove("privacy-blur");
    const off1 = api.onWindowBlur(onBlur);
    const off2 = api.onWindowFocus(onFocus);
    return () => {
      off1?.();
      off2?.();
      document.body.classList.remove("privacy-blur");
    };
  }, [settings.privacyBlur, phase]);

  // Lock when the OS suspends / locks the screen.
  useEffect(() => {
    const api = window.journalAPI;
    if (!api?.onLock) return;
    return api.onLock(() => {
      if (phase === "unlocked") handleLock();
    });
  }, [phase, handleLock]);

  // "New entry" from the tray / quick add.
  useEffect(() => {
    const api = window.journalAPI;
    if (!api?.onNewEntry) return;
    return api.onNewEntry(() => {
      if (phase !== "unlocked") return;
      setDate(todayKey());
      setView("today");
      setNewEntrySignal((n) => n + 1);
    });
  }, [phase]);

  // Update downloaded → offer a restart.
  useEffect(() => {
    const api = window.journalAPI;
    if (!api?.onUpdateReady) return;
    return api.onUpdateReady(() => setUpdateReady(true));
  }, []);

  if (phase === "loading") return null;

  if (phase === "locked") {
    return <LockScreen journals={journals} onUnlock={handleUnlock} onCreate={handleCreate} />;
  }

  return (
    <div className="app">
      {updateReady && (
        <div className="update-banner">
          {t("update.ready")}
          <button className="btn primary" onClick={() => window.journalAPI?.installUpdate()}>
            {t("update.restart")}
          </button>
          <button className="update-close" onClick={() => setUpdateReady(false)} title={t("common.cancel")}>×</button>
        </div>
      )}
      <Sidebar view={view} onNavigate={setView} journalName={journalName} />
      <main className="main">
        {view === "today" && (
          <DayView
            date={date}
            dayEntries={dayEntries}
            allEntries={entries}
            activities={activities}
            goals={goals}
            newEntrySignal={newEntrySignal}
            placeSuggestions={placeSuggestions}
            onDateChange={setDate}
            onSaveEntry={handleSaveEntry}
            onDeleteEntry={handleDeleteEntry}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
        {view === "calendar" && (
          <CalendarView entriesByDate={entriesByDate} onOpenDay={openDay} />
        )}
        {view === "timeline" && (
          <TimelineView entries={entries} activities={activities} onOpenDay={openDay} />
        )}
        {view === "goals" && (
          <GoalsView goals={goals} entries={entries} onChange={handleGoalsChange} />
        )}
        {view === "search" && (
          <SearchView entries={entries} activities={activities} onOpenDay={openDay} />
        )}
        {view === "stats" && (
          <StatsView entries={entries} entriesByDate={entriesByDate} activities={activities} />
        )}
        {view === "gallery" && <GalleryView entries={entries} onOpenDay={openDay} />}
        {view === "settings" && (
          <SettingsView
            settings={settings}
            onChange={handleSettingChange}
            storageRoot={storageRoot}
            journalName={journalName}
            onLock={handleLock}
            activities={activities}
            onActivitiesChange={handleActivitiesChange}
            lang={lang}
            onLangChange={changeLang}
            onImported={handleImported}
            onMoveJournal={handleMoveJournal}
          />
        )}
      </main>
    </div>
  );
}
