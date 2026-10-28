// Dev-only: build a trimmed, offline cities dataset for the travel map.
// Keeps cities >= 50k population plus all capitals (PPLC/PPLA). Output is a
// compact array {n:name, c:countryAlpha2, y:lat, x:lon, p:pop}.
const all = require("all-the-cities");
const fs = require("node:fs");
const path = require("node:path");

const isCapital = (fc) => fc === "PPLC";
const r2 = (n) => Math.round(n * 100) / 100;

const rows = [];
for (const c of all) {
  if (c.population >= 30000 || isCapital(c.featureCode)) {
    const [lon, lat] = c.loc.coordinates;
    rows.push({ n: c.name, c: c.country, y: r2(lat), x: r2(lon), p: c.population || 0 });
  }
}
rows.sort((a, b) => b.p - a.p);
const out = path.join(__dirname, "..", "src", "data", "cities.json");
fs.writeFileSync(out, JSON.stringify(rows));
console.log("villes retenues:", rows.length, "| taille:", (fs.statSync(out).size / 1024).toFixed(0) + " Ko");
