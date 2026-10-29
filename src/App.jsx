import { useEffect, useMemo, useState, useRef, useCallback, lazy, Suspense } from "react";
import Sidebar from "./components/Sidebar.jsx";
import DayView from "./components/DayView.jsx";
import CalendarView from "./components/CalendarView.jsx";
import TimelineView from "./components/TimelineView.jsx";
import StatsView from "./components/StatsView.jsx";
import GalleryView from "./components/GalleryView.jsx";
import SettingsView from "./components/SettingsView.jsx";
import GoalsView from "./components/GoalsView.jsx";
import InsightsView from "./components/InsightsView.jsx";
import LabelView from "./components/LabelView.jsx";
import SearchView from "./components/SearchView.jsx";
import LockScreen from "./components/LockScreen.jsx";
// Travel view bundles the world map + country data; load it on demand.
const TravelView = lazy(() => import("./components/TravelView.jsx"));
import { storage } from "./lib/storage.js";
import { todayKey, eachDay } from "./lib/date.js";
import { getLang, setLang, t } from "./lib/i18n.js";

const DEFAULT_SETTINGS = {
  theme: "system",
  accent: "#3da35d",
  reminderEnabled: false,
  reminderTime: "20:00",
  autoLockMinutes: 0,
  privacyBlur: false,
  spellcheck: true,
  backupEnabled: false,
  backupFolder: "",
  backupKeep: 7,
  lastBackup: "",
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
  const [travel, setTravel] = useState({ countries: {}, cities: [], trips: [] });
  const travelRef = useRef(travel);
  travelRef.current = travel;
  const [tasks, setTasks] = useState([]);
  const [trackers, setTrackers] = useState({ defs: [], log: {} });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [storageRoot, setStorageRoot] = useState("");
  const [newEntrySignal, setNewEntrySignal] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);

  const enterJournal = useCallback(async (journal) => {
    const [s, list, acts, gls, trv, tsk, trk, root] = await Promise.all([
      storage.getSettings(),
      storage.listEntries(),
      storage.getActivities(),
      storage.getGoals(),
      storage.getTravel(),
      storage.getTasks(),
      storage.getTrackers(),
      storage.getStorageRoot(),
    ]);
    setSettings({ ...DEFAULT_SETTINGS, ...s });
    setEntries(list);
    setActivities(acts);
    setGoals(gls);
    setTravel(trv || { countries: {}, cities: [], trips: [] });
    setTasks(tsk || []);
    setTrackers(trk || { defs: [], log: {} });
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

  // Group entries by date for the calendar / day view. A multi-day entry
  // (with endDate) is listed on every day it spans.
  const entriesByDate = useMemo(() => {
    const map = {};
    for (const e of entries) {
      for (const d of e.endDate ? eachDay(e.date, e.endDate) : [e.date]) (map[d] ||= []).push(e);
    }
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

  // Tags / people already used, ordered by frequency, for autocomplete.
  const freqList = (pick) => {
    const count = {};
    for (const e of entries) for (const v of pick(e) || []) count[v] = (count[v] || 0) + 1;
    return Object.entries(count).sort((a, b) => b[1] - a[1]).map(([v]) => v);
  };
  const tagSuggestions = useMemo(() => freqList((e) => e.tags), [entries]);
  const peopleSuggestions = useMemo(() => freqList((e) => e.people), [entries]);

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
    setTravel({ countries: {}, cities: [], trips: [] });
    setTasks([]);
    setTrackers({ defs: [], log: {} });
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

  const [label, setLabel] = useState(null); // { type: "tag"|"person", value }
  const openLabel = useCallback((type, value) => {
    setLabel({ type, value });
    setView("label");
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

  // All travel mutations compute from travelRef.current (always the latest),
  // so rapid map clicks never lose updates. We update state optimistically and
  // persist in the background.
  const applyTravel = useCallback(async (next) => {
    travelRef.current = next;
    setTravel(next);
    await storage.setTravel(next);
  }, []);
  const handleCycleCountry = useCallback((alpha2) => {
    if (!alpha2) return;
    const cs = travelRef.current.countries || {};
    const cur = cs[alpha2];
    const nextStatus = cur === "visited" ? "wishlist" : cur === "wishlist" ? undefined : "visited";
    const nc = { ...cs };
    if (nextStatus) nc[alpha2] = nextStatus;
    else delete nc[alpha2];
    applyTravel({ ...travelRef.current, countries: nc });
  }, [applyTravel]);
  const handleRemoveCountry = useCallback((alpha2) => {
    const nc = { ...travelRef.current.countries };
    delete nc[alpha2];
    applyTravel({ ...travelRef.current, countries: nc });
  }, [applyTravel]);
  const handleAddCity = useCallback((city) => {
    applyTravel({ ...travelRef.current, cities: [...(travelRef.current.cities || []), city] });
  }, [applyTravel]);
  const handleRemoveCity = useCallback((id) => {
    applyTravel({ ...travelRef.current, cities: (travelRef.current.cities || []).filter((c) => c.id !== id) });
  }, [applyTravel]);
  const handleSaveTrip = useCallback((trip) => {
    const trips = [...(travelRef.current.trips || [])];
    const i = trips.findIndex((t) => t.id === trip.id);
    if (i >= 0) trips[i] = trip;
    else trips.push(trip);
    applyTravel({ ...travelRef.current, trips });
  }, [applyTravel]);
  const handleDeleteTrip = useCallback((id) => {
    applyTravel({ ...travelRef.current, trips: (travelRef.current.trips || []).filter((t) => t.id !== id) });
  }, [applyTravel]);

  const handleTasksChange = useCallback(async (list) => {
    setTasks(list);
    const saved = await storage.setTasks(list);
    setTasks(saved);
  }, []);
  const handleTrackersChange = useCallback(async (obj) => {
    setTrackers(obj);
    const saved = await storage.setTrackers(obj);
    setTrackers(saved);
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
    const [list, acts, gls, trv, tsk, trk] = await Promise.all([
      storage.listEntries(),
      storage.getActivities(),
      storage.getGoals(),
      storage.getTravel(),
      storage.getTasks(),
      storage.getTrackers(),
    ]);
    setEntries(list);
    setActivities(acts);
    setGoals(gls);
    setTravel(trv || { countries: {}, cities: [], trips: [] });
    setTasks(tsk || []);
    setTrackers(trk || { defs: [], log: {} });
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
      <Sidebar
        view={view}
        onNavigate={(v) => { if (v === "today") setDate(todayKey()); setView(v); }}
        journalName={journalName}
      />
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
            tagSuggestions={tagSuggestions}
            peopleSuggestions={peopleSuggestions}
            trips={travel.trips || []}
            tasks={tasks}
            trackers={trackers}
            onDateChange={setDate}
            onSaveEntry={handleSaveEntry}
            onDeleteEntry={handleDeleteEntry}
            onToggleFavorite={handleToggleFavorite}
            onTasksChange={handleTasksChange}
            onTrackersChange={handleTrackersChange}
            onOpenLabel={openLabel}
          />
        )}
        {view === "calendar" && (
          <CalendarView entriesByDate={entriesByDate} onOpenDay={openDay} />
        )}
        {view === "timeline" && (
          <TimelineView entries={entries} activities={activities} onOpenDay={openDay} />
        )}
        {view === "travel" && (
          <Suspense fallback={<div className="view"><div className="empty">{t("common.loading")}</div></div>}>
            <TravelView
              travel={travel}
              lang={lang}
              entries={entries}
              onCycleCountry={handleCycleCountry}
              onRemoveCountry={handleRemoveCountry}
              onSaveTrip={handleSaveTrip}
              onDeleteTrip={handleDeleteTrip}
              onOpenDay={openDay}
            />
          </Suspense>
        )}
        {view === "goals" && (
          <GoalsView goals={goals} entries={entries} onChange={handleGoalsChange} />
        )}
        {view === "search" && (
          <SearchView entries={entries} activities={activities} onOpenDay={openDay} onOpenLabel={openLabel} />
        )}
        {view === "stats" && (
          <StatsView entries={entries} entriesByDate={entriesByDate} activities={activities} trackers={trackers} />
        )}
        {view === "insights" && (
          <InsightsView entries={entries} entriesByDate={entriesByDate} activities={activities} />
        )}
        {view === "label" && label && (
          <LabelView
            label={label}
            entries={entries}
            activities={activities}
            onOpenDay={openDay}
            onOpenLabel={openLabel}
            onBack={() => setView("search")}
          />
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
            trackers={trackers}
            onTrackersChange={handleTrackersChange}
          />
        )}
      </main>
    </div>
  );
}
