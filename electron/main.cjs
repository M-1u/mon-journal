const {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  dialog,
  Notification,
  shell,
  Menu,
  Tray,
  nativeImage,
  powerMonitor,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const core = require("./journal-core.cjs");

const DEV_URL = process.env.VITE_DEV_SERVER_URL;

// Only one running instance: a second launch just focuses the existing window.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// See journal-core.cjs for the storage + encryption model.

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
};

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 720,
    minHeight: 560,
    backgroundColor: "#111418",
    title: "Mon Journal",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });
  if (DEV_URL) mainWindow.loadURL(DEV_URL);
  else mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));

  applySpellcheck();

  // Tell the renderer when we lose/gain focus (privacy blur) — and, if the
  // journal asks for it, auto-lock is driven from the renderer's activity timer.
  mainWindow.on("blur", () => mainWindow?.webContents.send("window:blur"));
  mainWindow.on("focus", () => mainWindow?.webContents.send("window:focus"));

  // Right-click: spelling suggestions + basic edit actions.
  mainWindow.webContents.on("context-menu", (_e, params) => {
    const items = [];
    for (const s of params.dictionarySuggestions) {
      items.push({ label: s, click: () => mainWindow.webContents.replaceMisspelling(s) });
    }
    if (params.dictionarySuggestions.length) items.push({ type: "separator" });
    if (params.misspelledWord) {
      items.push({
        label: "Ajouter au dictionnaire",
        click: () =>
          mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
      });
      items.push({ type: "separator" });
    }
    if (params.isEditable || params.selectionText) {
      items.push({ role: "cut", enabled: params.editFlags.canCut });
      items.push({ role: "copy", enabled: params.editFlags.canCopy });
      items.push({ role: "paste", enabled: params.editFlags.canPaste });
      items.push({ role: "selectAll" });
    }
    if (items.length) Menu.buildFromTemplate(items).popup();
  });

  // External links open in the system browser, not inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  // Closing hides to the tray (if a tray exists) instead of quitting.
  mainWindow.on("close", (e) => {
    if (!isQuitting && tray) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// Enable/disable native spell checking from the active journal's setting.
function applySpellcheck() {
  if (!mainWindow) return;
  const s = core.currentJournal() ? core.readSettings() : { spellcheck: true };
  const ses = mainWindow.webContents.session;
  try {
    ses.setSpellCheckerEnabled(!!s.spellcheck);
    if (s.spellcheck) {
      const langs = ses.availableSpellCheckerLanguages || [];
      const want = ["fr", "fr-FR", "en-US", "en"].filter((l) => langs.includes(l)).slice(0, 3);
      if (want.length) ses.setSpellCheckerLanguages(want);
    }
  } catch {
    /* spellchecker not available on this platform build */
  }
}

// ---------------------------------------------------------------------------
// Reminders (for the active journal)
// ---------------------------------------------------------------------------

let reminderTimer = null;
function scheduleReminder() {
  if (reminderTimer) clearTimeout(reminderTimer);
  if (!core.currentJournal()) return;
  const s = core.readSettings();
  if (!s.reminderEnabled) return;
  const [h, m] = (s.reminderTime || "20:00").split(":").map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  reminderTimer = setTimeout(() => {
    if (Notification.isSupported()) {
      new Notification({
        title: "Mon Journal",
        body: "Un petit moment pour noter ta journée ? ✍️",
      }).show();
    }
    scheduleReminder();
  }, next - now);
}

// ---------------------------------------------------------------------------
// System tray (quick access + quick add)
// ---------------------------------------------------------------------------

function showWindow() {
  if (!mainWindow) createWindow();
  else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function createTray() {
  if (tray) return;
  const iconPath = path.join(__dirname, "..", "build", "icon.png");
  let img = nativeImage.createFromPath(iconPath);
  if (!img.isEmpty()) img = img.resize({ width: 18, height: 18 });
  try {
    tray = new Tray(img.isEmpty() ? nativeImage.createEmpty() : img);
  } catch {
    return; // tray unsupported
  }
  tray.setToolTip("Mon Journal");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Ouvrir Mon Journal", click: showWindow },
      {
        label: "Nouvelle entrée",
        click: () => {
          showWindow();
          mainWindow?.webContents.send("app:new-entry");
        },
      },
      { type: "separator" },
      {
        label: "Quitter",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on("click", showWindow);
}

// ---------------------------------------------------------------------------
// PDF export (renders the decrypted journal to a printable document)
// ---------------------------------------------------------------------------

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function buildJournalHtml() {
  const entries = core.listEntries() || [];
  const acts = {};
  for (const a of core.getActivities() || []) acts[a.id] = a;
  const goals = {};
  for (const g of core.getGoals() || []) goals[g.id] = g;
  // Mood scale is 1 (worst) .. 5 (best), matching src/lib/moods.js.
  const MOODS = { 1: "😢", 2: "🙁", 3: "😐", 4: "🙂", 5: "😄" };
  const WEATHER = { sunny: "☀️", partly: "🌤️", cloudy: "☁️", rainy: "🌧️", stormy: "⛈️", snowy: "❄️", foggy: "🌫️", windy: "💨" };
  const byDate = {};
  for (const e of entries) (byDate[e.date] ||= []).push(e);
  const dates = Object.keys(byDate).sort().reverse();
  const name = core.currentJournal()?.name || "Journal";

  let body = "";
  for (const d of dates) {
    body += `<h2>${esc(d)}</h2>`;
    for (const e of byDate[d].sort((a, b) => (a.time < b.time ? 1 : -1))) {
      const mood = e.mood != null ? MOODS[e.mood] || "" : "";
      const weather = e.weather ? WEATHER[e.weather] || "" : "";
      const fav = e.favorite ? "★ " : "";
      const ctx = [weather, e.place ? "📍 " + esc(e.place) : ""].filter(Boolean).join(" · ");
      const tags = (e.activities || []).map((id) => acts[id]).filter(Boolean)
        .map((a) => `${a.emoji} ${esc(a.name)}`).join(" · ");
      const gs = (e.goals || []).map((id) => goals[id]).filter(Boolean)
        .map((g) => `🎯 ${esc(g.text)}`).join(" · ");
      const text = esc(e.text || "").replace(/\n/g, "<br>");
      body += `<div class="entry"><div class="meta">${fav}${esc(e.time || "")} ${mood}</div>` +
        (ctx ? `<div class="tags">${ctx}</div>` : "") +
        (tags ? `<div class="tags">${tags}</div>` : "") +
        (gs ? `<div class="tags">${gs}</div>` : "") +
        (text ? `<div class="text">${text}</div>` : "") +
        `</div>`;
    }
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a2230;max-width:720px;margin:24px auto;padding:0 24px;}
    h1{font-size:24px;} h2{margin-top:28px;border-bottom:1px solid #ddd;padding-bottom:4px;font-size:16px;color:#3da35d;}
    .entry{margin:12px 0;padding:10px 14px;border:1px solid #eee;border-radius:8px;}
    .meta{font-weight:600;} .tags{color:#556;font-size:13px;margin-top:4px;} .text{margin-top:8px;white-space:normal;line-height:1.5;}
  </style></head><body><h1>${esc(name)}</h1>${body || "<p>Aucune entrée.</p>"}</body></html>`;
}

async function exportPdf() {
  if (!core.currentJournal()) return { ok: false };
  const res = await dialog.showSaveDialog(mainWindow, {
    title: "Exporter en PDF",
    defaultPath: `${core.currentJournal()?.name || "journal"}-${new Date().toISOString().slice(0, 10)}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (res.canceled || !res.filePath) return { ok: false, canceled: true };
  const win = new BrowserWindow({ show: false });
  try {
    await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(buildJournalHtml()));
    const pdf = await win.webContents.printToPDF({ printBackground: true, margins: { marginType: "default" } });
    fs.writeFileSync(res.filePath, pdf);
    return { ok: true, path: res.filePath };
  } catch (e) {
    return { ok: false, error: String(e) };
  } finally {
    win.destroy();
  }
}

// ---------------------------------------------------------------------------
// Auto-update (GitHub releases; no-op in dev / unsigned dev builds)
// ---------------------------------------------------------------------------

function setupAutoUpdate() {
  if (DEV_URL || !app.isPackaged) return;
  try {
    const { autoUpdater } = require("electron-updater");
    autoUpdater.autoDownload = true;
    autoUpdater.on("update-downloaded", () => {
      mainWindow?.webContents.send("app:update-ready");
    });
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  } catch {
    /* electron-updater not available */
  }
}

async function checkForUpdates() {
  if (DEV_URL || !app.isPackaged) return { ok: false, dev: true };
  try {
    const { autoUpdater } = require("electron-updater");
    const r = await autoUpdater.checkForUpdates();
    return { ok: true, version: r?.updateInfo?.version };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ---------------------------------------------------------------------------
// Image protocol (decrypts on the fly)
// ---------------------------------------------------------------------------

protocol.registerSchemesAsPrivileged([
  {
    scheme: "journalimg",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

function registerImageProtocol() {
  protocol.handle("journalimg", (request) => {
    const url = new URL(request.url);
    const filename = path.basename(decodeURIComponent(url.pathname));
    const buf = core.readImageBuffer(filename);
    if (!buf) return new Response("", { status: 404 });
    const type = MIME[path.extname(filename).toLowerCase()] || "application/octet-stream";
    return new Response(buf, { headers: { "content-type": type } });
  });
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------

function registerIpc() {
  ipcMain.handle("journals:list", () => core.listJournals());
  ipcMain.handle("journals:create", (_e, { name, password }) => {
    const r = core.createJournal(name, password);
    scheduleReminder();
    applySpellcheck();
    return r;
  });
  ipcMain.handle("journals:unlock", (_e, { id, password }) => {
    const r = core.unlockJournal(id, password);
    if (r) {
      scheduleReminder();
      applySpellcheck();
    }
    return r;
  });
  ipcMain.handle("journals:lock", () => {
    if (reminderTimer) clearTimeout(reminderTimer);
    const r = core.lockJournal();
    applySpellcheck();
    return r;
  });
  ipcMain.handle("journals:current", () => core.currentJournal());
  ipcMain.handle("journals:changePassword", (_e, { oldPassword, newPassword }) =>
    core.changePassword(oldPassword, newPassword)
  );

  ipcMain.handle("journal:getDay", (_e, date) => core.getDay(date));
  ipcMain.handle("journal:listEntries", () => core.listEntries());
  ipcMain.handle("journal:upsertEntry", (_e, entry) => core.upsertEntry(entry));
  ipcMain.handle("journal:deleteEntry", (_e, date, id) => core.deleteEntry(date, id));

  ipcMain.handle("activities:get", () => core.getActivities());
  ipcMain.handle("activities:set", (_e, list) => core.setActivities(list));

  ipcMain.handle("goals:get", () => core.getGoals());
  ipcMain.handle("goals:set", (_e, list) => core.setGoals(list));

  ipcMain.handle("travel:get", () => core.getTravel());
  ipcMain.handle("travel:set", (_e, obj) => core.setTravel(obj));

  ipcMain.handle("settings:get", () => core.readSettings());
  ipcMain.handle("settings:set", (_e, patch) => {
    const merged = core.writeSettings(patch);
    scheduleReminder();
    if ("spellcheck" in patch) applySpellcheck();
    return merged;
  });

  ipcMain.handle("journal:exportPdf", () => exportPdf());
  ipcMain.handle("app:checkUpdates", () => checkForUpdates());
  ipcMain.handle("app:installUpdate", () => {
    try {
      isQuitting = true;
      require("electron-updater").autoUpdater.quitAndInstall();
    } catch {
      /* ignore */
    }
  });

  ipcMain.handle("images:importFromData", (_e, name, base64) => {
    const ext = (path.extname(name) || ".jpg").toLowerCase();
    return core.storeImageBuffer(Buffer.from(base64, "base64"), ext);
  });
  ipcMain.handle("dialog:pickImages", async () => {
    if (!core.currentJournal()) return [];
    const res = await dialog.showOpenDialog(mainWindow, {
      title: "Ajouter des photos",
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp"] }],
    });
    if (res.canceled) return [];
    return res.filePaths.map((p) =>
      core.storeImageBuffer(fs.readFileSync(p), (path.extname(p) || ".jpg").toLowerCase())
    );
  });

  ipcMain.handle("journal:export", async () => {
    const data = core.exportData();
    if (!data) return { ok: false };
    const res = await dialog.showSaveDialog(mainWindow, {
      title: "Exporter le journal",
      defaultPath: `${core.currentJournal()?.name || "journal"}-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (res.canceled || !res.filePath) return { ok: false, canceled: true };
    fs.writeFileSync(res.filePath, JSON.stringify(data, null, 2));
    return { ok: true, path: res.filePath };
  });
  ipcMain.handle("journal:import", async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
      title: "Importer une sauvegarde",
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (res.canceled || !res.filePaths[0]) return { ok: false, canceled: true };
    try {
      const obj = JSON.parse(fs.readFileSync(res.filePaths[0], "utf8"));
      return core.importData(obj);
    } catch {
      return { ok: false, error: "parse" };
    }
  });

  ipcMain.handle("journal:move", async () => {
    if (!core.currentJournal()) return { ok: false };
    const res = await dialog.showOpenDialog(mainWindow, {
      title: "Choisir le nouvel emplacement du journal",
      properties: ["openDirectory", "createDirectory"],
    });
    if (res.canceled || !res.filePaths[0]) return { ok: false, canceled: true };
    return core.moveJournal(res.filePaths[0]);
  });

  ipcMain.handle("storage:getRoot", () => core.activeJournalPath());
  ipcMain.handle("storage:openRoot", () => {
    const p = core.activeJournalPath();
    if (p) shell.openPath(p);
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  core.init({
    defaultConfigDir: app.getPath("userData"),
    defaultJournalsBase: path.join(app.getPath("documents"), "MonJournal"),
  });
  registerImageProtocol();
  registerIpc();
  createWindow();
  createTray();
  setupAutoUpdate();

  // Lock the journal when the OS suspends or the screen is locked.
  const lockNow = () => mainWindow?.webContents.send("app:lock");
  try {
    powerMonitor.on("suspend", lockNow);
    powerMonitor.on("lock-screen", lockNow);
  } catch {
    /* powerMonitor events unsupported */
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else showWindow();
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  // With a tray the app keeps running in the background; otherwise quit.
  if (process.platform !== "darwin" && !tray) app.quit();
});
