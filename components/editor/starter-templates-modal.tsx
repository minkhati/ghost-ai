"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import type { CanvasTemplate } from "./starter-templates";
import { CANVAS_TEMPLATES } from "./starter-templates";

const PREVIEW_PAD = 28;

function PreviewShape({ node }: { node: CanvasNode }) {
  const { shape, color } = node.data;
  const x = node.position.x;
  const y = node.position.y;
  const w = node.width ?? 100;
  const h = node.height ?? 60;
  const fill = color;
  const stroke = "rgba(255,255,255,0.2)";
  const sv = "non-scaling-stroke";

  switch (shape) {
    case "rectangle":
      return <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={1} vectorEffect={sv} />;
    case "pill":
      return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={1} vectorEffect={sv} />;
    case "circle": {
      const r = Math.min(w, h) / 2;
      return <circle cx={x + w / 2} cy={y + h / 2} r={r} fill={fill} stroke={stroke} strokeWidth={1} vectorEffect={sv} />;
    }
    case "diamond": {
      const cx = x + w / 2, cy = y + h / 2;
      return <polygon points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`} fill={fill} stroke={stroke} strokeWidth={1} vectorEffect={sv} />;
    }
    case "hexagon": {
      const cx = x + w / 2, cy = y + h / 2;
      const r = Math.min(w, h) / 2;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" ");
      return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1} vectorEffect={sv} />;
    }
    case "cylinder": {
      const ry = Math.max(6, h * 0.14);
      return (
        <g>
          <rect x={x} y={y + ry} width={w} height={h - ry} fill={fill} stroke="none" />
          <ellipse cx={x + w / 2} cy={y + ry} rx={w / 2} ry={ry} fill={fill} stroke={stroke} strokeWidth={1} vectorEffect={sv} />
          <ellipse cx={x + w / 2} cy={y + h} rx={w / 2} ry={ry} fill="none" stroke={stroke} strokeWidth={1} vectorEffect={sv} />
          <line x1={x} y1={y + ry} x2={x} y2={y + h} stroke={stroke} strokeWidth={1} vectorEffect={sv} />
          <line x1={x + w} y1={y + ry} x2={x + w} y2={y + h} stroke={stroke} strokeWidth={1} vectorEffect={sv} />
        </g>
      );
    }
  }
}

function TemplatePreview({ nodes, edges }: { nodes: CanvasNode[]; edges: CanvasEdge[] }) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const nd of nodes) {
    const w = nd.width ?? 100;
    const h = nd.height ?? 60;
    minX = Math.min(minX, nd.position.x);
    minY = Math.min(minY, nd.position.y);
    maxX = Math.max(maxX, nd.position.x + w);
    maxY = Math.max(maxY, nd.position.y + h);
  }

  const vbX = minX - PREVIEW_PAD;
  const vbY = minY - PREVIEW_PAD;
  const vbW = Math.max(maxX - minX + 2 * PREVIEW_PAD, 1);
  const vbH = Math.max(maxY - minY + 2 * PREVIEW_PAD, 1);

  const centers: Record<string, { x: number; y: number }> = {};
  for (const nd of nodes) {
    centers[nd.id] = {
      x: nd.position.x + (nd.width ?? 100) / 2,
      y: nd.position.y + (nd.height ?? 60) / 2,
    };
  }

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="240"
      style={{ display: "block", background: "var(--bg-base)" }}
    >
      {edges.map((edge) => {
        const s = centers[edge.source];
        const t = centers[edge.target];
        if (!s || !t) return null;
        return (
          <line
            key={edge.id}
            x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {nodes.map((nd) => (
        <PreviewShape key={nd.id} node={nd} />
      ))}
    </svg>
  );
}

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({ open, onOpenChange, onImport }: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] bg-surface border-surface-border">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Import Template</DialogTitle>
          <p className="text-xs text-copy-muted mt-1">
            Choose a starter template to pre-populate your canvas. Any existing nodes will be replaced — use{" "}
            <kbd className="px-1 py-0.5 rounded text-[10px] bg-elevated border border-surface-border font-mono">⌘Z</kbd>{" "}
            to undo.
          </p>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-h-[75vh] overflow-y-auto py-1 pr-1">
          {CANVAS_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="flex flex-col rounded-xl border border-surface-border bg-elevated overflow-hidden"
            >
              <TemplatePreview nodes={template.nodes} edges={template.edges} />
              <div className="flex flex-col gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-copy-primary">{template.name}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-copy-muted">{template.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 border-surface-border text-copy-primary hover:bg-subtle"
                  onClick={() => {
                    onImport(template);
                    onOpenChange(false);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Import
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
