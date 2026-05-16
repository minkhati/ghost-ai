"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <div
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={[
        "fixed top-12 left-0 z-30 flex flex-col",
        "h-[calc(100vh-3rem)] w-72",
        "bg-surface border-r border-surface-border",
        "transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none select-none",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-surface-border">
        <span className="text-sm font-medium text-copy-primary">Projects</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close sidebar"
          className="h-7 w-7 text-copy-muted hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden p-3">
        <Tabs defaultValue="my-projects" className="flex flex-col flex-1">
          <TabsList className="w-full shrink-0">
            <TabsTrigger value="my-projects" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="my-projects"
            className="flex flex-1 items-center justify-center mt-0 pt-4"
          >
            <p className="text-sm text-copy-muted">No projects yet.</p>
          </TabsContent>
          <TabsContent
            value="shared"
            className="flex flex-1 items-center justify-center mt-0 pt-4"
          >
            <p className="text-sm text-copy-muted">No shared projects.</p>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-3 shrink-0 border-t border-surface-border">
        <Button className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}
