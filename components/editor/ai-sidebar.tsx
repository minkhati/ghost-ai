"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
      { id: crypto.randomUUID(), role: "assistant", content: "AI generation coming soon." },
    ]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChip = (chip: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: chip },
      { id: crypto.randomUUID(), role: "assistant", content: "AI generation coming soon." },
    ]);
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
        <TabsList
          className="w-full h-10 rounded-none border-b border-surface-border bg-transparent px-3 gap-1 shrink-0 justify-start"
        >
          <TabsTrigger
            value="architect"
            className="flex-1 text-xs rounded-md bg-transparent text-copy-muted data-active:bg-subtle data-active:text-brand data-active:shadow-none"
          >
            AI Architect
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
                      onClick={() => handleChip(chip)}
                      className="text-left text-xs px-3 py-2 rounded-full bg-subtle text-ai-text border border-surface-border hover:bg-elevated transition-colors"
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
                  <div
                    className={
                      msg.role === "user"
                        ? "max-w-[85%] rounded-2xl px-3 py-2 text-xs bg-accent-dim border-2 border-brand/50 text-copy-primary"
                        : "max-w-[85%] rounded-2xl px-3 py-2 text-xs bg-elevated border border-surface-border text-ai-text"
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-surface-border shrink-0 flex flex-col gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your architecture…"
              className="min-h-[72px] max-h-[160px] resize-none text-xs bg-elevated border-surface-border text-copy-primary placeholder:text-copy-muted focus-visible:ring-brand/50"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-full text-xs bg-brand text-primary-foreground hover:bg-brand/90 disabled:opacity-40"
            >
              Send
            </Button>
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent value="specs" className="mt-0 overflow-y-auto">
          <div className="p-3 flex flex-col gap-3">
            <Button
              type="button"
              size="sm"
              className="w-full text-xs bg-brand text-primary-foreground hover:bg-brand/90"
            >
              Generate Spec
            </Button>

            {/* Demo spec card */}
            <div className="rounded-xl border border-surface-border bg-elevated p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai/15 shrink-0">
                  <FileText className="h-4 w-4 text-ai-text" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-copy-primary leading-tight">
                    System Architecture Spec
                  </p>
                  <p className="text-xs text-copy-muted mt-1 leading-relaxed">
                    Defines service boundaries, API contracts, data flow, and deployment topology.
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="flex h-7 w-7 items-center justify-center rounded-md text-copy-muted opacity-40 cursor-not-allowed shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
