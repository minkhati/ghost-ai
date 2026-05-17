"use client";

import { useState, useCallback, useMemo } from "react";

export interface Project {
  id: string;
  name: string;
  slug: string;
  owned: boolean;
}

export type DialogType = "create" | "rename" | "delete" | null;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const MOCK_PROJECTS: Project[] = [
  { id: "1", name: "Ghost Platform", slug: "ghost-platform", owned: true },
  { id: "2", name: "API Gateway", slug: "api-gateway", owned: true },
  { id: "3", name: "Data Pipeline", slug: "data-pipeline", owned: false },
];

export function useProjectDialogs() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slug = useMemo(() => toSlug(projectName), [projectName]);

  const openCreate = useCallback(() => {
    setProjectName("");
    setSelectedProject(null);
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

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setSelectedProject(null);
    setProjectName("");
    setIsLoading(false);
  }, []);

  const handleCreate = useCallback(() => {
    if (!projectName.trim()) return;
    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName.trim(),
      slug,
      owned: true,
    };
    setProjects((prev) => [...prev, newProject]);
    closeDialog();
  }, [projectName, slug, closeDialog]);

  const handleRename = useCallback(() => {
    if (!projectName.trim() || !selectedProject) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProject.id
          ? { ...p, name: projectName.trim(), slug: toSlug(projectName.trim()) }
          : p
      )
    );
    closeDialog();
  }, [projectName, selectedProject, closeDialog]);

  const handleDelete = useCallback(() => {
    if (!selectedProject) return;
    setProjects((prev) => prev.filter((p) => p.id !== selectedProject.id));
    closeDialog();
  }, [selectedProject, closeDialog]);

  return {
    projects,
    activeDialog,
    selectedProject,
    projectName,
    setProjectName,
    slug,
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
