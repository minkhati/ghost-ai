"use client";

import { AlertCircle, Check, LayoutTemplate, Loader2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SaveStatus } from "@/hooks/useCanvasAutosave";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  title?: string;
  onOpenTemplates?: () => void;
  onShare?: () => void;
  isAiOpen?: boolean;
  onAiToggle?: () => void;
  saveStatus?: SaveStatus;
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  title,
  onOpenTemplates,
  onShare,
  isAiOpen,
  onAiToggle,
  saveStatus,
}: EditorNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-3 bg-surface border-b border-surface-border">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          className="h-8 w-8 text-copy-muted hover:text-copy-primary"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
      </div>

      {title && (
        <span className="ml-3 text-sm font-medium text-copy-primary truncate max-w-xs">
          {title}
        </span>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {saveStatus !== undefined && (
          <div className="flex items-center gap-1.5 px-2 text-xs select-none min-w-[80px] justify-end">
            {saveStatus === "idle" && (
              <span className="text-copy-faint">Auto-save on</span>
            )}
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-copy-muted" />
                <span className="text-copy-muted">Saving…</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-3 w-3 text-success" />
                <span className="text-copy-secondary">Saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-3 w-3 text-error" />
                <span className="text-error">Error saving</span>
              </>
            )}
          </div>
        )}
        {onOpenTemplates && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenTemplates}
            className="gap-1.5 text-copy-muted hover:text-copy-primary"
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Button>
        )}
        {onShare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="gap-1.5 text-copy-muted hover:text-copy-primary"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
        {onAiToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onAiToggle}
            aria-label={isAiOpen ? "Close AI sidebar" : "Open AI sidebar"}
            aria-expanded={isAiOpen}
            className="h-8 w-8 text-copy-muted hover:text-copy-primary"
          >
            {isAiOpen ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRightOpen className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
