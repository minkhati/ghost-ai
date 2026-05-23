"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, FileText, Download, Loader2, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEventListener, useStorage, useMutation, useSelf } from "@liveblocks/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { aiStatusFeedSchema, chatMessageSchema } from "@/types/tasks";
import type { AiStatusFeedPayload, ChatMessage } from "@/types/tasks";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

type MessagePhase = "thinking" | "applying" | "done" | "error" | "start";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  phase?: MessagePhase;
}

interface ProjectSpec {
  id: string;
  filePath: string;
  createdAt: string;
}

function specFilename(spec: ProjectSpec): string {
  try {
    const pathname = new URL(spec.filePath).pathname;
    return pathname.split("/").pop() ?? `spec-${spec.id.slice(-8)}.md`;
  } catch {
    return `spec-${spec.id.slice(-8)}.md`;
  }
}

function triggerDownload(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.click();
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

const TERMINAL_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "TIMED_OUT",
  "CRASHED",
  "INTERRUPTED",
  "SYSTEM_FAILURE",
  "EXPIRED",
]);

function PhaseIcon({ phase }: { phase: MessagePhase | undefined }) {
  if (phase === "thinking" || phase === "applying" || phase === "start") {
    return <Loader2 className="h-3 w-3 animate-spin shrink-0 text-ai-text" />;
  }
  if (phase === "done") {
    return <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />;
  }
  if (phase === "error") {
    return <AlertCircle className="h-3 w-3 shrink-0 text-error" />;
  }
  return null;
}

