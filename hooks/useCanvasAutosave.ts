"use client";

import { useEffect, useRef, useState } from "react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
}: {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled: boolean;
}): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setStatus("saving");
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
          signal: abortRef.current.signal,
        });
        if (!res.ok) throw new Error("Save failed");
        setStatus("saved");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setStatus("error");
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [projectId, nodes, edges, enabled]);

  return status;
}
