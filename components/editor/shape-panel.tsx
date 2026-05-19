"use client";

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

export function ShapePanel() {
  function onDragStart(e: React.DragEvent, entry: ShapeEntry) {
    const payload: ShapeDragPayload = {
      shape: entry.type,
      ...SHAPE_SIZES[entry.type],
    };
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-surface border border-surface-border rounded-full shadow-lg">
      {SHAPES.map((entry) => (
        <button
          key={entry.type}
          draggable
          onDragStart={(e) => onDragStart(e, entry)}
          title={entry.label}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-elevated text-copy-muted hover:text-copy-primary transition-colors cursor-grab active:cursor-grabbing"
        >
          <entry.Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
