import { useEffect } from "react";

type FlowActions = {
  zoomIn: (opts?: { duration?: number }) => void;
  zoomOut: (opts?: { duration?: number }) => void;
};

type Options = {
  flow: FlowActions;
  onUndo: () => void;
  onRedo: () => void;
};

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts({ flow, onUndo, onRedo }: Options) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditable(e.target)) return;

      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onRedo();
        return;
      }
      if (meta && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        onRedo();
        return;
      }
      if (meta && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndo();
        return;
      }
      if (!meta && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        flow.zoomIn({ duration: 300 });
        return;
      }
      if (!meta && e.key === "-") {
        e.preventDefault();
        flow.zoomOut({ duration: 300 });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flow, onUndo, onRedo]);
}
