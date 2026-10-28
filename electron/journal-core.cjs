// Pure journal logic: registry, password-gated envelope encryption, entries
// (Daylio-style: several timestamped entries per day, each with a mood,
// activity tags, a note and photos), activities, settings, images.
// No Electron dependency, so it can be unit-tested with Node.

const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");

let DEFAULTS = { defaultConfigDir: null, defaultJournalsBase: null };
let activeJournal = null; // { id, name, path, dek|null }

function init({ defaultConfigDir, defaultJournalsBase }) {
  DEFAULTS = { defaultConfigDir, defaultJournalsBase };
}

function configDir() {
  return process.env.MONJOURNAL_CONFIG_DIR || DEFAULTS.defaultConfigDir;
}
function journalsBaseDir() {
  return process.env.MONJOURNAL_CONFIG_DIR
    ? path.join(process.env.MONJOURNAL_CONFIG_DIR, "journals")
    : DEFAULTS.defaultJournalsBase;
}
function registryPath() {
  return path.join(configDir(), "journals.json");
}

function loadRegistry() {
  try {
    const reg = JSON.parse(fs.readFileSync(registryPath(), "utf8"));
    if (Array.isArray(reg.journals)) return reg;
  } catch {
    /* first run */
  }
  return { version: 1, journals: [] };
}
function saveRegistry(reg) {
  fs.mkdirSync(configDir(), { recursive: true });
  fs.writeFileSync(registryPath(), JSON.stringify(reg, null, 2));
}

function slugify(name) {
  return (
    (name || "journal")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "journal"
  );
}

// --- Crypto primitives ---
function deriveKek(password, saltHex) {
  return crypto.scryptSync(String(password), Buffer.from(saltHex, "hex"), 32);
}
function aesEncrypt(key, plaintextBuf) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintextBuf), cipher.final()]);
  return { iv, tag: cipher.getAuthTag(), ct };
}
function aesDecrypt(key, iv, tag, ct) {
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]);
}
function wrapDek(dek, kek) {
  const { iv, tag, ct } = aesEncrypt(kek, dek);
  return { iv: iv.toString("hex"), tag: tag.toString("hex"), ct: ct.toString("hex") };
}
function unwrapDek(wrapped, kek) {
  try {
    return aesDecrypt(
      kek,
      Buffer.from(wrapped.iv, "hex"),
      Buffer.from(wrapped.tag, "hex"),
      Buffer.from(wrapped.ct, "hex")
    );
  } catch {
    return null;
  }
}
function encJson(obj, dek) {
  const { iv, tag, ct } = aesEncrypt(dek, Buffer.from(JSON.stringify(obj), "utf8"));
  return {
    enc: 1,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ct: ct.toString("base64"),
  };
}
function decJson(env, dek) {
  const pt = aesDecrypt(
    dek,
    Buffer.from(env.iv, "base64"),
    Buffer.from(env.tag, "base64"),
    Buffer.from(env.ct, "base64")
  );
  return JSON.parse(pt.toString("utf8"));
}
function encryptBinary(buf, dek) {
  const { iv, tag, ct } = aesEncrypt(dek, buf);
  return Buffer.concat([iv, tag, ct]);
}
function decryptBinary(buf, dek) {
  return aesDecrypt(dek, buf.subarray(0, 12), buf.subarray(12, 28), buf.subarray(28));
}

// Legacy verifier (unencrypted journals) — kept for compatibility.
function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString("hex");
}
function verifyLegacyPassword(password, j) {
  if (!j || !j.salt || !j.hash) return false;
  const h = Buffer.from(hashPassword(password, j.salt), "hex");
  const stored = Buffer.from(j.hash, "hex");
  return h.length === stored.length && crypto.timingSafeEqual(h, stored);
}

