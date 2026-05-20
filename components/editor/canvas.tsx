"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasContext } from "@/components/editor/canvas-context";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { useUndo, useRedo, useCanUndo, useCanRedo, useMyPresence } from "@liveblocks/react";
import { useOther } from "@liveblocks/react/suspense";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { ShapePanel, SHAPE_DRAG_TYPE } from "@/components/editor/shape-panel";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { PresenceAvatars } from "@/components/editor/presence-avatars";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import type { CanvasNode, CanvasEdge, ShapeDragPayload } from "@/types/canvas";
import { DEFAULT_NODE_COLOR, DEFAULT_NODE_TEXT_COLOR } from "@/types/canvas";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCanvasAutosave, type SaveStatus } from "@/hooks/useCanvasAutosave";
import { Minus, Plus, Maximize2, Undo2, Redo2 } from "lucide-react";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

const nodeTypes = { canvasNode: CanvasNodeRenderer };
const edgeTypes = { canvasEdge: CanvasEdgeRenderer };
const defaultEdgeOptions = { type: "canvasEdge" };

let nodeCounter = 0;

function CanvasCursor({ connectionId }: { connectionId: number; userId: string }) {
  const info = useOther(connectionId, (o) => o.info);
  if (!info) return null;
  const badgeStyle = { "--cursor-bg": info.color } as React.CSSProperties;
  return (
    <div className="canvas-cursor">
      <svg
        width="12"
        height="18"
        viewBox="0 0 12 18"
        className="canvas-cursor-pointer"
      >
        <path
          d="M 0 0 L 0 14 L 3.5 11 L 6 17 L 7.5 16 L 5 10 L 9 10 Z"
          fill={info.color}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
      <div className="canvas-cursor-badge" style={badgeStyle}>
        {info.name}
      </div>
    </div>
  );
}

function CanvasControlBar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const flow = useReactFlow();

  return (
    <div className="canvas-control-bar">
      <button
        type="button"
        className="canvas-control-btn"
        onClick={() => flow.zoomOut({ duration: 300 })}
        title="Zoom out"
      >
        <Minus size={14} />
      </button>
      <button
        type="button"
        className="canvas-control-btn"
        onClick={() => flow.fitView({ duration: 300 })}
        title="Fit view"
      >
        <Maximize2 size={14} />
      </button>
      <button
        type="button"
        className="canvas-control-btn"
        onClick={() => flow.zoomIn({ duration: 300 })}
        title="Zoom in"
      >
        <Plus size={14} />
      </button>
      <div className="canvas-control-bar-divider" />
      <button
        type="button"
        className="canvas-control-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo2 size={14} />
      </button>
      <button
        type="button"
        className="canvas-control-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo2 size={14} />
      </button>
    </div>
  );
}

