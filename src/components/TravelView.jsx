import { useMemo, useState } from "react";
import { buildCountryPaths, countryName, allCountries, WORLD_COUNTRIES } from "../lib/geo.js";
import { t } from "../lib/i18n.js";
import { IconClose, IconPlus, IconMapPin } from "./Icons.jsx";

const MAP_W = 1000;
const MAP_H = 500;

export default function TravelView({ travel, lang, onCycleCountry, onRemoveCountry, onAddCity, onRemoveCity }) {
  const countries = travel?.countries || {};
  const cities = travel?.cities || [];
  const paths = useMemo(() => buildCountryPaths(MAP_W, MAP_H), []);
  const countryOptions = useMemo(() => allCountries(lang), [lang]);

  const [hover, setHover] = useState(null);
  const [cityName, setCityName] = useState("");
  const [cityCountry, setCityCountry] = useState("");
  const [cityStatus, setCityStatus] = useState("visited");

  const visited = Object.entries(countries).filter(([, s]) => s === "visited").map(([a]) => a);
  const wishlist = Object.entries(countries).filter(([, s]) => s === "wishlist").map(([a]) => a);
  const pct = Math.round((visited.length / WORLD_COUNTRIES) * 100);

  const cycle = (alpha2) => onCycleCountry(alpha2);
  const setCountryStatus = (alpha2, status) => { if (!status) onRemoveCountry(alpha2); };

  function addCity(e) {
    e.preventDefault();
    const name = cityName.trim();
    if (!name) return;
    onAddCity({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name,
      country: cityCountry,
      status: cityStatus,
    });
    setCityName("");
  }
  const removeCity = (id) => onRemoveCity(id);

  const fillFor = (alpha2) => {
    const s = countries[alpha2];
    if (s === "visited") return "var(--accent)";
    if (s === "wishlist") return "#f0b429";
    return "var(--map-land, #d7dee6)";
  };

  return (
    <div className="view">
      <h1 className="page-title">{t("travel.title")}</h1>
      <p className="page-sub">{t("travel.sub")}</p>

      <div className="stat-grid">
        <div className="card stat-tile"><div className="k">🌍 {t("travel.visited")}</div><div className="v">{visited.length}</div></div>
        <div className="card stat-tile"><div className="k">📊 {t("travel.worldPct")}</div><div className="v">{pct}<small>%</small></div></div>
        <div className="card stat-tile"><div className="k">✨ {t("travel.wish")}</div><div className="v">{wishlist.length}</div></div>
        <div className="card stat-tile"><div className="k">📍 {t("travel.cities")}</div><div className="v">{cities.filter((c) => c.status === "visited").length}</div></div>
      </div>

      <div className="card panel">
        <div className="map-head">
          <h3 style={{ margin: 0 }}>{t("travel.map")}</h3>
          <div className="map-legend">
            <span><i style={{ background: "var(--accent)" }} /> {t("travel.legendVisited")}</span>
            <span><i style={{ background: "#f0b429" }} /> {t("travel.legendWish")}</span>
            <span className="map-hint">{hover ? hover : t("travel.mapHint")}</span>
          </div>
        </div>
        <div className="map-wrap">
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="world-map" role="img" aria-label={t("travel.map")}>
            <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="var(--map-sea, #eaf1f6)" />
            {paths.map((c) => (
              <path
                key={c.id}
                d={c.d}
                fill={fillFor(c.alpha2)}
                stroke="var(--map-stroke, #ffffff)"
                strokeWidth="0.5"
                className={"country" + (c.alpha2 ? "" : " inert")}
                onClick={() => cycle(c.alpha2)}
                onMouseEnter={() => c.alpha2 && setHover(countryName(c.alpha2, lang) + " · " + (countries[c.alpha2] === "visited" ? t("travel.legendVisited") : countries[c.alpha2] === "wishlist" ? t("travel.legendWish") : t("travel.notYet")))}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </svg>
        </div>
        <p className="map-foot">{t("travel.mapCycle")}</p>
      </div>

      {(visited.length > 0 || wishlist.length > 0) && (
        <div className="card panel">
          <h3>{t("travel.countriesList")}</h3>
          {visited.length > 0 && (
            <div className="country-group">
              <div className="cg-label">🌍 {t("travel.visited")} ({visited.length})</div>
              <div className="country-chips">
                {visited.map((a) => (
                  <span className="country-chip visited" key={a}>
                    {countryName(a, lang)}
                    <button onClick={() => setCountryStatus(a, undefined)} aria-label={t("common.remove")}><IconClose width={11} height={11} /></button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {wishlist.length > 0 && (
            <div className="country-group">
              <div className="cg-label">✨ {t("travel.wish")} ({wishlist.length})</div>
              <div className="country-chips">
                {wishlist.map((a) => (
                  <span className="country-chip wish" key={a}>
                    {countryName(a, lang)}
                    <button onClick={() => setCountryStatus(a, undefined)} aria-label={t("common.remove")}><IconClose width={11} height={11} /></button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card panel">
        <h3>{t("travel.citiesTitle")}</h3>
        <form className="city-add" onSubmit={addCity}>
          <input
            className="city-name"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            placeholder={t("travel.cityPlaceholder")}
            aria-label={t("travel.cityName")}
          />
          <select value={cityCountry} onChange={(e) => setCityCountry(e.target.value)} aria-label={t("travel.country")}>
            <option value="">{t("travel.pickCountry")}</option>
            {countryOptions.map((c) => (
              <option key={c.alpha2} value={c.alpha2}>{c.name}</option>
            ))}
          </select>
          <div className="seg">
            <button type="button" className={cityStatus === "visited" ? "on" : ""} onClick={() => setCityStatus("visited")}>🌍 {t("travel.visitedShort")}</button>
            <button type="button" className={cityStatus === "wishlist" ? "on" : ""} onClick={() => setCityStatus("wishlist")}>✨ {t("travel.wishShort")}</button>
          </div>
          <button type="submit" className="btn primary" disabled={!cityName.trim()}>
            <IconPlus width={16} height={16} /> {t("common.add")}
          </button>
        </form>

        {cities.length === 0 ? (
          <p style={{ color: "var(--ink-faint)", fontSize: 13, marginTop: 10 }}>{t("travel.noCities")}</p>
        ) : (
          <div className="city-list">
            {cities.map((c) => (
              <span className={"city-chip " + c.status} key={c.id}>
                <IconMapPin width={13} height={13} />
                {c.name}{c.country ? <span className="city-country"> · {countryName(c.country, lang)}</span> : null}
                {c.status === "wishlist" ? " ✨" : ""}
                <button onClick={() => removeCity(c.id)} aria-label={t("common.remove")}><IconClose width={11} height={11} /></button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