// --- Registry / auth ---
function listJournals() {
  return loadRegistry().journals.map((j) => ({ id: j.id, name: j.name }));
}
function createJournal(name, password) {
  const reg = loadRegistry();
  const id = crypto.randomUUID();
  const base = journalsBaseDir();
  let dir = path.join(base, slugify(name));
  if (fs.existsSync(dir)) dir = path.join(base, slugify(name) + "-" + id.slice(0, 8));
  fs.mkdirSync(path.join(dir, "entries"), { recursive: true });
  fs.mkdirSync(path.join(dir, "images"), { recursive: true });

  const salt = crypto.randomBytes(16).toString("hex");
  const dek = crypto.randomBytes(32);
  const wrappedDek = wrapDek(dek, deriveKek(password, salt));
  const j = { id, name: String(name).trim(), path: dir, salt, wrappedDek, enc: 1 };
  reg.journals.push(j);
  saveRegistry(reg);
  activeJournal = { id: j.id, name: j.name, path: j.path, dek };
  return { id: j.id, name: j.name };
}
function unlockJournal(id, password) {
  const j = loadRegistry().journals.find((x) => x.id === id);
  if (!j) return null;
  if (j.wrappedDek) {
    const dek = unwrapDek(j.wrappedDek, deriveKek(password, j.salt));
    if (!dek) return null;
    activeJournal = { id: j.id, name: j.name, path: j.path, dek };
  } else {
    if (!verifyLegacyPassword(password, j)) return null;
    activeJournal = { id: j.id, name: j.name, path: j.path, dek: null };
  }
  return { id: j.id, name: j.name };
}
function lockJournal() {
  activeJournal = null;
  return true;
}
function currentJournal() {
  return activeJournal ? { id: activeJournal.id, name: activeJournal.name } : null;
}
function activeJournalPath() {
  return activeJournal ? activeJournal.path : "";
}
function changePassword(oldPassword, newPassword) {
  if (!activeJournal) return { ok: false, error: "locked" };
  const reg = loadRegistry();
  const j = reg.journals.find((x) => x.id === activeJournal.id);
  if (!j) return { ok: false, error: "missing" };
  if (j.wrappedDek) {
    const dek = unwrapDek(j.wrappedDek, deriveKek(oldPassword, j.salt));
    if (!dek) return { ok: false, error: "bad" };
    const newSalt = crypto.randomBytes(16).toString("hex");
    j.salt = newSalt;
    j.wrappedDek = wrapDek(dek, deriveKek(newPassword, newSalt));
    saveRegistry(reg);
    activeJournal.dek = dek;
    return { ok: true };
  }
  if (!verifyLegacyPassword(oldPassword, j)) return { ok: false, error: "bad" };
  const salt = crypto.randomBytes(16).toString("hex");
  j.salt = salt;
  j.hash = hashPassword(newPassword, salt);
  saveRegistry(reg);
  return { ok: true };
}

// Move a directory, with a cross-filesystem fallback (rename fails as EXDEV).
function moveDir(src, dest) {
  try {
    fs.renameSync(src, dest);
    return;
  } catch (e) {
    if (e.code !== "EXDEV") throw e;
  }
  fs.cpSync(src, dest, { recursive: true });
  fs.rmSync(src, { recursive: true, force: true });
}

// Move the active journal's data folder into `destParentDir`, keeping its name.
// Updates the registry and the in-memory active journal (no re-unlock needed).
function moveJournal(destParentDir) {
  if (!activeJournal) return { ok: false, error: "locked" };
  const reg = loadRegistry();
  const j = reg.journals.find((x) => x.id === activeJournal.id);
  if (!j) return { ok: false, error: "missing" };

  const base = path.basename(j.path);
  let dest = path.join(destParentDir, base);
  if (path.resolve(dest) === path.resolve(j.path)) {
    return { ok: true, path: j.path }; // already there
  }
  if (fs.existsSync(dest)) dest = path.join(destParentDir, base + "-" + j.id.slice(0, 8));

  try {
    fs.mkdirSync(destParentDir, { recursive: true });
    moveDir(j.path, dest);
  } catch {
    return { ok: false, error: "move" };
  }
  j.path = dest;
  saveRegistry(reg);
  activeJournal.path = dest;
  return { ok: true, path: dest };
}

// --- Per-journal paths ---
const entriesDir = () => path.join(activeJournal.path, "entries");
const imagesDir = () => path.join(activeJournal.path, "images");
const settingsPath = () => path.join(activeJournal.path, "settings.json");
const activitiesFile = () => path.join(activeJournal.path, "activities.json");
const goalsFile = () => path.join(activeJournal.path, "goals.json");
const tasksFile = () => path.join(activeJournal.path, "tasks.json");
const trackersFile = () => path.join(activeJournal.path, "trackers.json");
function ensureDirs() {
  fs.mkdirSync(entriesDir(), { recursive: true });
  fs.mkdirSync(imagesDir(), { recursive: true });
}

