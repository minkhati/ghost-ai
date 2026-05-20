"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
  type EdgeReplaceChange,
} from "@xyflow/react";
import type { CanvasEdge } from "@/types/canvas";
import { useCanvasActions } from "@/components/editor/canvas-context";

export function CanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<CanvasEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [inputSize, setInputSize] = useState(5);
  const editValueRef = useRef(data?.label ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const { onEdgesChange } = useCanvasActions();
  const { getEdge } = useReactFlow();

  const label = data?.label ?? "";
  const markerId = `canvas-arrow-${id}`;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      editValueRef.current = label;
      setInputSize(Math.max(label.length, 5));
      setIsEditing(true);
    },
    [label]
  );

  const commitLabel = useCallback(() => {
    setIsEditing(false);
    const edge = getEdge(id);
    if (!edge) return;
    const change: EdgeReplaceChange<CanvasEdge> = {
      type: "replace",
      id,
      item: {
        ...edge,
        data: { ...(edge.data ?? {}), label: editValueRef.current },
      } as CanvasEdge,
    };
    onEdgesChange([change]);
  }, [id, getEdge, onEdgesChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      editValueRef.current = e.target.value;
      setInputSize(Math.max(e.target.value.length, 5));
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        inputRef.current?.blur();
      }
    },
    []
  );

  const stopPropagation = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      e.stopPropagation();
    },
    []
  );

  const arrowFill = selected ? "var(--text-primary)" : "var(--border-subtle)";

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L7,3 z" style={{ fill: arrowFill }} />
        </marker>
      </defs>
      {/* Wide transparent stroke for easier clicking without changing visible thickness */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        pointerEvents="stroke"
        onDoubleClick={startEditing}
      />
      {/* Visible edge path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
        className={`canvas-edge-path${selected ? " canvas-edge-path--selected" : ""}`}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onDoubleClick={startEditing}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              defaultValue={label}
              size={inputSize}
              onChange={handleInputChange}
              onBlur={commitLabel}
              onKeyDown={handleKeyDown}
              onMouseDown={stopPropagation}
              onPointerDown={stopPropagation}
              onClick={stopPropagation}
              className="canvas-edge-input nodrag nopan"
            />
          ) : label ? (
            <span className="canvas-edge-label nodrag nopan">{label}</span>
          ) : selected ? (
            <span className="canvas-edge-label-hint nodrag nopan">label</span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
