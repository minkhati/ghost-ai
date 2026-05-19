import type { Node, Edge } from "@xyflow/react";

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: string;
  shape: ShapeType;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;
export type CanvasEdge = Edge<Record<string, never>, "canvasEdge">;

export type ShapeType = "rectangle" | "diamond" | "circle" | "pill" | "cylinder" | "hexagon";

export interface ShapeDragPayload {
  shape: ShapeType;
  width: number;
  height: number;
}

export const SHAPE_SIZES: Record<ShapeType, { width: number; height: number }> = {
  rectangle: { width: 160, height: 80 },
  diamond:   { width: 140, height: 100 },
  circle:    { width: 100, height: 100 },
  pill:      { width: 160, height: 60 },
  cylinder:  { width: 100, height: 120 },
  hexagon:   { width: 120, height: 110 },
};

export const DEFAULT_NODE_COLOR = "#64748b";