// Read/write an encrypted (or plain) JSON blob at an absolute path.
function readBlob(file) {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return raw && raw.enc ? (activeJournal.dek ? decJson(raw, activeJournal.dek) : null) : raw;
}
function writeBlob(file, obj) {
  const payload = activeJournal.dek ? encJson(obj, activeJournal.dek) : obj;
  fs.writeFileSync(file, JSON.stringify(payload, null, activeJournal.dek ? 0 : 2));
}

// --- Entries: one file per day holding a list of entries ---
// Entry: { id, date, time "HH:MM", mood, activities:[id], text, images:[{name,caption}], createdAt, updatedAt }
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function dayPath(date) {
  if (!DATE_RE.test(date)) throw new Error("Invalid date: " + date);
  return path.join(entriesDir(), `${date}.json`);
}

function migrateLegacy(obj, date) {
  // Older format: a single entry object per day. Wrap it into the new shape.
  return {
    id: crypto.randomUUID(),
    date,
    time: "12:00",
    mood: obj.mood ?? null,
    activities: [],
    text: obj.text ?? "",
    images: Array.isArray(obj.images) ? obj.images : [],
    createdAt: obj.createdAt || new Date().toISOString(),
    updatedAt: obj.updatedAt || new Date().toISOString(),
  };
}

function readDay(date) {
  if (!activeJournal) return { date, entries: [] };
  try {
    const obj = readBlob(dayPath(date));
    if (!obj) return { date, entries: [] };
    if (Array.isArray(obj.entries)) return { date, entries: obj.entries };
    return { date, entries: [migrateLegacy(obj, date)] }; // legacy single entry
  } catch {
    return { date, entries: [] };
  }
}

function writeDay(date, entries) {
  ensureDirs();
  const sorted = [...entries].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  if (!sorted.length) {
    try {
      fs.unlinkSync(dayPath(date));
    } catch {
      /* gone */
    }
    return;
  }
  writeBlob(dayPath(date), { date, entries: sorted });
}

function getDay(date) {
  return readDay(date).entries;
}

function listEntries() {
  if (!activeJournal) return [];
  ensureDirs();
  const files = fs.readdirSync(entriesDir()).filter((f) => f.endsWith(".json"));
  const all = [];
  for (const f of files) {
    const date = f.replace(/\.json$/, "");
    try {
      for (const e of readDay(date).entries) all.push({ ...e, date });
    } catch {
      /* skip corrupt */
    }
  }
  // Newest first: by date desc, then time desc.
  all.sort((a, b) => (a.date === b.date ? (a.time < b.time ? 1 : -1) : a.date < b.date ? 1 : -1));
  return all;
}

