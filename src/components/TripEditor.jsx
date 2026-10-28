import { useState } from "react";
import { searchCities } from "../lib/cities.js";
import { countryName } from "../lib/geo.js";
import { t } from "../lib/i18n.js";
import { IconChevronLeft, IconCheck, IconTrash, IconClose, IconPlus, IconMapPin } from "./Icons.jsx";

export const TRANSPORTS = [
  { id: "plane", emoji: "✈️" },
  { id: "train", emoji: "🚆" },
  { id: "car", emoji: "🚗" },
  { id: "bus", emoji: "🚌" },
  { id: "boat", emoji: "⛴️" },
  { id: "bike", emoji: "🚲" },
  { id: "foot", emoji: "🚶" },
];

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

export default function TripEditor({ trip, lang, onSave, onDelete, onCancel }) {
  const isNew = !trip;
  const [name, setName] = useState(trip?.name || "");
  const [startDate, setStartDate] = useState(trip?.startDate || "");
  const [endDate, setEndDate] = useState(trip?.endDate || "");
  const [transports, setTransports] = useState(trip?.transports || []);
  const [cities, setCities] = useState(trip?.cities || []);
  const [notes, setNotes] = useState(trip?.notes || "");

  const [q, setQ] = useState("");
  const results = q.trim().length >= 2 ? searchCities(q, 8) : [];

  function toggleTransport(id) {
    setTransports((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }
  function addCity(c) {
    setCities((cur) => [...cur, { id: uid(), name: c.name, country: c.country, lat: c.lat, lon: c.lon, arrive: "", depart: "", note: "" }]);
    setQ("");
  }
  function addFreeCity() {
    const n = q.trim();
    if (!n) return;
    setCities((cur) => [...cur, { id: uid(), name: n, country: "", lat: null, lon: null, arrive: "", depart: "", note: "" }]);
    setQ("");
  }
  function updateCity(id, patch) {
    setCities((cur) => cur.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function removeCity(id) {
    setCities((cur) => cur.filter((c) => c.id !== id));
  }
  function move(id, dir) {
    setCities((cur) => {
      const i = cur.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function save() {
    onSave({
      id: trip?.id || uid(),
      name: name.trim() || t("trip.untitled"),
      startDate,
      endDate,
      transports,
      cities,
      notes,
    });
  }
  const canSave = name.trim() || cities.length;

  return (
    <div className="view trip-editor">
      <div className="ee-head">
        <button className="btn ghost" onClick={onCancel}>
          <IconChevronLeft width={16} height={16} /> {t("common.back")}
        </button>
        <div className="ee-title">{isNew ? t("trip.new") : t("trip.edit")}</div>
        <div style={{ flex: 1 }} />
        {!isNew && (
          <button className="btn danger" onClick={() => onDelete(trip)}>
            <IconTrash width={16} height={16} />
          </button>
        )}
      </div>

      <input
        className="trip-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("trip.namePlaceholder")}
        aria-label={t("trip.name")}
      />

      <div className="trip-dates">
        <label>{t("trip.start")}<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
        <label>{t("trip.end")}<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
      </div>

      <p className="section-label">{t("trip.transports")}</p>
      <div className="transport-row">
        {TRANSPORTS.map((tr) => (
          <button
            key={tr.id}
            type="button"
            className={"transport-btn" + (transports.includes(tr.id) ? " on" : "")}
            onClick={() => toggleTransport(tr.id)}
            title={t("transport." + tr.id)}
            aria-pressed={transports.includes(tr.id)}
            aria-label={t("transport." + tr.id)}
          >
            {tr.emoji}
          </button>
        ))}
      </div>

      <p className="section-label">{t("trip.cities")}</p>
      <div className="city-search">
        <IconMapPin width={16} height={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("trip.citySearch")}
          onKeyDown={(e) => { if (e.key === "Enter" && !results.length) { e.preventDefault(); addFreeCity(); } }}
        />
        {q.trim().length >= 2 && (
          <div className="city-results">
            {results.map((c, i) => (
              <button key={i} type="button" className="city-result" onClick={() => addCity(c)}>
                <span>{c.name}</span>
                <span className="cr-country">{countryName(c.country, lang)}</span>
              </button>
            ))}
            <button type="button" className="city-result free" onClick={addFreeCity}>
              <IconPlus width={13} height={13} /> {t("trip.addFree", { name: q.trim() })}
            </button>
          </div>
        )}
      </div>

      {cities.length > 0 && (
        <div className="trip-stages">
          {cities.map((c, i) => (
            <div className="trip-stage" key={c.id}>
              <div className="ts-order">
                <button onClick={() => move(c.id, -1)} disabled={i === 0} aria-label="▲">▲</button>
                <button onClick={() => move(c.id, 1)} disabled={i === cities.length - 1} aria-label="▼">▼</button>
              </div>
              <div className="ts-body">
                <div className="ts-head">
                  <span className="ts-name">
                    <IconMapPin width={13} height={13} /> {c.name}
                    {c.country ? <span className="ts-country"> · {countryName(c.country, lang)}</span> : null}
                    {c.lat == null ? <span className="ts-nopin" title={t("trip.noPin")}> ⚠</span> : null}
                  </span>
                  <button className="ts-rm" onClick={() => removeCity(c.id)} aria-label={t("common.remove")}>
                    <IconClose width={13} height={13} />
                  </button>
                </div>
                <div className="ts-dates">
                  <label>{t("trip.arrive")}<input type="date" value={c.arrive} onChange={(e) => updateCity(c.id, { arrive: e.target.value })} /></label>
                  <label>{t("trip.depart")}<input type="date" value={c.depart} onChange={(e) => updateCity(c.id, { depart: e.target.value })} /></label>
                </div>
                <input
                  className="ts-note"
                  value={c.note}
                  onChange={(e) => updateCity(c.id, { note: e.target.value })}
                  placeholder={t("trip.cityNote")}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="section-label" style={{ marginTop: 20 }}>{t("trip.notes")}</p>
      <textarea
        className="trip-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t("trip.notesPlaceholder")}
        rows={5}
      />

      <div className="ee-actions">
        <div style={{ flex: 1 }} />
        <button className="btn ghost" onClick={onCancel}>{t("common.cancel")}</button>
        <button className="btn primary" onClick={save} disabled={!canSave}>
          <IconCheck width={16} height={16} /> {t("common.save")}
        </button>
      </div>
    </div>
  );
}
