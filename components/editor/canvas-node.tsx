"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CanvasNode } from "@/types/canvas";

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div
      className={[
        "flex items-center justify-center px-3 py-2",
        "min-w-[80px] min-h-[40px] w-full h-full",
        "border rounded-xl bg-surface text-copy-primary text-sm select-none",
        selected ? "border-accent-primary" : "border-surface-border",
      ].join(" ")}
    >
      <Handle type="target" position={Position.Top} />
      <span className="truncate">{data.label}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
