// Offline world map helpers. Country shapes come from the bundled world-atlas
// TopoJSON (no network); names are localized with i18n-iso-countries. We project
// with a plain equirectangular mapping (lon/lat → x/y), which needs no d3.
import topo from "world-atlas/countries-110m.json";
import { feature } from "topojson-client";
import countries from "i18n-iso-countries";
import fr from "i18n-iso-countries/langs/fr.json";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(fr);
countries.registerLocale(en);

// Rough count of UN members + widely recognized states, for the "% of the
// world" figure. Kept as a constant so the number is stable and explainable.
export const WORLD_COUNTRIES = 195;

export function alpha2OfNumeric(id) {
  return countries.numericToAlpha2(String(id)) || null;
}

export function countryName(alpha2, lang) {
  if (!alpha2) return "";
  return countries.getName(alpha2, lang === "en" ? "en" : "fr") || alpha2;
}

// All countries sorted by localized name, for pickers/lists.
export function allCountries(lang) {
  const names = countries.getNames(lang === "en" ? "en" : "fr");
  return Object.entries(names)
    .map(([alpha2, name]) => ({ alpha2, name }))
    .sort((a, b) => a.name.localeCompare(b.name, lang === "en" ? "en" : "fr"));
}

// Build SVG path data for every country, projected into a WIDTH×HEIGHT box.
function proj(W, H) {
  return ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
}

function ringToPath(ring, p) {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = p(ring[i]);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d + "Z";
}

function geometryToPath(geom, p) {
  if (!geom) return "";
  if (geom.type === "Polygon") {
    return geom.coordinates.map((r) => ringToPath(r, p)).join("");
  }
  if (geom.type === "MultiPolygon") {
    return geom.coordinates.map((poly) => poly.map((r) => ringToPath(r, p)).join("")).join("");
  }
  return "";
}

let cache = null;
// Returns [{ id(numeric), alpha2, d }] for the given box. Memoized per box size.
export function buildCountryPaths(W, H) {
  if (cache && cache.W === W && cache.H === H) return cache.list;
  const fc = feature(topo, topo.objects.countries);
  const p = proj(W, H);
  const list = [];
  for (const f of fc.features) {
    const d = geometryToPath(f.geometry, p);
    if (!d) continue;
    list.push({ id: String(f.id), alpha2: alpha2OfNumeric(f.id), d });
  }
  cache = { W, H, list };
  return list;
}
