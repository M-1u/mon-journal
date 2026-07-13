// Storage abstraction. In Electron it talks to the file-backed main process
// (window.journalAPI). In a plain browser (design preview) it falls back to
// localStorage so the whole UI still works and can be verified.
//
// Everything below the journal layer operates on the *currently unlocked*
// journal: in Electron the main process tracks it; in the fallback we track it
// here (fbActiveId) and namespace localStorage keys per journal.

import { DEFAULT_ACTIVITIES } from "./activities.js";

const api = typeof window !== "undefined" ? window.journalAPI : null;
export const isElectron = !!(api && api.isElectron);

// ---- localStorage fallback helpers ----------------------------------------

const LS_REGISTRY = "monjournal.registry";
let fbActiveId = null;

function lsRead(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function lsWrite(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

const jkey = (suffix) => `monjournal.j.${fbActiveId}.${suffix}`;

const DEFAULT_SETTINGS = {
  theme: "system",
  accent: "#3da35d",
  reminderEnabled: false,
  reminderTime: "20:00",
};

// PBKDF2 password hashing for the browser fallback (scrypt is used in Electron).
function randSaltHex() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function pbkdf2(password, saltHex) {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(String(password)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fbRegistry() {
  return lsRead(LS_REGISTRY, { version: 1, journals: [] });
}

// ---- Public API -----------------------------------------------------------

export const storage = {
  // --- Journals / access ---
  async listJournals() {
    if (isElectron) return api.listJournals();
    return fbRegistry().journals.map((j) => ({ id: j.id, name: j.name }));
  },

  async createJournal(name, password) {
    if (isElectron) return api.createJournal(name, password);
    const reg = fbRegistry();
    const id = crypto.randomUUID();
    const salt = randSaltHex();
    const hash = await pbkdf2(password, salt);
    reg.journals.push({ id, name: String(name).trim(), salt, hash });
    lsWrite(LS_REGISTRY, reg);
    fbActiveId = id;
    return { id, name: String(name).trim() };
  },

  async unlockJournal(id, password) {
    if (isElectron) return api.unlockJournal(id, password);
    const j = fbRegistry().journals.find((x) => x.id === id);
    if (!j) return null;
    const hash = await pbkdf2(password, j.salt);
    if (hash !== j.hash) return null;
    fbActiveId = id;
    return { id: j.id, name: j.name };
  },

  async lockJournal() {
    if (isElectron) return api.lockJournal();
    fbActiveId = null;
    return true;
  },

  async currentJournal() {
    if (isElectron) return api.currentJournal();
    if (!fbActiveId) return null;
    const j = fbRegistry().journals.find((x) => x.id === fbActiveId);
    return j ? { id: j.id, name: j.name } : null;
  },

  async changePassword(oldPassword, newPassword) {
    if (isElectron) return api.changePassword(oldPassword, newPassword);
    if (!fbActiveId) return { ok: false, error: "locked" };
    const reg = fbRegistry();
    const j = reg.journals.find((x) => x.id === fbActiveId);
    if (!j) return { ok: false, error: "missing" };
    const oldHash = await pbkdf2(oldPassword, j.salt);
    if (oldHash !== j.hash) return { ok: false, error: "bad" };
    const salt = randSaltHex();
    j.salt = salt;
    j.hash = await pbkdf2(newPassword, salt);
    lsWrite(LS_REGISTRY, reg);
    return { ok: true };
  },

  // --- Entries (several per day) ---
  // Fallback stores a map { date: [entries] } under jkey("days").
  async getDay(date) {
    if (isElectron) return api.getDay(date);
    if (!fbActiveId) return [];
    const days = lsRead(jkey("days"), {});
    return days[date] || [];
  },

  async listEntries() {
    if (isElectron) return api.listEntries();
    if (!fbActiveId) return [];
    const days = lsRead(jkey("days"), {});
    const all = [];
    for (const [date, entries] of Object.entries(days)) {
      for (const e of entries) all.push({ ...e, date });
    }
    all.sort((a, b) =>
      a.date === b.date ? (a.time < b.time ? 1 : -1) : a.date < b.date ? 1 : -1
    );
    return all;
  },

  async upsertEntry(entry) {
    if (isElectron) return api.upsertEntry(entry);
    if (!fbActiveId) return null;
    const days = lsRead(jkey("days"), {});
    const date = entry.date;
    const list = days[date] || [];
    const now = new Date().toISOString();
    const id = entry.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
    const i = list.findIndex((e) => e.id === id);
    const full = {
      id,
      date,
      time: entry.time || "12:00",
      mood: entry.mood ?? null,
      activities: Array.isArray(entry.activities) ? entry.activities : [],
      goals: Array.isArray(entry.goals) ? entry.goals : [],
      text: entry.text ?? "",
      images: Array.isArray(entry.images) ? entry.images : [],
      createdAt: i >= 0 ? list[i].createdAt : now,
      updatedAt: now,
    };
    if (i >= 0) list[i] = full;
    else list.push(full);
    list.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    days[date] = list;
    lsWrite(jkey("days"), days);
    return full;
  },

  async deleteEntry(date, id) {
    if (isElectron) return api.deleteEntry(date, id);
    if (!fbActiveId) return true;
    const days = lsRead(jkey("days"), {});
    const list = (days[date] || []).filter((e) => e.id !== id);
    if (list.length) days[date] = list;
    else delete days[date];
    lsWrite(jkey("days"), days);
    return true;
  },

  // --- Activities ---
  async getActivities() {
    if (isElectron) return api.getActivities();
    if (!fbActiveId) return DEFAULT_ACTIVITIES;
    return lsRead(jkey("activities"), DEFAULT_ACTIVITIES);
  },
  async setActivities(list) {
    if (isElectron) return api.setActivities(list);
    if (!fbActiveId) return DEFAULT_ACTIVITIES;
    lsWrite(jkey("activities"), list);
    return list;
  },

  // --- Goals (objectifs) ---
  async getGoals() {
    if (isElectron) return api.getGoals();
    if (!fbActiveId) return [];
    return lsRead(jkey("goals"), []);
  },
  async setGoals(list) {
    if (isElectron) return api.setGoals(list);
    if (!fbActiveId) return [];
    lsWrite(jkey("goals"), list);
    return list;
  },

  // --- Settings ---
  async getSettings() {
    if (isElectron) return api.getSettings();
    if (!fbActiveId) return { ...DEFAULT_SETTINGS };
    return lsRead(jkey("settings"), DEFAULT_SETTINGS);
  },

  async setSettings(patch) {
    if (isElectron) return api.setSettings(patch);
    if (!fbActiveId) return { ...DEFAULT_SETTINGS };
    const merged = { ...lsRead(jkey("settings"), DEFAULT_SETTINGS), ...patch };
    lsWrite(jkey("settings"), merged);
    return merged;
  },

  // --- Images ---
  async addImageFiles(fileList) {
    const files = Array.from(fileList);
    const names = [];
    for (const file of files) {
      const buf = await file.arrayBuffer();
      if (isElectron) {
        names.push(await api.importImageFromData(file.name, arrayBufferToBase64(buf)));
      } else {
        const filename = (await sha(buf)) + extOf(file.name);
        const images = lsRead(jkey("images"), {});
        images[filename] = await blobToDataURL(file);
        lsWrite(jkey("images"), images);
        names.push(filename);
      }
    }
    return names;
  },

  async pickImages() {
    if (isElectron) return api.pickImages();
    return [];
  },

  imageUrl(filename) {
    if (isElectron) return api.imageUrl(filename);
    const images = lsRead(jkey("images"), {});
    return images[filename] || "";
  },

  // --- Export / import ---
  async exportJournal() {
    if (isElectron) return api.exportJournal();
    if (!fbActiveId) return { ok: false };
    const data = fbBuildExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (data.name || "journal") + "-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  },
  async importJournal() {
    // Electron opens its own file dialog; the browser needs a File (see importJournalFile).
    if (isElectron) return api.importJournal();
    return { ok: false, needFile: true };
  },
  async importJournalFile(file) {
    if (!fbActiveId) return { ok: false };
    try {
      const obj = JSON.parse(await file.text());
      return fbApplyImport(obj);
    } catch {
      return { ok: false, error: "parse" };
    }
  },

  // --- Journal folder ---
  async getStorageRoot() {
    if (isElectron) return api.getStorageRoot();
    return "Stockage du navigateur (aperçu)";
  },
  async openStorageRoot() {
    if (isElectron) return api.openStorageRoot();
  },
};

// ---- fallback export/import (browser preview) ------------------------------

function fbBuildExport() {
  const days = lsRead(jkey("days"), {});
  const entries = [];
  for (const [date, list] of Object.entries(days)) for (const e of list) entries.push({ ...e, date });
  const imagesLS = lsRead(jkey("images"), {}); // name -> dataURL
  const images = {};
  for (const e of entries) {
    for (const im of e.images || []) {
      const name = typeof im === "string" ? im : im.name;
      if (name && imagesLS[name] && !images[name]) {
        images[name] = String(imagesLS[name]).split(",")[1] || "";
      }
    }
  }
  const reg = fbRegistry().journals.find((x) => x.id === fbActiveId) || {};
  return {
    format: "mon-journal-export",
    version: 1,
    name: reg.name || "journal",
    exportedAt: new Date().toISOString(),
    activities: lsRead(jkey("activities"), DEFAULT_ACTIVITIES),
    goals: lsRead(jkey("goals"), []),
    entries,
    images,
  };
}

function fbApplyImport(obj) {
  if (!obj || obj.format !== "mon-journal-export") return { ok: false, error: "format" };
  const imagesLS = lsRead(jkey("images"), {});
  for (const [name, b64] of Object.entries(obj.images || {})) {
    if (!imagesLS[name]) {
      const ext = (name.split(".").pop() || "png").toLowerCase();
      const mime =
        ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/png";
      imagesLS[name] = `data:${mime};base64,${b64}`;
    }
  }
  lsWrite(jkey("images"), imagesLS);

  const acts = lsRead(jkey("activities"), DEFAULT_ACTIVITIES);
  const aid = new Set(acts.map((a) => a.id));
  for (const a of obj.activities || []) if (a && !aid.has(a.id)) acts.push(a);
  lsWrite(jkey("activities"), acts);

  const goals = lsRead(jkey("goals"), []);
  const gid = new Set(goals.map((g) => g.id));
  for (const g of obj.goals || []) if (g && !gid.has(g.id)) goals.push(g);
  lsWrite(jkey("goals"), goals);

  const days = lsRead(jkey("days"), {});
  let count = 0;
  for (const e of obj.entries || []) {
    const list = days[e.date] || [];
    const full = {
      id: e.id,
      date: e.date,
      time: e.time || "12:00",
      mood: e.mood ?? null,
      activities: e.activities || [],
      goals: e.goals || [],
      text: e.text || "",
      images: (e.images || []).map((im) => (typeof im === "string" ? { name: im, caption: "" } : im)),
      createdAt: e.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const i = list.findIndex((x) => x.id === e.id);
    if (i >= 0) list[i] = full;
    else list.push(full);
    list.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    days[e.date] = list;
    count++;
  }
  lsWrite(jkey("days"), days);
  return { ok: true, entries: count };
}

function extOf(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : ".jpg";
}
async function sha(buf) {
  const digest = await crypto.subtle.digest("SHA-1", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(blob);
  });
}
function arrayBufferToBase64(buf) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
