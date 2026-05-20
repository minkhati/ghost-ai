"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Handle,
  Position,
  NodeResizer,
  useReactFlow,
  type NodeProps,
  type NodeReplaceChange,
} from "@xyflow/react";
import type { CanvasNode, ShapeType, NodeColorPair } from "@/types/canvas";
import { NODE_COLORS, DEFAULT_NODE_COLOR } from "@/types/canvas";
import { useCanvasActions } from "@/components/editor/canvas-context";

type ShapeProps = { label: string; selected: boolean };

function RectangleShape({ label, selected }: ShapeProps) {
  return (
    <div
      className={[
        "flex items-center justify-center w-full h-full px-3 py-2",
        "rounded-xl node-shape text-sm select-none border",
        selected ? "border-accent-primary" : "border-surface-border",
      ].join(" ")}
    >
      <span className="truncate">{label}</span>
    </div>
  );
}

function PillShape({ label, selected }: ShapeProps) {
  return (
    <div
      className={[
        "flex items-center justify-center w-full h-full px-4 py-2",
        "rounded-full node-shape text-sm select-none border",
        selected ? "border-accent-primary" : "border-surface-border",
      ].join(" ")}
    >
      <span className="truncate">{label}</span>
    </div>
  );
}

function CircleShape({ label, selected }: ShapeProps) {
  return (
    <div
      className={[
        "flex items-center justify-center w-full h-full",
        "rounded-full node-shape text-sm select-none border",
        selected ? "border-accent-primary" : "border-surface-border",
      ].join(" ")}
    >
      <span className="text-center px-2 leading-tight">{label}</span>
    </div>
  );
}

function DiamondShape({ label, selected }: ShapeProps) {
  const stroke = selected ? "var(--accent-primary)" : "var(--border-default)";
  return (
    <div className="relative flex items-center justify-center w-full h-full select-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,2 98,50 50,98 2,50"
          fill="var(--node-bg)"
          stroke={stroke}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="relative z-10 node-shape-text text-sm text-center px-6 leading-tight">
        {label}
      </span>
    </div>
  );
}

function HexagonShape({ label, selected }: ShapeProps) {
  const stroke = selected ? "var(--accent-primary)" : "var(--border-default)";
  const cx = 50, cy = 50, r = 47;
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
  return (
    <div className="relative flex items-center justify-center w-full h-full select-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points={points}
          fill="var(--node-bg)"
          stroke={stroke}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="relative z-10 node-shape-text text-sm text-center px-4 leading-tight">
        {label}
      </span>
    </div>
  );
}

function CylinderShape({ label, selected }: ShapeProps) {
  const stroke = selected ? "var(--accent-primary)" : "var(--border-default)";
  return (
    <div className="relative flex items-center justify-center w-full h-full select-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <rect
          x="2" y="14" width="96" height="72"
          fill="var(--node-bg)"
          stroke={stroke}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <ellipse
          cx="50" cy="86" rx="48" ry="12"
          fill="var(--node-bg)"
          stroke={stroke}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <ellipse
          cx="50" cy="14" rx="48" ry="12"
          fill="var(--node-bg)"
          stroke={stroke}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="relative z-10 node-shape-text text-sm text-center px-4 mt-3 leading-tight">
        {label}
      </span>
    </div>
  );
}

const SHAPE_COMPONENTS: Record<ShapeType, (p: ShapeProps) => React.ReactNode> = {
  rectangle: (p) => <RectangleShape {...p} />,
  pill: (p) => <PillShape {...p} />,
  circle: (p) => <CircleShape {...p} />,
  diamond: (p) => <DiamondShape {...p} />,
  hexagon: (p) => <HexagonShape {...p} />,
  cylinder: (p) => <CylinderShape {...p} />,
};

function colorIndex(bg: string): number {
  const i = NODE_COLORS.findIndex((p) => p.bg === bg);
  return i < 0 ? 0 : i;
}

