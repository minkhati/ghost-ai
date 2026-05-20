"use client";

import { createContext, useContext } from "react";
import type { OnNodesChange, OnEdgesChange } from "@xyflow/react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

interface CanvasContextValue {
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<CanvasEdge>;
}

export const CanvasContext = createContext<CanvasContextValue>({
  onNodesChange: () => {},
  onEdgesChange: () => {},
});

export function useCanvasActions() {
  return useContext(CanvasContext);
}
