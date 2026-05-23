import type { LiveList, LiveObject } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {
      aiStatusFeed: LiveObject<{
        text?: string;
        isActive: boolean;
        phase?: "start" | "thinking" | "applying" | "done" | "error";
      }>;
      aiChatFeed: LiveList<{
        sender: string;
        role: "user" | "assistant";
        content: string;
        timestamp: number;
      }>;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    RoomEvent:
      | { type: "AI_STATUS"; message: string; phase: "start" | "thinking" | "applying" | "done" | "error" };

    ThreadMetadata: {};
    RoomInfo: {};
  }
}

export {};
