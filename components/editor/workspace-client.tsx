"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { Project } from "@/hooks/use-project-actions";
import { CanvasWrapper } from "@/components/editor/canvas-wrapper";
import { ShareDialog } from "@/components/editor/share-dialog";

interface WorkspaceClientProps {
  project: { id: string; name: string };
  isOwner: boolean;
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function WorkspaceClient({ project, isOwner, ownedProjects, sharedProjects }: WorkspaceClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  const {
    activeDialog,
    selectedProject,
    projectName,
    setProjectName,
    roomId,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  } = useProjectActions({ activeProjectId: project.id });

  const allProjects = [...ownedProjects, ...sharedProjects];

  return (
    <div className="relative h-screen bg-base overflow-hidden">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
        title={project.name}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onShare={() => setIsShareOpen(true)}
        isAiOpen={isAiOpen}
        onAiToggle={() => setIsAiOpen((prev) => !prev)}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={allProjects}
        activeProjectId={project.id}
        onNewProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
      />

      <main className="pt-12 h-full flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <CanvasWrapper
            roomId={project.id}
            isTemplatesOpen={isTemplatesOpen}
            onCloseTemplates={() => setIsTemplatesOpen(false)}
          />
        </div>

        {isAiOpen && (
          <aside className="w-80 shrink-0 border-l border-surface-border bg-surface flex items-center justify-center">
            <p className="text-sm text-copy-muted">AI chat coming soon</p>
          </aside>
        )}
      </main>

      <CreateProjectDialog
        open={activeDialog === "create"}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        roomId={roomId}
        onSubmit={handleCreate}
      />

      <RenameProjectDialog
        open={activeDialog === "rename"}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
        project={selectedProject}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onSubmit={handleRename}
      />

      <DeleteProjectDialog
        open={activeDialog === "delete"}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
        project={selectedProject}
        onConfirm={handleDelete}
      />

      <ShareDialog
        projectId={project.id}
        isOwner={isOwner}
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
      />
    </div>
  );
}
