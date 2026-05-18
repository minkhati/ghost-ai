"use client";

import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Share2 } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  title?: string;
  onShare?: () => void;
  isAiOpen?: boolean;
  onAiToggle?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  title,
  onShare,
  isAiOpen,
  onAiToggle,
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
        <UserButton />
      </div>
    </header>
  );
}
