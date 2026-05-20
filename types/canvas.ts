import type { Node, Edge } from "@xyflow/react";

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: string;
  textColor: string;
  shape: ShapeType;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;
export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string;
}

export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">;

export type ShapeType = "rectangle" | "diamond" | "circle" | "pill" | "cylinder" | "hexagon";

export interface ShapeDragPayload {
  shape: ShapeType;
  width: number;
  height: number;
}

export interface NodeColorPair {
  bg: string;
  text: string;
  name: string;
}

export const NODE_COLORS: NodeColorPair[] = [
  { bg: "#1F1F1F", text: "#EDEDED", name: "Neutral" },
  { bg: "#10233D", text: "#52A8FF", name: "Blue" },
  { bg: "#2E1938", text: "#BF7AF0", name: "Purple" },
  { bg: "#331B00", text: "#FF990A", name: "Orange" },
  { bg: "#3C1618", text: "#FF6166", name: "Red" },
  { bg: "#3A1726", text: "#F75F8F", name: "Pink" },
  { bg: "#0F2E18", text: "#62C073", name: "Green" },
  { bg: "#062822", text: "#0AC7B4", name: "Teal" },
];

export const SHAPE_SIZES: Record<ShapeType, { width: number; height: number }> = {
  rectangle: { width: 160, height: 80 },
  diamond:   { width: 140, height: 100 },
  circle:    { width: 100, height: 100 },
  pill:      { width: 160, height: 60 },
  cylinder:  { width: 100, height: 120 },
  hexagon:   { width: 120, height: 110 },
};

export const DEFAULT_NODE_COLOR = "#1F1F1F";
export const DEFAULT_NODE_TEXT_COLOR = "#EDEDED";
