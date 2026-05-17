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

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  slug: string;
  onSubmit: () => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  projectName,
  onProjectNameChange,
  slug,
  onSubmit,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onOpenChange(false); }}>
      <DialogContent
        showCloseButton={false}
        className="rounded-3xl bg-surface border border-surface-border sm:max-w-md"
      >
        <div className="flex flex-col gap-1 mb-1">
          <DialogTitle className="text-copy-primary text-base font-semibold">
            New Project
          </DialogTitle>
          <DialogDescription className="text-copy-muted text-sm">
            Name your architecture workspace.
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            placeholder="Project name"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
            className="bg-elevated border-surface-border text-copy-primary placeholder:text-copy-faint"
          />
          {slug && (
            <p className="text-xs text-copy-muted">
              Slug:{" "}
              <span className="font-mono text-copy-secondary">{slug}</span>
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button onClick={onSubmit} disabled={!projectName.trim()}>
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