// Normalize a list of free-form labels (tags / people): strip a leading #/@,
// trim, drop empties, de-duplicate. Tags are lower-cased; people keep their case.
function normStrList(list, lower) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    let s = String(raw || "").replace(/^[#@]+/, "").trim();
    if (lower) s = s.toLowerCase();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function upsertEntry(entry) {
  if (!activeJournal) return null;
  const date = entry.date;
  const now = new Date().toISOString();
  const day = readDay(date).entries;
  const id = entry.id || crypto.randomUUID();
  const i = day.findIndex((e) => e.id === id);
  const full = {
    id,
    date,
    time: entry.time || "12:00",
    mood: entry.mood ?? null,
    activities: Array.isArray(entry.activities) ? entry.activities : [],
    goals: Array.isArray(entry.goals) ? entry.goals : [],
    text: entry.text ?? "",
    images: Array.isArray(entry.images) ? entry.images : [],
    place: typeof entry.place === "string" ? entry.place.trim() : "",
    weather: entry.weather || null,
    favorite: !!entry.favorite,
    tags: normStrList(entry.tags, true),
    people: normStrList(entry.people, false),
    tripId: entry.tripId || null,
    createdAt: i >= 0 ? day[i].createdAt : now,
    updatedAt: now,
  };
  if (i >= 0) day[i] = full;
  else day.push(full);
  writeDay(date, day);
  return full;
}

function deleteEntry(date, id) {
  if (!activeJournal) return true;
  const day = readDay(date).entries.filter((e) => e.id !== id);
  writeDay(date, day);
  return true;
}

// --- Activities (tags) ---
const DEFAULT_ACTIVITIES = [
  { id: "sport", emoji: "🏃", name: "Sport" },
  { id: "marche", emoji: "🚶", name: "Marche" },
  { id: "sommeil", emoji: "😴", name: "Sommeil" },
  { id: "sante", emoji: "💊", name: "Santé" },
  { id: "amis", emoji: "👥", name: "Amis" },
  { id: "famille", emoji: "👨‍👩‍👧", name: "Famille" },
  { id: "couple", emoji: "❤️", name: "Couple" },
  { id: "lecture", emoji: "📖", name: "Lecture" },
  { id: "film", emoji: "🎬", name: "Film / Série" },
  { id: "jeux", emoji: "🎮", name: "Jeux" },
  { id: "musique", emoji: "🎵", name: "Musique" },
  { id: "travail", emoji: "💼", name: "Travail" },
  { id: "etudes", emoji: "📚", name: "Études" },
  { id: "cuisine", emoji: "🍳", name: "Cuisine" },
  { id: "courses", emoji: "🛒", name: "Courses" },
  { id: "menage", emoji: "🧹", name: "Ménage" },
  { id: "voyage", emoji: "✈️", name: "Voyage" },
  { id: "nature", emoji: "🌳", name: "Nature" },
  { id: "repos", emoji: "🛋️", name: "Repos" },
];

function getActivities() {
  if (!activeJournal) return DEFAULT_ACTIVITIES;
  try {
    const list = readBlob(activitiesFile());
    return Array.isArray(list) ? list : DEFAULT_ACTIVITIES;
  } catch {
    return DEFAULT_ACTIVITIES;
  }
}
function setActivities(list) {
  if (!activeJournal) return DEFAULT_ACTIVITIES;
  ensureDirs();
  const clean = Array.isArray(list) ? list : [];
  writeBlob(activitiesFile(), clean);
  return clean;
}

// --- Goals (objectifs: short/medium/long term) ---
// Goal: { id, text, term: "short"|"medium"|"long", createdAt }
function getGoals() {
  if (!activeJournal) return [];
  try {
    const list = readBlob(goalsFile());
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
function setGoals(list) {
  if (!activeJournal) return [];
  ensureDirs();
  const clean = Array.isArray(list) ? list : [];
  writeBlob(goalsFile(), clean);
  return clean;
}

// --- Tasks (to-do with carry-over) ---
// Task: { id, text, done, createdAt, doneAt }
function getTasks() {
  if (!activeJournal) return [];
  try {
    const list = readBlob(tasksFile());
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
function setTasks(list) {
  if (!activeJournal) return [];
  ensureDirs();
  const clean = Array.isArray(list)
    ? list.filter((t) => t && t.text).map((t) => ({
        id: t.id || crypto.randomUUID(),
        text: String(t.text).trim(),
        done: !!t.done,
        createdAt: t.createdAt || new Date().toISOString(),
        doneAt: t.done ? t.doneAt || new Date().toISOString() : null,
      }))
    : [];
  writeBlob(tasksFile(), clean);
  return clean;
}

// --- Trackers (daily habits / metrics) ---
// Shape: { defs: [{ id, emoji, name, type:"check"|"count", target }], log: { "YYYY-MM-DD": { [id]: number } } }
const EMPTY_TRACKERS = { defs: [], log: {} };
function getTrackers() {
  if (!activeJournal) return { ...EMPTY_TRACKERS };
  try {
    const obj = readBlob(trackersFile());
    return {
      defs: Array.isArray(obj && obj.defs) ? obj.defs : [],
      log: obj && obj.log && typeof obj.log === "object" ? obj.log : {},
    };
  } catch {
    return { ...EMPTY_TRACKERS };
  }
}
function setTrackers(obj) {
  if (!activeJournal) return { ...EMPTY_TRACKERS };
  ensureDirs();
  const defs = Array.isArray(obj && obj.defs)
    ? obj.defs.filter((d) => d && d.name).map((d) => ({
        id: d.id || crypto.randomUUID(),
        emoji: d.emoji || "✅",
        name: String(d.name).trim(),
        type: d.type === "count" ? "count" : "check",
        target: typeof d.target === "number" ? d.target : null,
      }))
    : [];
  const log = {};
  if (obj && obj.log && typeof obj.log === "object") {
    for (const [date, vals] of Object.entries(obj.log)) {
      if (!vals || typeof vals !== "object") continue;
      const clean = {};
      for (const [id, v] of Object.entries(vals)) if (typeof v === "number" && v) clean[id] = v;
      if (Object.keys(clean).length) log[date] = clean;
    }
  }
  writeBlob(trackersFile(), { defs, log });
  return { defs, log };
}

// --- Travel log (trips + countries) ---
// Shape: {
//   countries: { [alpha2]: "visited"|"wishlist" },   // manual map toggles
//   cities: [{ id, name, country, lat, lon, status }],// standalone pins (legacy)
//   trips:  [{ id, name, startDate, endDate, transports:[], notes,
//              cities:[{ id, name, country, lat, lon, arrive, depart, note }] }]
// }
const travelFile = () => path.join(activeJournal.path, "travel.json");
const EMPTY_TRAVEL = { countries: {}, cities: [], trips: [] };
const TRANSPORTS = ["plane", "train", "car", "bus", "boat", "bike", "foot"];
const num = (v) => (typeof v === "number" && isFinite(v) ? v : null);
function normCity(c) {
  if (!c || !c.name) return null;
  return {
    id: c.id || crypto.randomUUID(),
    name: String(c.name).trim(),
    country: (c.country ? String(c.country).toUpperCase() : "").slice(0, 2),
    lat: num(c.lat),
    lon: num(c.lon),
    arrive: c.arrive || "",
    depart: c.depart || "",
    note: typeof c.note === "string" ? c.note : "",
    status: c.status === "wishlist" ? "wishlist" : "visited",
  };
}
function normalizeTravel(obj) {
  const countries = {};
  if (obj && obj.countries && typeof obj.countries === "object") {
    for (const [code, status] of Object.entries(obj.countries)) {
      if (status === "visited" || status === "wishlist") countries[String(code).toUpperCase()] = status;
    }
  }
  const cities = Array.isArray(obj && obj.cities) ? obj.cities.map(normCity).filter(Boolean) : [];
  const trips = Array.isArray(obj && obj.trips)
    ? obj.trips.filter((t) => t && (t.name || (t.cities && t.cities.length))).map((t) => ({
        id: t.id || crypto.randomUUID(),
        name: typeof t.name === "string" ? t.name.trim() : "",
        startDate: t.startDate || "",
        endDate: t.endDate || "",
        transports: Array.isArray(t.transports) ? t.transports.filter((x) => TRANSPORTS.includes(x)) : [],
        notes: typeof t.notes === "string" ? t.notes : "",
        cities: Array.isArray(t.cities) ? t.cities.map(normCity).filter(Boolean) : [],
      }))
    : [];
  return { countries, cities, trips };
}
function getTravel() {
  if (!activeJournal) return { ...EMPTY_TRAVEL };
  try {
    return normalizeTravel(readBlob(travelFile()));
  } catch {
    return { ...EMPTY_TRAVEL };
  }
}
function setTravel(obj) {
  if (!activeJournal) return { ...EMPTY_TRAVEL };
  ensureDirs();
  const clean = normalizeTravel(obj);
  writeBlob(travelFile(), clean);
  return clean;
}

// --- Export / import (portable, decrypted backup) ---
// Produces a single self-contained object with all decrypted data + images
// (base64). Safe to save anywhere as JSON. importData() merges it back.
function exportData() {
  if (!activeJournal) return null;
  const entries = listEntries();
  const images = {};
  for (const e of entries) {
    for (const im of e.images || []) {
      const name = typeof im === "string" ? im : im.name;
      if (name && !images[name]) {
        const buf = readImageBuffer(name);
        if (buf) images[name] = buf.toString("base64");
      }
    }
  }
  return {
    format: "mon-journal-export",
    version: 1,
    name: activeJournal.name,
    exportedAt: new Date().toISOString(),
    activities: getActivities(),
    goals: getGoals(),
    travel: getTravel(),
    tasks: getTasks(),
    trackers: getTrackers(),
    entries,
    images,
  };
}

function importData(obj) {
  if (!activeJournal || !obj || obj.format !== "mon-journal-export") {
    return { ok: false, entries: 0 };
  }
  // Re-store (re-encrypt) images. storeImageBuffer is content-addressed, so the
  // filename is stable; keep a map just in case.
  const nameMap = {};
  for (const [name, b64] of Object.entries(obj.images || {})) {
    try {
      const ext = (path.extname(name) || ".jpg").toLowerCase();
      nameMap[name] = storeImageBuffer(Buffer.from(b64, "base64"), ext);
    } catch {
      /* skip bad image */
    }
  }
  // Merge activities and goals by id.
  const acts = getActivities();
  const actIds = new Set(acts.map((a) => a.id));
  for (const a of obj.activities || []) if (a && !actIds.has(a.id)) acts.push(a);
  setActivities(acts);

  const goals = getGoals();
  const goalIds = new Set(goals.map((g) => g.id));
  for (const g of obj.goals || []) if (g && !goalIds.has(g.id)) goals.push(g);
  setGoals(goals);

  // Merge travel: countries union (visited wins over wishlist), cities by id.
  if (obj.travel) {
    const cur = getTravel();
    const countries = { ...cur.countries };
    for (const [code, status] of Object.entries(obj.travel.countries || {})) {
      if (countries[code] === "visited") continue;
      countries[code] = status;
    }
    const cityIds = new Set(cur.cities.map((c) => c.id));
    const cities = [...cur.cities];
    for (const c of obj.travel.cities || []) if (c && !cityIds.has(c.id)) cities.push(c);
    const tripIds = new Set((cur.trips || []).map((tr) => tr.id));
    const trips = [...(cur.trips || [])];
    for (const tr of obj.travel.trips || []) if (tr && !tripIds.has(tr.id)) trips.push(tr);
    setTravel({ countries, cities, trips });
  }

  // Merge tasks by id; merge trackers (defs by id, log by date+id).
  if (Array.isArray(obj.tasks)) {
    const cur = getTasks();
    const ids = new Set(cur.map((t) => t.id));
    const merged = [...cur];
    for (const t of obj.tasks) if (t && !ids.has(t.id)) merged.push(t);
    setTasks(merged);
  }
  if (obj.trackers) {
    const cur = getTrackers();
    const defIds = new Set(cur.defs.map((d) => d.id));
    const defs = [...cur.defs];
    for (const d of obj.trackers.defs || []) if (d && !defIds.has(d.id)) defs.push(d);
    const log = { ...cur.log };
    for (const [date, vals] of Object.entries(obj.trackers.log || {})) {
      log[date] = { ...(log[date] || {}), ...vals };
    }
    setTrackers({ defs, log });
  }

  // Upsert entries (keep their ids so re-importing is idempotent).
  let count = 0;
  for (const e of obj.entries || []) {
    const images = (e.images || []).map((im) => {
      const name = typeof im === "string" ? im : im.name;
      return { name: nameMap[name] || name, caption: (im && im.caption) || "" };
    });
    upsertEntry({ ...e, images });
    count++;
  }
  return { ok: true, entries: count };
}

// --- Settings (plain) ---
const DEFAULT_SETTINGS = {
  theme: "system",
  accent: "#3da35d",
  reminderEnabled: false,
  reminderTime: "20:00",
  autoLockMinutes: 0, // 0 = disabled
  privacyBlur: false, // blur content when the window loses focus
  spellcheck: true, // native spell checking in the editor
};
function readSettings() {
  if (!activeJournal) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(settingsPath(), "utf8")) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
function writeSettings(patch) {
  if (!activeJournal) return { ...DEFAULT_SETTINGS };
  ensureDirs();
  const merged = { ...readSettings(), ...patch };
  fs.writeFileSync(settingsPath(), JSON.stringify(merged, null, 2));
  return merged;
}

// --- Images ---
function storeImageBuffer(buf, ext) {
  if (!activeJournal) return null;
  ensureDirs();
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 16);
  const filename = `${hash}${ext}`;
  const dest = path.join(imagesDir(), filename);
  if (!fs.existsSync(dest)) {
    fs.writeFileSync(dest, activeJournal.dek ? encryptBinary(buf, activeJournal.dek) : buf);
  }
  return filename;
}
function readImageBuffer(filename) {
  if (!activeJournal) return null;
  try {
    let buf = fs.readFileSync(path.join(imagesDir(), path.basename(filename)));
    if (activeJournal.dek) buf = decryptBinary(buf, activeJournal.dek);
    return buf;
  } catch {
    return null;
  }
}

module.exports = {
  init,
  listJournals,
  createJournal,
  unlockJournal,
  lockJournal,
  currentJournal,
  changePassword,
  moveJournal,
  activeJournalPath,
  getDay,
  listEntries,
  upsertEntry,
  deleteEntry,
  getActivities,
  setActivities,
  getGoals,
  setGoals,
  getTravel,
  setTravel,
  getTasks,
  setTasks,
  getTrackers,
  setTrackers,
  exportData,
  importData,
  readSettings,
  writeSettings,
  storeImageBuffer,
  readImageBuffer,
  DEFAULT_ACTIVITIES,
};