export function AiSidebar({ isOpen, onClose, projectId }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runState, setRunState] = useState<{ runId: string; publicToken: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingMsgIdRef = useRef<string | null>(null);

  // Chat feed state
  const [chatInput, setChatInput] = useState("");
  const [chatSendError, setChatSendError] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Specs state
  const [specs, setSpecs] = useState<ProjectSpec[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [specsError, setSpecsError] = useState(false);
  const [previewSpec, setPreviewSpec] = useState<ProjectSpec | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const self = useSelf();
  const selfName = self?.info?.name ?? "You";

  // Shared AI status feed from Storage — visible to all users in the room
  const rawFeed = useStorage((root) => root.aiStatusFeed);
  const validatedFeed = rawFeed
    ? aiStatusFeedSchema.safeParse({ ...rawFeed })
    : null;
  const aiStatusFeed = validatedFeed?.success ? validatedFeed.data : null;

  const updateAiFeed = useMutation(
    ({ storage }, update: AiStatusFeedPayload) => {
      const feed = storage.get("aiStatusFeed");
      if (!feed) return;
      feed.set("isActive", update.isActive);
      if (update.text !== undefined) feed.set("text", update.text);
      if (update.phase !== undefined) feed.set("phase", update.phase);
    },
    []
  );

  const updateAiFeedRef = useRef(updateAiFeed);
  updateAiFeedRef.current = updateAiFeed;

  const isAiActive = aiStatusFeed?.isActive ?? false;
  const isInputDisabled = isAiActive || isSubmitting || runState !== null;

  // Shared chat feed from Storage — visible to all users in the room
  const rawChatFeed = useStorage((root) => root.aiChatFeed);
  const chatMessages: ChatMessage[] = rawChatFeed
    ? rawChatFeed.flatMap((msg) => {
        const parsed = chatMessageSchema.safeParse(msg);
        return parsed.success ? [parsed.data] : [];
      })
    : [];

  const sendChatMessage = useMutation(({ storage }, msg: ChatMessage) => {
    const feed = storage.get("aiChatFeed");
    if (feed) feed.push(msg);
  }, []);

  const sendChatMessageRef = useRef(sendChatMessage);
  sendChatMessageRef.current = sendChatMessage;

  // Real-time run tracking via Trigger.dev SSE
  const { run } = useRealtimeRun(runState?.runId ?? "", {
    accessToken: runState?.publicToken ?? "",
    enabled: runState !== null,
  });

  // Detect terminal run status and clear runState
  useEffect(() => {
    if (!run || !runState) return;
    if (TERMINAL_STATUSES.has(run.status)) {
      setRunState(null);
    }
  }, [run?.status, runState]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchSpecs = useCallback(async () => {
    setSpecsLoading(true);
    setSpecsError(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`);
      if (!res.ok) throw new Error("Failed to load specs");
      const data = await res.json();
      setSpecs(data.specs ?? []);
    } catch {
      setSpecsError(true);
    } finally {
      setSpecsLoading(false);
    }
  }, [projectId]);

  const openPreview = useCallback(async (spec: ProjectSpec) => {
    setPreviewSpec(spec);
    setPreviewContent(null);
    setPreviewLoading(true);
    setPreviewError(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs/${spec.id}/download`);
      if (!res.ok) throw new Error("Failed to fetch spec content");
      const text = await res.text();
      setPreviewContent(text);
    } catch {
      setPreviewError(true);
    } finally {
      setPreviewLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSpecs();
  }, [fetchSpecs]);

  // Receive AI status broadcasts from the background task; sync into shared feed
  useEventListener(({ event }) => {
    if (event.type !== "AI_STATUS") return;
    const { message, phase } = event;

    const isFinished = phase === "done" || phase === "error";
    updateAiFeedRef.current({
      isActive: !isFinished,
      text: message,
      phase,
    });

    if (pendingMsgIdRef.current) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingMsgIdRef.current
            ? { ...m, content: message, phase }
            : m
        )
      );
      if (isFinished) {
        if (phase === "done") {
          sendChatMessageRef.current({
            sender: "Ghost AI",
            role: "assistant",
            content: message,
            timestamp: Date.now(),
          });
        }
        pendingMsgIdRef.current = null;
        setIsSubmitting(false);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: message, phase },
      ]);
    }
  });

  const submitPrompt = useCallback(
    async (promptText: string) => {
      if (!promptText.trim() || isInputDisabled) return;

      const userMsgId = crypto.randomUUID();
      const assistantMsgId = crypto.randomUUID();
      pendingMsgIdRef.current = assistantMsgId;
      setIsSubmitting(true);

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: promptText },
        {
          id: assistantMsgId,
          role: "assistant",
          content: "Ghost AI is thinking…",
          phase: "thinking",
        },
      ]);

      // Push user message to shared ai-chat feed (visible to all collaborators)
      sendChatMessageRef.current({
        sender: selfName,
        role: "user",
        content: promptText,
        timestamp: Date.now(),
      });

      updateAiFeedRef.current({
        isActive: true,
        text: "Ghost AI is thinking…",
        phase: "thinking",
      });

      try {
        const designRes = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptText,
            roomId: projectId,
            projectId,
          }),
        });

        if (!designRes.ok) throw new Error("Design request failed");
        const { runId } = await designRes.json();

        const tokenRes = await fetch("/api/ai/design/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId }),
        });

        if (!tokenRes.ok) throw new Error("Token request failed");
        const { token: publicToken } = await tokenRes.json();

        setRunState({ runId, publicToken });
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: "Failed to reach Ghost AI. Please try again.",
                  phase: "error",
                }
              : m
          )
        );
        updateAiFeedRef.current({ isActive: false, phase: "error" });
        pendingMsgIdRef.current = null;
        setIsSubmitting(false);
      }
    },
    [projectId, isInputDisabled, selfName]
  );

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    submitPrompt(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChatSend = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setChatSendError(false);
    try {
      sendChatMessage({
        sender: selfName,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      });
      setChatInput("");
    } catch {
      setChatSendError(true);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  return (
    <aside
      className={`fixed top-12 right-0 bottom-0 w-80 z-30 flex flex-col bg-surface border-l border-surface-border shadow-2xl transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai/20 shrink-0">
          <Bot className="h-4 w-4 text-ai-text" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-copy-primary leading-tight">AI Workspace</p>
          <p className="text-xs text-copy-muted leading-tight">Collaborate with Ghost AI</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI sidebar"
          className="h-7 w-7 flex items-center justify-center rounded-md text-copy-muted hover:bg-subtle hover:text-copy-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="architect" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="w-full h-10 rounded-none border-b border-surface-border bg-transparent px-3 gap-1 shrink-0 justify-start">
          <TabsTrigger
            value="architect"
            className="flex-1 text-xs rounded-md bg-transparent text-copy-muted data-active:bg-subtle data-active:text-brand data-active:shadow-none"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="flex-1 text-xs rounded-md bg-transparent text-copy-muted data-active:bg-subtle data-active:text-brand data-active:shadow-none"
          >
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="flex-1 text-xs rounded-md bg-transparent text-copy-muted data-active:bg-subtle data-active:text-brand data-active:shadow-none"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        {/* AI Architect Tab */}
        <TabsContent value="architect" className="mt-0 flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai/15">
                  <Bot className="h-6 w-6 text-ai-text" />
                </div>
                <div className="px-2">
                  <p className="text-sm font-medium text-copy-primary mb-1">AI Architect</p>
                  <p className="text-xs text-copy-muted leading-relaxed">
                    Describe what you want to build and Ghost AI will design the architecture.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  {STARTER_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => submitPrompt(chip)}
                      disabled={isInputDisabled}
                      className="text-left text-xs px-3 py-2 rounded-full bg-subtle text-ai-text border border-surface-border hover:bg-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" ? (
                    <div className="max-w-[85%] rounded-2xl px-3 py-2 text-xs bg-elevated border border-surface-border text-ai-text flex items-start gap-2">
                      <PhaseIcon phase={msg.phase} />
                      <span>{msg.content}</span>
                    </div>
                  ) : (
                    <div className="max-w-[85%] rounded-2xl px-3 py-2 text-xs bg-accent-dim border-2 border-brand/50 text-copy-primary">
                      {msg.content}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Status strip — compact bar above input, only during active runs */}
          {isAiActive && (
            <div className="flex items-center gap-2 px-3 py-2 bg-ai/10 border-t border-surface-border shrink-0">
              <Loader2 className="h-3 w-3 animate-spin text-ai-text shrink-0" />
              <span className="text-xs text-ai-text truncate">
                {aiStatusFeed?.text ?? "Ghost AI is working…"}
              </span>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t border-surface-border shrink-0 flex flex-col gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your architecture…"
              disabled={isInputDisabled}
              className="min-h-[72px] max-h-[160px] resize-none text-xs bg-elevated border-surface-border text-copy-primary placeholder:text-copy-muted focus-visible:ring-brand/50 disabled:opacity-60"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || isInputDisabled}
              className="w-full text-xs bg-brand text-primary-foreground hover:bg-brand/90 disabled:opacity-40"
            >
              {isInputDisabled ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Designing…
                </span>
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-0 flex flex-col overflow-hidden">
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 py-8 text-center">
                <MessageSquare className="h-8 w-8 text-copy-faint" />
                <p className="text-xs text-copy-muted">No messages yet. Start the conversation.</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => {
                const isOwn = msg.sender === selfName;
                const isAiMsg = msg.role === "assistant";
                const time = new Date(msg.timestamp).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={`${msg.timestamp}-${i}`}
                    className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {!isOwn && (
                        <span className="text-[10px] text-copy-muted font-medium">{msg.sender}</span>
                      )}
                      <span className="text-[10px] text-copy-faint">{time}</span>
                      {isOwn && (
                        <span className="text-[10px] text-copy-muted font-medium">You</span>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                        isAiMsg
                          ? "bg-elevated border border-surface-border text-ai-text"
                          : isOwn
                          ? "bg-accent-dim border-2 border-brand/50 text-copy-primary"
                          : "bg-elevated border border-surface-border text-copy-primary"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-surface-border shrink-0 flex flex-col gap-2">
            {chatSendError && (
              <p className="text-[10px] text-error">Failed to send. Please try again.</p>
            )}
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="Send a message…"
              className="min-h-[72px] max-h-[160px] resize-none text-xs bg-elevated border-surface-border text-copy-primary placeholder:text-copy-muted focus-visible:ring-brand/50"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleChatSend}
              disabled={!chatInput.trim()}
              className="w-full text-xs bg-brand text-primary-foreground hover:bg-brand/90 disabled:opacity-40"
            >
              Send
            </Button>
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent
          value="specs"
          className="mt-0 flex flex-col overflow-hidden"
          onFocus={fetchSpecs}
          onClick={specsLoading || specs.length > 0 ? undefined : fetchSpecs}
        >
          <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1">
            <Button
              type="button"
              size="sm"
              onClick={fetchSpecs}
              disabled={specsLoading}
              className="w-full text-xs bg-subtle text-copy-primary border border-surface-border hover:bg-elevated disabled:opacity-40"
              variant="outline"
            >
              {specsLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading…
                </span>
              ) : (
                "Refresh Specs"
              )}
            </Button>

            {specsError && (
              <p className="text-[10px] text-error text-center py-2">
                Failed to load specs. Try again.
              </p>
            )}

            {!specsLoading && !specsError && specs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <FileText className="h-8 w-8 text-copy-faint" />
                <p className="text-xs text-copy-muted">No specs yet. Generate one from the AI Architect tab.</p>
              </div>
            )}

            {specs.map((spec) => {
              const filename = specFilename(spec);
              const date = new Date(spec.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => openPreview(spec)}
                  className="w-full rounded-xl border border-surface-border bg-elevated p-3 text-left hover:bg-subtle transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai/15 shrink-0">
                      <FileText className="h-4 w-4 text-ai-text" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-copy-primary leading-tight truncate">
                        {filename}
                      </p>
                      <p className="text-[10px] text-copy-muted mt-0.5">{date}</p>
                    </div>
                    <button
                      type="button"
                      title="Download spec"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerDownload(`/api/projects/${projectId}/specs/${spec.id}/download`);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-copy-muted hover:text-copy-primary hover:bg-subtle opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Spec Preview Modal */}
      <Dialog
        open={previewSpec !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewSpec(null);
            setPreviewContent(null);
            setPreviewError(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl bg-surface border-surface-border text-copy-primary">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-copy-primary flex items-center gap-2">
              <FileText className="h-4 w-4 text-ai-text shrink-0" />
              <span className="truncate">
                {previewSpec ? specFilename(previewSpec) : ""}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-end mb-2">
            {previewSpec && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  triggerDownload(
                    `/api/projects/${projectId}/specs/${previewSpec.id}/download`
                  )
                }
                className="text-xs bg-subtle border-surface-border text-copy-primary hover:bg-elevated gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            )}
          </div>

          <ScrollArea className="h-[60vh] rounded-xl border border-surface-border bg-elevated p-4">
            {previewLoading && (
              <div className="flex items-center justify-center h-32 gap-2 text-copy-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Loading…</span>
              </div>
            )}
            {previewError && (
              <div className="flex items-center justify-center h-32">
                <p className="text-xs text-error">Failed to load spec content.</p>
              </div>
            )}
            {previewContent && (
              <div className="text-copy-primary [&_h1]:text-copy-primary [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mb-2 [&_h2]:text-copy-primary [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-1.5 [&_h3]:text-copy-primary [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:mb-1 [&_p]:text-copy-muted [&_p]:text-xs [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:text-copy-muted [&_li]:text-xs [&_li]:mb-0.5 [&_code]:bg-subtle [&_code]:text-brand [&_code]:rounded [&_code]:px-1 [&_code]:text-xs [&_pre]:bg-subtle [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_strong]:text-copy-primary [&_a]:text-brand [&_a]:underline [&_hr]:border-surface-border [&_hr]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-surface-border [&_blockquote]:pl-3 [&_blockquote]:text-copy-muted [&_blockquote]:text-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewContent}</ReactMarkdown>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
