"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
import { Button } from "@/components/ui/button";
import type { Project } from "@/hooks/use-project-actions";

interface EditorHomeClientProps {
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function EditorHomeClient({ ownedProjects, sharedProjects }: EditorHomeClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  } = useProjectActions();

  const allProjects = [...ownedProjects, ...sharedProjects];

  return (
    <div className="relative h-screen bg-base overflow-hidden">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={allProjects}
        onNewProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
      />

      <main className="pt-12 h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <h1 className="text-xl font-semibold text-copy-primary">
            Create a project or open an existing one
          </h1>
          <p className="text-sm text-copy-muted max-w-sm">
            Start a new architecture workspace, or choose a project from the sidebar.
          </p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-5 w-5" />
            New Project
          </Button>
        </div>
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
    </div>
  );
}