function CanvasInner({
  projectId,
  isTemplatesOpen,
  onCloseTemplates,
  onSaveStatusChange,
}: {
  projectId: string;
  isTemplatesOpen: boolean;
  onCloseTemplates: () => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
}) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const flow = useReactFlow();
  const onNodesChangeRef = useRef(onNodesChange);
  onNodesChangeRef.current = onNodesChange;
  const onEdgesChangeRef = useRef(onEdgesChange);
  onEdgesChangeRef.current = onEdgesChange;
  const onSaveStatusChangeRef = useRef(onSaveStatusChange);
  onSaveStatusChangeRef.current = onSaveStatusChange;

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [, updateMyPresence] = useMyPresence();

  useKeyboardShortcuts({ flow, onUndo: undo, onRedo: redo });

  const [autosaveEnabled, setAutosaveEnabled] = useState(false);

  // Load saved canvas once on mount if the room is currently empty
  useEffect(() => {
    const hasContent = nodes.length > 0 || edges.length > 0;
    if (hasContent) {
      setAutosaveEnabled(true);
      return;
    }

    let cancelled = false;

    fetch(`/api/projects/${projectId}/canvas`)
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data.nodes) && data.nodes.length > 0) {
          onNodesChangeRef.current(data.nodes.map((n: CanvasNode) => ({ type: "add" as const, item: n })));
          setTimeout(() => flow.fitView({ duration: 300 }), 150);
        }
        if (Array.isArray(data.edges) && data.edges.length > 0) {
          onEdgesChangeRef.current(data.edges.map((e: CanvasEdge) => ({ type: "add" as const, item: e })));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAutosaveEnabled(true);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional: run once on mount to check initial room state

  const saveStatus = useCanvasAutosave({ projectId, nodes, edges, enabled: autosaveEnabled });

  useEffect(() => {
    onSaveStatusChangeRef.current?.(saveStatus);
  }, [saveStatus]);

  const handleTemplateImport = useCallback((template: CanvasTemplate) => {
    if (edges.length > 0) onEdgesChange(edges.map((e) => ({ type: "remove" as const, id: e.id })));
    if (nodes.length > 0) onNodesChange(nodes.map((n) => ({ type: "remove" as const, id: n.id })));
    onNodesChange(template.nodes.map((n) => ({ type: "add" as const, item: n })));
    onEdgesChange(template.edges.map((e) => ({ type: "add" as const, item: e })));
    setTimeout(() => flow.fitView({ duration: 300 }), 150);
  }, [nodes, edges, onNodesChange, onEdgesChange, flow]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    const raw = e.dataTransfer.getData(SHAPE_DRAG_TYPE);
    if (!raw) return;

    let payload: ShapeDragPayload;
    try {
      payload = JSON.parse(raw) as ShapeDragPayload;
    } catch {
      return;
    }

    const position = flow.screenToFlowPosition({
      x: e.clientX - payload.width / 2,
      y: e.clientY - payload.height / 2,
    });
    const id = `${payload.shape}-${Date.now()}-${++nodeCounter}`;

    const newNode: CanvasNode = {
      id,
      type: "canvasNode",
      position,
      data: { label: "", color: DEFAULT_NODE_COLOR, textColor: DEFAULT_NODE_TEXT_COLOR, shape: payload.shape },
      width: payload.width,
      height: payload.height,
    };

    onNodesChangeRef.current([{ type: "add", item: newNode }]);
  }, [flow]);

  const onMouseMoveCanvas = useCallback((e: React.MouseEvent) => {
    const position = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    updateMyPresence({ cursor: position });
  }, [flow, updateMyPresence]);

  const onMouseLeaveCanvas = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  return (
    <CanvasContext.Provider value={{ onNodesChange, onEdgesChange }}>
    <StarterTemplatesModal
      open={isTemplatesOpen}
      onOpenChange={(open) => { if (!open) onCloseTemplates(); }}
      onImport={handleTemplateImport}
    />
    <div
      className="h-full w-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseMove={onMouseMoveCanvas}
      onMouseLeave={onMouseLeaveCanvas}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
        <Cursors components={{ Cursor: CanvasCursor }} />
        <Panel position="top-right">
          <PresenceAvatars />
        </Panel>
        <Panel position="bottom-left">
          <CanvasControlBar
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </Panel>
        <Panel position="bottom-center">
          <ShapePanel />
        </Panel>
      </ReactFlow>
    </div>
    </CanvasContext.Provider>
  );
}

export function Canvas({
  projectId,
  isTemplatesOpen,
  onCloseTemplates,
  onSaveStatusChange,
}: {
  projectId: string;
  isTemplatesOpen: boolean;
  onCloseTemplates: () => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
}) {
  return (
    <ReactFlowProvider>
      <CanvasInner
        projectId={projectId}
        isTemplatesOpen={isTemplatesOpen}
        onCloseTemplates={onCloseTemplates}
        onSaveStatusChange={onSaveStatusChange}
      />
    </ReactFlowProvider>
  );
}
