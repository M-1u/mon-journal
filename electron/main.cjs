const {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  dialog,
  Notification,
  shell,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const core = require("./journal-core.cjs");

const DEV_URL = process.env.VITE_DEV_SERVER_URL;

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
    },
  });
  if (DEV_URL) mainWindow.loadURL(DEV_URL);
  else mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
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
    return r;
  });
  ipcMain.handle("journals:unlock", (_e, { id, password }) => {
    const r = core.unlockJournal(id, password);
    if (r) scheduleReminder();
    return r;
  });
  ipcMain.handle("journals:lock", () => {
    if (reminderTimer) clearTimeout(reminderTimer);
    return core.lockJournal();
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

  ipcMain.handle("settings:get", () => core.readSettings());
  ipcMain.handle("settings:set", (_e, patch) => {
    const merged = core.writeSettings(patch);
    scheduleReminder();
    return merged;
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

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
