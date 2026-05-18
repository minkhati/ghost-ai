"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Project } from "@/hooks/use-project-actions";

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSubmit: () => void;
}

export function RenameProjectDialog({
  open,
  onOpenChange,
  project,
  projectName,
  onProjectNameChange,
  onSubmit,
}: RenameProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onOpenChange(false); }}>
      <DialogContent
        showCloseButton={false}
        className="rounded-3xl bg-surface border border-surface-border sm:max-w-md"
      >
        <div className="flex flex-col gap-1 mb-1">
          <DialogTitle className="text-copy-primary text-base font-semibold">
            Rename Project
          </DialogTitle>
          {project && (
            <DialogDescription className="text-copy-muted text-sm">
              Renaming &ldquo;{project.name}&rdquo;
            </DialogDescription>
          )}
        </div>

        <Input
          autoFocus
          placeholder="Project name"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
          className="bg-elevated border-surface-border text-copy-primary placeholder:text-copy-faint"
        />

        <div className="flex justify-end gap-2 pt-1">
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button onClick={onSubmit} disabled={!projectName.trim()}>
            Rename
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