function ColorSwatch({
  pair,
  index,
  isActive,
  onSelect,
}: {
  pair: NodeColorPair;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={pair.name}
      className={`node-color-swatch node-swatch-${index} w-5 h-5 rounded-full flex-shrink-0 outline-none${isActive ? " node-color-swatch--active" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    />
  );
}

function ColorToolbar({
  activeColor,
  onColorSelect,
}: {
  activeColor: string;
  onColorSelect: (pair: NodeColorPair) => void;
}) {
  const prevent = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };
  return (
    <div
      className="node-color-toolbar absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-elevated border border-surface-border shadow-lg z-20"
      onMouseDown={prevent}
      onPointerDown={prevent}
    >
      {NODE_COLORS.map((pair, i) => (
        <ColorSwatch
          key={pair.bg}
          pair={pair}
          index={i}
          isActive={pair.bg === activeColor}
          onSelect={() => onColorSelect(pair)}
        />
      ))}
    </div>
  );
}

const MIN_WIDTH = 60;
const MIN_HEIGHT = 40;

export function CanvasNodeRenderer({ id, data, selected }: NodeProps<CanvasNode>) {
  const { label, shape, color, textColor } = data;
  const [isEditing, setIsEditing] = useState(false);
  const editValueRef = useRef(label);
  const cancelledRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { onNodesChange } = useCanvasActions();
  const { getNode } = useReactFlow();

  const activeBgColor = color || DEFAULT_NODE_COLOR;
  const nodeColorClass = `node-color-${colorIndex(activeBgColor)}`;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    editValueRef.current = label;
    setIsEditing(true);
  }, [label]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    editValueRef.current = e.target.value;
    e.target.value = editValueRef.current;
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    const node = getNode(id);
    if (!node) return;
    const change: NodeReplaceChange<CanvasNode> = {
      type: "replace",
      id,
      item: { ...node, data: { ...node.data, label: editValueRef.current } } as CanvasNode,
    };
    onNodesChange([change]);
  }, [id, getNode, onNodesChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      cancelledRef.current = true;
      textareaRef.current?.blur();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      textareaRef.current?.blur();
    }
  }, []);

  const stopPropagation = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  const handleColorSelect = useCallback((pair: NodeColorPair) => {
    const node = getNode(id);
    if (!node) return;
    const change: NodeReplaceChange<CanvasNode> = {
      type: "replace",
      id,
      item: { ...node, data: { ...node.data, color: pair.bg, textColor: pair.text } } as CanvasNode,
    };
    onNodesChange([change]);
  }, [id, getNode, onNodesChange]);

  const render = SHAPE_COMPONENTS[shape] ?? SHAPE_COMPONENTS.rectangle;

  return (
    <div
      className={`relative w-full h-full ${nodeColorClass}`}
      onDoubleClick={startEditing}
    >
      {selected && !isEditing && (
        <ColorToolbar activeColor={activeBgColor} onColorSelect={handleColorSelect} />
      )}
      <NodeResizer
        isVisible={!!selected && !isEditing}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        handleStyle={{
          width: 7,
          height: 7,
          borderRadius: 2,
          background: "var(--bg-elevated)",
          border: "1.5px solid var(--accent-primary)",
        }}
        lineStyle={{
          borderColor: "var(--accent-primary)",
          borderStyle: "dashed",
          borderWidth: 1,
          opacity: 0.5,
        }}
      />
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Left} id="left" />
      {render({ label, selected: !!selected })}
      {!label && !isEditing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-copy-faint text-sm select-none">Label</span>
        </div>
      )}
      {isEditing && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          onMouseDown={stopPropagation}
          onPointerDown={stopPropagation}
        >
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent node-shape-text text-sm text-center resize-none outline-none border-none px-3 leading-normal overflow-hidden"
            defaultValue={label}
            placeholder="Label"
            rows={2}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onMouseDown={stopPropagation}
            onPointerDown={stopPropagation}
          />
        </div>
      )}
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
}
