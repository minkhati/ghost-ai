"use client";

import { useCallback, useRef } from "react";
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
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { ShapePanel, SHAPE_DRAG_TYPE } from "@/components/editor/shape-panel";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import type { CanvasNode, CanvasEdge, ShapeDragPayload } from "@/types/canvas";
import { DEFAULT_NODE_COLOR, DEFAULT_NODE_TEXT_COLOR } from "@/types/canvas";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Minus, Plus, Maximize2, Undo2, Redo2 } from "lucide-react";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

const nodeTypes = { canvasNode: CanvasNodeRenderer };
const edgeTypes = { canvasEdge: CanvasEdgeRenderer };
const defaultEdgeOptions = { type: "canvasEdge" };

let nodeCounter = 0;

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
  isTemplatesOpen,
  onCloseTemplates,
}: {
  isTemplatesOpen: boolean;
  onCloseTemplates: () => void;
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

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts({ flow, onUndo: undo, onRedo: redo });

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

    const position = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
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

  return (
    <CanvasContext.Provider value={{ onNodesChange, onEdgesChange }}>
    <StarterTemplatesModal
      open={isTemplatesOpen}
      onOpenChange={(open) => { if (!open) onCloseTemplates(); }}
      onImport={handleTemplateImport}
    />
    <div className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
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
        <Cursors />
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
  isTemplatesOpen,
  onCloseTemplates,
}: {
  isTemplatesOpen: boolean;
  onCloseTemplates: () => void;
}) {
  return (
    <ReactFlowProvider>
      <CanvasInner isTemplatesOpen={isTemplatesOpen} onCloseTemplates={onCloseTemplates} />
    </ReactFlowProvider>
  );
}
