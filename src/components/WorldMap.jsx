import { useRef, useState } from "react";

const W = 1000;
const H = 500;
const MIN_K = 1;
const MAX_K = 12;

// Zoomable / pannable world map. `paths` are country path strings, `pins` are
// precomputed points { x, y, label, status } in the W×H space.
export default function WorldMap({ paths, fillFor, onCountryClick, pins = [], ariaLabel }) {
  const wrapRef = useRef(null);
  const [t, setT] = useState({ k: 1, x: 0, y: 0 });
  const drag = useRef(null);
  const [hoverPin, setHoverPin] = useState(null);

  // Convert a client point to SVG (pre-transform) coordinates.
  function toSvg(clientX, clientY) {
    const r = wrapRef.current.getBoundingClientRect();
    return [((clientX - r.left) / r.width) * W, ((clientY - r.top) / r.height) * H];
  }

  function onWheel(e) {
    e.preventDefault();
    const [sx, sy] = toSvg(e.clientX, e.clientY);
    const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
    setT((prev) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, prev.k * factor));
      // Keep the point under the cursor fixed: world coord = (s - tx)/k.
      const wx = (sx - prev.x) / prev.k;
      const wy = (sy - prev.y) / prev.k;
      let x = sx - wx * k;
      let y = sy - wy * k;
      return clampT({ k, x, y });
    });
  }

  function clampT({ k, x, y }) {
    // Don't let the map be dragged off its box.
    const minX = W - W * k, minY = H - H * k;
    return { k, x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
  }

  function onPointerDown(e) {
    drag.current = { startX: e.clientX, startY: e.clientY, ox: t.x, oy: t.y, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.startX) / r.width) * W;
    const dy = ((e.clientY - drag.current.startY) / r.height) * H;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
    setT((prev) => clampT({ k: prev.k, x: drag.current.ox + dx, y: drag.current.oy + dy }));
  }
  function onPointerUp(e) {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setTimeout(() => (drag.current = null), 0);
  }
  function handleCountry(alpha2) {
    if (drag.current?.moved) return; // ignore clicks that were actually drags
    onCountryClick?.(alpha2);
  }

  const reset = () => setT({ k: 1, x: 0, y: 0 });
  const zoom = (f) => setT((prev) => clampT({ ...prev, k: Math.min(MAX_K, Math.max(MIN_K, prev.k * f)) }));
  const r = 4 / t.k; // keep pins a constant screen size

  return (
    <div className="map-wrap" ref={wrapRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="world-map"
        role="img"
        aria-label={ariaLabel}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ cursor: drag.current ? "grabbing" : "grab" }}
      >
        <rect x="0" y="0" width={W} height={H} fill="var(--map-sea, #eaf1f6)" />
        <g transform={`translate(${t.x} ${t.y}) scale(${t.k})`}>
          {paths.map((c) => (
            <path
              key={c.id}
              d={c.d}
              fill={fillFor(c.alpha2)}
              stroke="var(--map-stroke, #ffffff)"
              strokeWidth={0.5 / t.k}
              className={"country" + (c.alpha2 ? "" : " inert")}
              onClick={() => handleCountry(c.alpha2)}
            />
          ))}
          {pins.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.status === "wishlist" ? r * 0.9 : r}
              className={"map-pin " + (p.status === "wishlist" ? "wish" : "visited")}
              strokeWidth={1.2 / t.k}
              onMouseEnter={() => setHoverPin(p.label)}
              onMouseLeave={() => setHoverPin(null)}
            />
          ))}
        </g>
      </svg>
      <div className="map-controls">
        <button onClick={() => zoom(1.4)} aria-label="Zoom +">+</button>
        <button onClick={() => zoom(1 / 1.4)} aria-label="Zoom −">−</button>
        <button onClick={reset} aria-label="Reset" title="Réinitialiser">⤾</button>
      </div>
      {hoverPin ? <div className="map-pin-label">{hoverPin}</div> : null}
    </div>
  );
}
