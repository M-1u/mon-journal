const { contextBridge, ipcRenderer } = require("electron");

// Exposed to the renderer as window.journalAPI. The renderer's storage layer
// (src/lib/storage.js) uses this when present, and falls back to localStorage
// when running in a plain browser (e.g. the design preview).
contextBridge.exposeInMainWorld("journalAPI", {
  isElectron: true,

  // Journals / access
  listJournals: () => ipcRenderer.invoke("journals:list"),
  createJournal: (name, password) =>
    ipcRenderer.invoke("journals:create", { name, password }),
  unlockJournal: (id, password) =>
    ipcRenderer.invoke("journals:unlock", { id, password }),
  lockJournal: () => ipcRenderer.invoke("journals:lock"),
  currentJournal: () => ipcRenderer.invoke("journals:current"),
  changePassword: (oldPassword, newPassword) =>
    ipcRenderer.invoke("journals:changePassword", { oldPassword, newPassword }),

  // Entries (Daylio-style: several per day)
  getDay: (date) => ipcRenderer.invoke("journal:getDay", date),
  listEntries: () => ipcRenderer.invoke("journal:listEntries"),
  upsertEntry: (entry) => ipcRenderer.invoke("journal:upsertEntry", entry),
  deleteEntry: (date, id) => ipcRenderer.invoke("journal:deleteEntry", date, id),

  // Activities (tags)
  getActivities: () => ipcRenderer.invoke("activities:get"),
  setActivities: (list) => ipcRenderer.invoke("activities:set", list),

  // Goals (objectifs)
  getGoals: () => ipcRenderer.invoke("goals:get"),
  setGoals: (list) => ipcRenderer.invoke("goals:set", list),

  // Export / import
  exportJournal: () => ipcRenderer.invoke("journal:export"),
  importJournal: () => ipcRenderer.invoke("journal:import"),

  // Settings
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: (patch) => ipcRenderer.invoke("settings:set", patch),

  // Images
  importImageFromData: (name, base64) =>
    ipcRenderer.invoke("images:importFromData", name, base64),
  pickImages: () => ipcRenderer.invoke("dialog:pickImages"),
  imageUrl: (filename) => `journalimg://local/${filename}`,

  // Journal folder
  getStorageRoot: () => ipcRenderer.invoke("storage:getRoot"),
  openStorageRoot: () => ipcRenderer.invoke("storage:openRoot"),
  moveJournal: () => ipcRenderer.invoke("journal:move"),
});
