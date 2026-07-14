// Small notebook glyph that echoes the app icon, shown inside the green
// gradient ".logo" box in the sidebar and lock screen.
export default function BrandMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* bookmark ribbon (behind the cover top) */}
      <path d="M19.7 3.2 h3.2 v8.2 l-1.6 -1.45 l-1.6 1.45 z" fill="#f0b429" />
      {/* notebook cover */}
      <rect x="8.4" y="5" width="15.4" height="22" rx="3" fill="#fbfdfb" />
      {/* binding dots */}
      <circle cx="11.9" cy="10.5" r="1.05" fill="#3da35d" />
      <circle cx="11.9" cy="16" r="1.05" fill="#3da35d" />
      <circle cx="11.9" cy="21.5" r="1.05" fill="#3da35d" />
      {/* text lines */}
      <rect x="14.6" y="12.6" width="7" height="1.9" rx="0.95" fill="#bfe3cc" />
      <rect x="14.6" y="17.4" width="5.1" height="1.9" rx="0.95" fill="#bfe3cc" />
      {/* mood heart */}
      <path d="M15.6 22.2c-.9-.8.25-2 .9-1.15.65-.85 1.8.35.9 1.15l-.9.85z" fill="#3da35d" />
    </svg>
  );
}
