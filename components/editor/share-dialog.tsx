"use client";

import { useState, useEffect } from "react";
import { Copy, Check, X, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EnrichedCollaborator {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  projectId: string;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ projectId, isOwner, open, onOpenChange }: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<EnrichedCollaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setInviteEmail("");
      setInviteError(null);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    fetch(`/api/projects/${projectId}/collaborators`)
      .then((r) => r.json())
      .then((data) => setCollaborators(data.collaborators ?? []))
      .catch(() => setFetchError("Failed to load collaborators"))
      .finally(() => setIsLoading(false));
  }, [open, projectId]);

  async function handleInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setIsInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error ?? "Failed to invite");
        return;
      }
      setCollaborators((prev) => [...prev, data.collaborator]);
      setInviteEmail("");
    } catch {
      setInviteError("Failed to invite");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove(email: string) {
    setRemovingEmail(email);
    try {
      await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setCollaborators((prev) => prev.filter((c) => c.email !== email));
    } finally {
      setRemovingEmail(null);
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onOpenChange(false); }}>
      <DialogContent
        showCloseButton={false}
        className="rounded-3xl bg-surface border border-surface-border sm:max-w-md"
      >
        <div className="flex items-center justify-between mb-1">
          <DialogTitle className="text-copy-primary text-base font-semibold">
            Share
          </DialogTitle>
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-copy-muted hover:text-copy-primary"
              />
            }
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        {isOwner && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Invite by email"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inviteEmail.trim()) {
                    e.preventDefault();
                    handleInvite();
                  }
                }}
                className="bg-elevated border-surface-border text-copy-primary placeholder:text-copy-faint"
              />
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || isInviting}
                className="shrink-0"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Invite
              </Button>
            </div>
            {inviteError && (
              <p className="text-xs text-error">{inviteError}</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-copy-muted uppercase tracking-wider">
            Collaborators
          </p>
          {isLoading ? (
            <p className="text-sm text-copy-muted py-2">Loading…</p>
          ) : fetchError ? (
            <p className="text-sm text-error py-2">{fetchError}</p>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-copy-faint py-2">No collaborators yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {collaborators.map((c) => (
                <li key={c.email} className="flex items-center gap-3 py-1">
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt={c.displayName ?? c.email}
                      className="h-7 w-7 rounded-full shrink-0 object-cover"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-elevated border border-surface-border shrink-0 flex items-center justify-center text-xs font-medium text-copy-secondary">
                      {(c.displayName ?? c.email)[0].toUpperCase()}
                    </div>
                  )}
                  <span className="flex-1 min-w-0 text-sm text-copy-primary truncate">
                    {c.displayName ?? c.email}
                  </span>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(c.email)}
                      disabled={removingEmail === c.email}
                      className="text-copy-muted hover:text-error shrink-0"
                      aria-label={`Remove ${c.email}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isOwner && (
          <div className="flex justify-end pt-2 border-t border-surface-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5 text-copy-muted hover:text-copy-primary"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy link
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
