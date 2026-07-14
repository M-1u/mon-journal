<h1 align="center">📔 Mon Journal</h1>

<p align="center">
  A <b>local, private, offline</b> journaling app — moods, activities, goals and photos.<br>
  Encrypted desktop app, inspired by <a href="https://github.com/demizo/daily_you">Daily You</a>.
</p>

<p align="center">
  <a href="https://github.com/M-1u/mon-journal/releases/latest"><img src="https://img.shields.io/github/v/release/M-1u/mon-journal?color=3da35d&label=version" alt="Latest release"></a>
  <a href="https://github.com/M-1u/mon-journal/releases"><img src="https://img.shields.io/github/downloads/M-1u/mon-journal/total?color=3da35d&label=downloads" alt="Downloads"></a>
  <img src="https://img.shields.io/badge/platforms-Windows%20%7C%20Linux-4c8bf5" alt="Platforms">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-3da35d" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Electron-React-8b5cf6" alt="Electron + React">
</p>

<p align="center">
  <a href="README.md">🇫🇷 Français</a> · <b>🇬🇧 English</b>
  &nbsp;•&nbsp;
  <a href="https://github.com/M-1u/mon-journal/releases/latest"><b>⬇️ Download</b></a>
</p>

> The app's interface is available in both **French and English** (switch in Settings).

## Screenshots

| The day | The mood calendar |
| :---: | :---: |
| ![Day view](screenshots/today.png) | ![Calendar](screenshots/calendar.png) |
| **Statistics** | **Goals** |
| ![Statistics](screenshots/stats.png) | ![Goals](screenshots/goals.png) |

<p align="center"><img src="screenshots/gallery.png" alt="Gallery" width="70%"></p>

## Features

- **Multiple journals** — create as many separate journals as you like (e.g.
  Personal, Work). Each has its own entries, photos and settings.
- **Password + encryption** — every journal is protected by a **mandatory**
  password (set at creation, asked on every open). Entries and photos are
  **encrypted on disk** (AES-256-GCM; key derived from the password with scrypt).
  You can **change the password** in Settings.
  ⚠️ Because it is real encryption, a **forgotten password = lost data** (no recovery).
- **Goals** — set **short / medium / long term** goals (a global list in the Goals
  tab). From any entry, **mark them as reached** via a dropdown; they then show as
  “reached” with the date.
- **Daily mood** — 5 levels (Great → Awful), like Daily You / Daylio.
- **Photos per day** — attach images to each day, copied into your folder, each
  with an optional **caption**, also shown in the gallery.
- **Visual (WYSIWYG) editor** — clicking Bold makes the text bold right away, like
  a word processor: bold, italic, heading, lists, quote, link, code. Shortcuts
  Ctrl+B / Ctrl+I / Ctrl+K. Content is still **stored as Markdown** in your files.
- **Calendar** — every day colored by your mood, at a glance.
- **Journal (timeline)** — all your entries, newest first.
- **Statistics** — current streak, average mood, distribution, 30-day trend,
  most-frequent activities.
- **Gallery** — all your photos in one place, with a full-screen view.
- **Themes** — light / dark / system, plus an accent color.
- **Daily reminder** — a notification at the time you choose.
- **Backup / restore** — export a readable (decrypted JSON) copy of your journal
  from Settings, and import it back (merge). So you're never stuck.
- **French / English** — language switch in Settings; the whole UI updates instantly.
- **Your data is yours** — plain files in a folder you control, no account, no ads,
  no tracking.

## Where is my data?

Each journal is a subfolder inside `~/Documents/MonJournal/`:

```
MonJournal/
  personal/                    (one folder per journal)
    settings.json              preferences (theme, accent, reminder)
    entries/YYYY-MM-DD.json     one file per day (mood, text, photos)
    images/                     imported photos
  work/
    ...
```

The `entries/*.json` files and the images are **encrypted** (AES-256-GCM). The list
of journals and, for each, the **salt** + the **data key wrapped by the password**
(never the password in clear) live in `journals.json` (app config folder). Opening a
journal derives the key from the password (scrypt) and unwraps the data key.
Changing the password only **re-wraps** that key — the files are untouched.

**Real encryption = a forgotten password is unrecoverable.** `settings.json`
(theme/accent) stays in clear (no personal data).

The encryption/storage logic is isolated in `electron/journal-core.cjs` and tested:
`npm test` (`electron/journal-core.test.cjs`) checks encryption round-trips, wrong
password rejection, password change, export/import and folder move.

## Install

Grab the latest build from the [**Releases**](https://github.com/M-1u/mon-journal/releases/latest) page:

- **Windows** — download `Mon.Journal.Setup.<version>.exe` and run it.
  > ⚠️ The app is not code-signed: Windows may show “Windows protected your PC”.
  > Click **More info → Run anyway**.
- **Linux** — download `Mon Journal-<version>.AppImage`, then:
  ```bash
  chmod +x "Mon Journal-<version>.AppImage"
  ./"Mon Journal-<version>.AppImage"
  ```

## Build from source

```bash
npm install
npm run dev     # Vite dev server + Electron with hot reload
npm test        # headless tests of the core logic (encryption, export/import…)
npm run build   # build the renderer
npm run dist    # build installers (AppImage on Linux, NSIS .exe on Windows via Wine)
```

Dev mode uses an **isolated** config (`.dev-data/` in the project) via the
`MONJOURNAL_CONFIG_DIR` env var, so it never touches your real journals. Set it to a
throwaway path for a disposable test session; the choice is never persisted.

## Stack

- **Electron** — native desktop window
- **React + Vite** — UI
- **TipTap** — visual editor; **marked** + **turndown** — Markdown ⇆ HTML bridge
- Storage: per-journal JSON files + a `journalimg://` protocol for images
- Passwords: salted **scrypt** hashing/derivation (never stored in clear)
- No database, no native modules: robust and transparent.

## License

[MIT](LICENSE)
