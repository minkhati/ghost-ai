"use client";

import { useCallback, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapePanel, SHAPE_DRAG_TYPE } from "@/components/editor/shape-panel";
import type { CanvasNode, CanvasEdge, ShapeDragPayload } from "@/types/canvas";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

const nodeTypes = { canvasNode: CanvasNodeRenderer };

let nodeCounter = 0;

function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const { screenToFlowPosition } = useReactFlow();
  const onNodesChangeRef = useRef(onNodesChange);
  onNodesChangeRef.current = onNodesChange;

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

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const id = `${payload.shape}-${Date.now()}-${++nodeCounter}`;

    const newNode: CanvasNode = {
      id,
      type: "canvasNode",
      position,
      data: { label: "", color: DEFAULT_NODE_COLOR, shape: payload.shape },
      width: payload.width,
      height: payload.height,
    };

    onNodesChangeRef.current([{ type: "add", item: newNode }]);
  }, [screenToFlowPosition]);

  return (
    <div className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} />
        <Cursors />
        <Panel position="bottom-center">
          <ShapePanel />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
