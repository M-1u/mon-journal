// Headless test of the real journal-core logic: Daylio-style entries (several
// per day) + activities, all under password-gated encryption. Also checks
// wrong-password rejection and password change.
// Run: node electron/journal-core.test.cjs   (or: npm test)
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mj-core-test-"));
process.env.MONJOURNAL_CONFIG_DIR = tmp;
const core = require("./journal-core.cjs");
core.init({ defaultConfigDir: tmp, defaultJournalsBase: path.join(tmp, "journals") });

let pass = 0;
const ok = (label, cond) => {
  assert.ok(cond, "FAIL: " + label);
  pass++;
  console.log("  ✓ " + label);
};

console.log("Journal-core tests (entries/day + activities + encryption)\n");

// 1. Create an encrypted journal
const created = core.createJournal("Perso", "secret123");
ok("createJournal returns id+name", created.id && created.name === "Perso");
const j = JSON.parse(fs.readFileSync(path.join(tmp, "journals.json"), "utf8")).journals[0];
ok("registry stores wrappedDek, no plaintext password", j.wrappedDek && !j.hash);

// 2. Several entries the same day
const e1 = core.upsertEntry({ date: "2026-07-12", time: "09:00", mood: 5, activities: ["sport", "amis"], text: "Matin sportif" });
const e2 = core.upsertEntry({ date: "2026-07-12", time: "21:30", mood: 3, activities: ["film"], text: "Soirée film secrète" });
ok("two entries get distinct ids", e1.id && e2.id && e1.id !== e2.id);
const day = core.getDay("2026-07-12");
ok("getDay returns 2 entries", day.length === 2);
ok("entries sorted by time (09:00 first)", day[0].time === "09:00" && day[1].time === "21:30");

// 3. Encryption on disk
const file = fs.readFileSync(path.join(j.path, "entries", "2026-07-12.json"), "utf8");
const raw = JSON.parse(file);
ok("day file is an encrypted envelope", raw.enc === 1 && raw.iv && raw.ct);
ok("plaintext NOT on disk", !file.includes("sportif") && !file.includes("secrète") && !file.includes("sport"));

// 4. Activities: defaults, then customization (encrypted)
ok("default activities available", core.getActivities().some((a) => a.id === "sport"));
core.setActivities([...core.getActivities(), { id: "yoga", emoji: "🧘", name: "Yoga" }]);
const actFile = fs.readFileSync(path.join(j.path, "activities.json"), "utf8");
ok("activities file encrypted (no 'Yoga' in plaintext)", !actFile.includes("Yoga") && JSON.parse(actFile).enc === 1);

// 5. Edit an entry (same id) updates in place
core.upsertEntry({ id: e1.id, date: "2026-07-12", time: "09:15", mood: 4, activities: ["sport"], text: "Matin sportif (édité)" });
ok("editing keeps entry count at 2", core.getDay("2026-07-12").length === 2);

// 6. Lock → wrong password → right password → data + activities intact
core.lockJournal();
ok("wrong password rejected", core.unlockJournal(created.id, "WRONG") === null);
ok("correct password unlocks", !!core.unlockJournal(created.id, "secret123"));
const list = core.listEntries();
ok("listEntries returns 2 decrypted entries", list.length === 2);
ok("edited text decrypts correctly", list.some((e) => e.text === "Matin sportif (édité)"));
ok("custom activity persisted", core.getActivities().some((a) => a.id === "yoga"));

// 6b. Goals: global list + validation in an entry
ok("goals default empty", core.getGoals().length === 0);
core.setGoals([
  { id: "g1", text: "Courir 10km", term: "short", createdAt: "x" },
  { id: "g2", text: "Apprendre le piano", term: "long", createdAt: "x" },
]);
const goalsFileTxt = fs.readFileSync(path.join(j.path, "goals.json"), "utf8");
ok("goals file encrypted (no 'piano' plaintext)", !goalsFileTxt.includes("piano") && JSON.parse(goalsFileTxt).enc === 1);
core.upsertEntry({ id: e1.id, date: "2026-07-12", time: "09:15", mood: 4, activities: ["sport"], goals: ["g1"], text: "Matin sportif (édité)" });
const g1entry = core.getDay("2026-07-12").find((e) => e.id === e1.id);
ok("entry stores validated goal id", g1entry.goals.includes("g1"));

// 7. Delete one entry
core.deleteEntry("2026-07-12", e2.id);
ok("deleteEntry removes one (1 left)", core.getDay("2026-07-12").length === 1);

// 8. Image encryption round-trip
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.from("secret-image")]);
const name = core.storeImageBuffer(png, ".png");
const onDisk = fs.readFileSync(path.join(j.path, "images", name));
ok("image encrypted on disk", !onDisk.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])));
ok("image decrypts to original", core.readImageBuffer(name).equals(png));

// 9. Password change: old fails, new works, data intact
ok("changePassword ok", core.changePassword("secret123", "newpass456").ok === true);
core.lockJournal();
ok("old password no longer works", core.unlockJournal(created.id, "secret123") === null);
ok("new password works", !!core.unlockJournal(created.id, "newpass456"));
ok("data intact after password change", core.getDay("2026-07-12").length === 1);

// 10. Export / import round-trip into a fresh journal
// Attach the stored image to an entry so it is included in the export.
core.upsertEntry({ id: e1.id, date: "2026-07-12", time: "09:15", mood: 4, activities: ["sport"], goals: ["g1"], text: "Matin sportif (édité)", images: [{ name, caption: "photo test" }] });
const exported = core.exportData();
ok("export produced entries + images", exported.entries.length >= 1 && Object.keys(exported.images).length >= 1);
ok("export is decrypted/readable (contains goal text)", JSON.stringify(exported).includes("Matin sportif"));

const j2 = core.createJournal("Backup", "pw12345"); // becomes active
ok("second journal starts empty", core.listEntries().length === 0);
const imp = core.importData(exported);
ok("import ok", imp.ok === true && imp.entries === exported.entries.length);
ok("imported entries match count", core.listEntries().length === exported.entries.length);
ok("imported text is intact", core.listEntries().some((e) => e.text.includes("Matin sportif")));
ok("imported activities merged (yoga present)", core.getActivities().some((a) => a.id === "yoga"));
ok("imported goals merged", core.getGoals().length === exported.goals.length);
const impImg = core.readImageBuffer(core.listEntries().find((e) => e.images.length)?.images[0].name);
ok("imported image decrypts (round-trips)", !!impImg && impImg.length > 0);

console.log(`\n${pass} checks passed.`);
fs.rmSync(tmp, { recursive: true, force: true });
console.log("(temp dir cleaned)");
