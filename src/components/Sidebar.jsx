import {
  IconToday,
  IconCalendar,
  IconTimeline,
  IconStats,
  IconGallery,
  IconSettings,
  IconTarget,
} from "./Icons.jsx";
import { t } from "../lib/i18n.js";
import BrandMark from "./BrandMark.jsx";

const NAV = [
  { id: "today", key: "nav.today", Icon: IconToday },
  { id: "calendar", key: "nav.calendar", Icon: IconCalendar },
  { id: "timeline", key: "nav.timeline", Icon: IconTimeline },
  { id: "goals", key: "nav.goals", Icon: IconTarget },
  { id: "stats", key: "nav.stats", Icon: IconStats },
  { id: "gallery", key: "nav.gallery", Icon: IconGallery },
  { id: "settings", key: "nav.settings", Icon: IconSettings },
];

export default function Sidebar({ view, onNavigate, journalName }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="logo"><BrandMark size={22} /></span>
        <span>{journalName || t("app.name")}</span>
      </div>
      {NAV.map(({ id, key, Icon }) => (
        <button
          key={id}
          className={"nav-item" + (view === id ? " active" : "")}
          onClick={() => onNavigate(id)}
        >
          <Icon className="ico" />
          {t(key)}
        </button>
      ))}
      <div className="spacer" />
      <div style={{ padding: "8px 10px", fontSize: 11.5, color: "var(--ink-faint)" }}>
        {t("sidebar.footer")}
      </div>
    </aside>
  );
}
