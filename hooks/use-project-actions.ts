"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

export interface Project {
  id: string;
  name: string;
  owned: boolean;
}

export type DialogType = "create" | "rename" | "delete" | null;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

interface UseProjectActionsOptions {
  activeProjectId?: string;
}

export function useProjectActions({ activeProjectId }: UseProjectActionsOptions = {}) {
  const router = useRouter();
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [suffix, setSuffix] = useState(() => generateSuffix());
  const [isLoading, setIsLoading] = useState(false);

  const roomId = useMemo(() => {
    const slug = toSlug(projectName);
    return slug ? `${slug}-${suffix}` : "";
  }, [projectName, suffix]);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setSelectedProject(null);
    setProjectName("");
    setIsLoading(false);
  }, []);

  const openCreate = useCallback(() => {
    setProjectName("");
    setSelectedProject(null);
    setSuffix(generateSuffix());
    setActiveDialog("create");
  }, []);

  const openRename = useCallback((project: Project) => {
    setProjectName(project.name);
    setSelectedProject(project);
    setActiveDialog("rename");
  }, []);

  const openDelete = useCallback((project: Project) => {
    setSelectedProject(project);
    setActiveDialog("delete");
  }, []);

  const handleCreate = useCallback(async () => {
    if (!projectName.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim(), id: roomId }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const { project } = (await res.json()) as { project: { id: string } };
      closeDialog();
      router.push(`/editor/${project.id}`);
    } catch {
      setIsLoading(false);
    }
  }, [projectName, roomId, isLoading, closeDialog, router]);

  const handleRename = useCallback(async () => {
    if (!projectName.trim() || !selectedProject || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename project");
      closeDialog();
      router.refresh();
    } catch {
      setIsLoading(false);
    }
  }, [projectName, selectedProject, isLoading, closeDialog, router]);

  const handleDelete = useCallback(async () => {
    if (!selectedProject || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      closeDialog();
      if (activeProjectId === selectedProject.id) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } catch {
      setIsLoading(false);
    }
  }, [selectedProject, isLoading, activeProjectId, closeDialog, router]);

  return {
    activeDialog,
    selectedProject,
    projectName,
    setProjectName,
    roomId,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  };
}
