"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ShapeType, ShapeDragPayload } from "@/types/canvas";
import { SHAPE_SIZES } from "@/types/canvas";

const DRAG_TYPE = "application/ghost-shape";

interface ShapeEntry {
  type: ShapeType;
  label: string;
  Icon: LucideIcon;
}

const SHAPES: ShapeEntry[] = [
  { type: "rectangle", label: "Rectangle", Icon: RectangleHorizontal },
  { type: "diamond",   label: "Diamond",   Icon: Diamond },
  { type: "circle",    label: "Circle",    Icon: Circle },
  { type: "pill",      label: "Pill",      Icon: Pill },
  { type: "cylinder",  label: "Cylinder",  Icon: Cylinder },
  { type: "hexagon",   label: "Hexagon",   Icon: Hexagon },
];

export const SHAPE_DRAG_TYPE = DRAG_TYPE;

type DragState = { shape: ShapeType; x: number; y: number } | null;

const HEX_POINTS = (() => {
  const cx = 50, cy = 50, r = 47;
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
})();

function ShapePreview({ shape, x, y }: { shape: ShapeType; x: number; y: number }) {
  const { width, height } = SHAPE_SIZES[shape];
  const stroke = "var(--accent-primary)";

  const vars = {
    "--preview-x": `${x - width / 2}px`,
    "--preview-y": `${y - height / 2}px`,
    "--preview-w": `${width}px`,
    "--preview-h": `${height}px`,
  } as React.CSSProperties;

  let shapeEl: React.ReactNode;
  switch (shape) {
    case "rectangle":
      shapeEl = <div className="drag-preview-shape rounded-xl border border-accent-primary bg-surface" />;
      break;
    case "pill":
      shapeEl = <div className="drag-preview-shape rounded-full border border-accent-primary bg-surface" />;
      break;
    case "circle":
      shapeEl = <div className="drag-preview-shape rounded-full border border-accent-primary bg-surface" />;
      break;
    case "diamond":
      shapeEl = (
        <svg className="drag-preview-shape" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,2 98,50 50,98 2,50" fill="var(--bg-surface)" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      );
      break;
    case "hexagon":
      shapeEl = (
        <svg className="drag-preview-shape" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points={HEX_POINTS} fill="var(--bg-surface)" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      );
      break;
    case "cylinder":
      shapeEl = (
        <svg className="drag-preview-shape" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x="2" y="14" width="96" height="72" fill="var(--bg-surface)" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <ellipse cx="50" cy="86" rx="48" ry="12" fill="var(--bg-surface)" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <ellipse cx="50" cy="14" rx="48" ry="12" fill="var(--bg-elevated)" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      );
      break;
  }

  return createPortal(
    <div className="drag-preview" style={vars}>{shapeEl}</div>,
    document.body,
  );
}

export function ShapePanel() {
  const [dragState, setDragState] = useState<DragState>(null);

  function onDragStart(e: React.DragEvent, entry: ShapeEntry) {
    const payload: ShapeDragPayload = {
      shape: entry.type,
      ...SHAPE_SIZES[entry.type],
    };
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";

    const ghost = document.createElement("div");
    ghost.style.cssText = "position:fixed;top:-200px;left:-200px;width:1px;height:1px;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    requestAnimationFrame(() => document.body.removeChild(ghost));

    setDragState({ shape: entry.type, x: e.clientX, y: e.clientY });
  }

  function onDrag(e: React.DragEvent) {
    if (!e.clientX && !e.clientY) return;
    setDragState((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
  }

  function onDragEnd() {
    setDragState(null);
  }

  return (
    <>
      <div className="flex items-center gap-1 px-3 py-2 bg-surface border border-surface-border rounded-full shadow-lg">
        {SHAPES.map((entry) => (
          <button
            key={entry.type}
            type="button"
            draggable
            onDragStart={(e) => onDragStart(e, entry)}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            title={entry.label}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-elevated text-copy-muted hover:text-copy-primary transition-colors cursor-grab active:cursor-grabbing"
          >
            <entry.Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      {dragState && (
        <ShapePreview shape={dragState.shape} x={dragState.x} y={dragState.y} />
      )}
    </>
  );
}
