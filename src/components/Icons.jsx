// Minimal stroke icon set (feather-style), sized via the `.ico` class or props.
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const IconToday = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

export const IconCalendar = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </svg>
);

export const IconTimeline = (p) => (
  <svg {...base} {...p}>
    <path d="M8 5h13M8 12h13M8 19h13" />
    <circle cx="3.5" cy="5" r="1.4" />
    <circle cx="3.5" cy="12" r="1.4" />
    <circle cx="3.5" cy="19" r="1.4" />
  </svg>
);

export const IconStats = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

export const IconGallery = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2.5" />
    <circle cx="8.5" cy="8.5" r="1.6" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

export const IconSettings = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.31.22.65.22 1z" />
  </svg>
);

export const IconChevronLeft = (p) => (
  <svg {...base} {...p}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
export const IconChevronRight = (p) => (
  <svg {...base} {...p}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);
export const IconPlus = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconClose = (p) => (
  <svg {...base} {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
export const IconCheck = (p) => (
  <svg {...base} {...p} width={p.width || 16} height={p.height || 16}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
export const IconEye = (p) => (
  <svg {...base} {...p}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const IconEdit = (p) => (
  <svg {...base} {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);
export const IconTrash = (p) => (
  <svg {...base} {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
);
export const IconFolder = (p) => (
  <svg {...base} {...p}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
export const IconImage = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2.5" />
    <circle cx="8.5" cy="8.5" r="1.6" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);
export const IconFlame = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 .5-2S8 11 8 13a4 4 0 0 0 8 0c0-5-4-11-4-11z" />
  </svg>
);
export const IconTarget = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" />
  </svg>
);

// --- Markdown toolbar icons ---
export const IconBold = (p) => (
  <svg {...base} {...p}>
    <path d="M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z" />
  </svg>
);
export const IconItalic = (p) => (
  <svg {...base} {...p}>
    <path d="M19 4h-9M14 20H5M15 4L9 20" />
  </svg>
);
export const IconHeading = (p) => (
  <svg {...base} {...p}>
    <path d="M6 4v16M18 4v16M6 12h12" />
  </svg>
);
export const IconList = (p) => (
  <svg {...base} {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1.3" />
    <circle cx="4.5" cy="12" r="1.3" />
    <circle cx="4.5" cy="18" r="1.3" />
  </svg>
);
export const IconListOrdered = (p) => (
  <svg {...base} {...p}>
    <path d="M10 6h11M10 12h11M10 18h11M4 4v4M3 8h2M3 16h1.5a1 1 0 0 1 0 2H3l2 2H3" />
  </svg>
);
export const IconQuote = (p) => (
  <svg {...base} {...p}>
    <path d="M7 7H4v6h3l-1 4M17 7h-3v6h3l-1 4" />
  </svg>
);
export const IconLink = (p) => (
  <svg {...base} {...p}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.4" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.4" />
  </svg>
);
export const IconCode = (p) => (
  <svg {...base} {...p}>
    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
  </svg>
);
export const IconCheckSquare = (p) => (
  <svg {...base} {...p}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
