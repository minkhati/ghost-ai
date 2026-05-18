"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Project } from "@/hooks/use-project-actions";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onConfirm: () => void;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onOpenChange(false); }}>
      <DialogContent
        showCloseButton={false}
        className="rounded-3xl bg-surface border border-surface-border sm:max-w-md"
      >
        <div className="flex flex-col gap-1 mb-1">
          <DialogTitle className="text-copy-primary text-base font-semibold">
            Delete Project
          </DialogTitle>
          <DialogDescription className="text-copy-muted text-sm">
            {project
              ? <>Are you sure you want to delete &ldquo;{project.name}&rdquo;? This action cannot be undone.</>
              : "This action cannot be undone."}
          </DialogDescription>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
