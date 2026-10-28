import { useMemo, useState } from "react";
import { buildCountryPaths, countryName, project, WORLD_COUNTRIES } from "../lib/geo.js";
import { t } from "../lib/i18n.js";
import { IconPlus, IconMapPin, IconChevronRight } from "./Icons.jsx";
import WorldMap from "./WorldMap.jsx";
import TripEditor, { TRANSPORTS } from "./TripEditor.jsx";

const MAP_W = 1000;
const MAP_H = 500;
const transportEmoji = Object.fromEntries(TRANSPORTS.map((x) => [x.id, x.emoji]));

export default function TravelView({ travel, lang, entries, onCycleCountry, onRemoveCountry, onSaveTrip, onDeleteTrip, onOpenDay }) {
  const countries = travel?.countries || {};
  const trips = travel?.trips || [];
  const standalone = travel?.cities || [];
  const paths = useMemo(() => buildCountryPaths(MAP_W, MAP_H), []);

  const [editing, setEditing] = useState(null); // null | 'new' | trip

  // Countries that count as visited = manual "visited" + any country in a trip.
  const effectiveCountries = useMemo(() => {
    const out = { ...countries };
    const markVisited = (cc) => { if (cc && out[cc] !== "visited") out[cc] = "visited"; };
    for (const tr of trips) for (const c of tr.cities || []) markVisited(c.country);
    for (const c of standalone) if (c.status === "visited") markVisited(c.country);
    return out;
  }, [countries, trips, standalone]);

  const visited = Object.entries(effectiveCountries).filter(([, s]) => s === "visited").map(([a]) => a);
  const wishlist = Object.entries(effectiveCountries).filter(([, s]) => s === "wishlist").map(([a]) => a);
  const pct = Math.round((visited.length / WORLD_COUNTRIES) * 100);

  // Map pins: every located city from trips + standalone.
  const pins = useMemo(() => {
    const out = [];
    const seen = new Set();
    const push = (c, status) => {
      if (c.lat == null || c.lon == null) return;
      const key = c.lat + "," + c.lon;
      if (seen.has(key)) return;
      seen.add(key);
      const [x, y] = project(c.lon, c.lat, MAP_W, MAP_H);
      out.push({ x, y, label: c.name, status });
    };
    for (const tr of trips) for (const c of tr.cities || []) push(c, "visited");
    for (const c of standalone) push(c, c.status === "wishlist" ? "wishlist" : "visited");
    return out;
  }, [trips, standalone]);

  const cityCount = pins.length;

  const fillFor = (alpha2) => {
    const s = effectiveCountries[alpha2];
    if (s === "visited") return "var(--accent)";
    if (s === "wishlist") return "#f0b429";
    return "var(--map-land, #d7dee6)";
  };

  if (editing) {
    return (
      <TripEditor
        trip={editing === "new" ? null : editing}
        lang={lang}
        onSave={(trip) => { onSaveTrip(trip); setEditing(null); }}
        onDelete={(trip) => { onDeleteTrip(trip.id); setEditing(null); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  const tripEntryCount = (id) => entries.filter((e) => e.tripId === id).length;

  return (
    <div className="view">
      <h1 className="page-title">{t("travel.title")}</h1>
      <p className="page-sub">{t("travel.sub")}</p>

      <div className="stat-grid">
        <div className="card stat-tile"><div className="k">🧳 {t("travel.trips")}</div><div className="v">{trips.length}</div></div>
        <div className="card stat-tile"><div className="k">🌍 {t("travel.visited")}</div><div className="v">{visited.length}</div></div>
        <div className="card stat-tile"><div className="k">📊 {t("travel.worldPct")}</div><div className="v">{pct}<small>%</small></div></div>
        <div className="card stat-tile"><div className="k">📍 {t("travel.cities")}</div><div className="v">{cityCount}</div></div>
      </div>

      <div className="card panel">
        <div className="map-head">
          <h3 style={{ margin: 0 }}>{t("travel.map")}</h3>
          <div className="map-legend">
            <span><i style={{ background: "var(--accent)" }} /> {t("travel.legendVisited")}</span>
            <span><i style={{ background: "#f0b429" }} /> {t("travel.legendWish")}</span>
            <span><i className="pin-dot" /> {t("travel.legendCity")}</span>
          </div>
        </div>
        <WorldMap paths={paths} fillFor={fillFor} onCountryClick={onCycleCountry} pins={pins} ariaLabel={t("travel.map")} />
        <p className="map-foot">{t("travel.mapHelp")}</p>
      </div>

      <div className="card panel">
        <div className="map-head">
          <h3 style={{ margin: 0 }}>{t("travel.myTrips")}</h3>
          <button className="btn primary" onClick={() => setEditing("new")}>
            <IconPlus width={16} height={16} /> {t("trip.new")}
          </button>
        </div>
        {trips.length === 0 ? (
          <p style={{ color: "var(--ink-faint)", fontSize: 13, marginTop: 8 }}>{t("travel.noTrips")}</p>
        ) : (
          <div className="trip-list">
            {trips.slice().sort((a, b) => (b.startDate || "").localeCompare(a.startDate || "")).map((tr) => (
              <button className="trip-card" key={tr.id} onClick={() => setEditing(tr)}>
                <div className="tc-body">
                  <div className="tc-name">{tr.name || t("trip.untitled")}</div>
                  <div className="tc-meta">
                    {tr.startDate ? <span>{tr.startDate}{tr.endDate ? " → " + tr.endDate : ""}</span> : null}
                    {tr.cities?.length ? <span>📍 {tr.cities.length}</span> : null}
                    {tr.transports?.map((x) => <span key={x}>{transportEmoji[x]}</span>)}
                    {tripEntryCount(tr.id) ? <span>📝 {tripEntryCount(tr.id)}</span> : null}
                  </div>
                  {tr.cities?.length ? (
                    <div className="tc-cities">{tr.cities.map((c) => c.name).join(" · ")}</div>
                  ) : null}
                </div>
                <IconChevronRight width={18} height={18} />
              </button>
            ))}
          </div>
        )}
      </div>

      {(wishlist.length > 0) && (
        <div className="card panel">
          <h3>{t("travel.wishlist")}</h3>
          <div className="country-chips">
            {wishlist.map((a) => (
              <span className="country-chip wish" key={a}>
                {countryName(a, lang)}
                <button onClick={() => onRemoveCountry(a)} aria-label={t("common.remove")}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
