import React, { useRef } from "react";
import { Move } from "lucide-react";
import { useContent } from "../content/ContentProvider";
export default function DraggableModule({ id, label, children }) {
  const c = useContent();
  const ref = useRef(null),
    drag = useRef(null);
  const key = `modules.${id}`;
  const current = c.elementStyles[key] || {};
  const snap = (v) => Math.max(-160, Math.min(160, Math.round(v / 8) * 8));
  const apply = (x, y) =>
    c.replace({
      ...c.content,
      elementStyles: {
        ...c.elementStyles,
        [key]: { ...current, offsetX: snap(x), offsetY: snap(y) },
      },
    });
  const end = (cancel = false) => {
    if (!drag.current) return;
    const point = drag.current;
    drag.current = null;
    document.documentElement.classList.remove("module-dragging");
    if (cancel)
      ref.current.style.translate = `${current.offsetX || 0}px ${current.offsetY || 0}px`;
    else apply(point.nextX, point.nextY);
  };
  return (
    <div
      ref={ref}
      className={`draggable-module ${c.editing ? "drag-enabled" : ""}`}
      style={c.styleFor(key)}
    >
      {c.isAdmin && c.editing && (
        <button
          className="module-drag-handle"
          aria-label={`拖动${label}模块（8px网格）`}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            c.setSelected(key);
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              baseX: current.offsetX || 0,
              baseY: current.offsetY || 0,
              nextX: current.offsetX || 0,
              nextY: current.offsetY || 0,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            document.documentElement.classList.add("module-dragging");
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const d = drag.current;
            d.nextX = snap(d.baseX + e.clientX - d.x);
            d.nextY = snap(d.baseY + e.clientY - d.y);
            ref.current.style.translate = `${d.nextX}px ${d.nextY}px`;
          }}
          onPointerUp={() => end()}
          onPointerCancel={() => end(true)}
          onKeyDown={(e) => {
            const delta = {
              ArrowLeft: [-8, 0],
              ArrowRight: [8, 0],
              ArrowUp: [0, -8],
              ArrowDown: [0, 8],
            }[e.key];
            if (delta) {
              e.preventDefault();
              apply(
                (current.offsetX || 0) + delta[0],
                (current.offsetY || 0) + delta[1],
              );
            }
            if (e.key === "Escape") end(true);
          }}
        >
          <Move size={14} />
          {label} · 8px 网格
        </button>
      )}
      {children}
    </div>
  );
}
