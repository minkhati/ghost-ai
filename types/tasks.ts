import { z } from "zod";

export const aiStatusFeedSchema = z.object({
  text: z.string().optional(),
  isActive: z.boolean(),
  phase: z.enum(["start", "thinking", "applying", "done", "error"]).optional(),
});

export type AiStatusFeedPayload = z.infer<typeof aiStatusFeedSchema>;

export const chatMessageSchema = z.object({
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
