import { schemaTask, logger, metadata } from "@trigger.dev/sdk/v3";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

// ─── Input schemas ────────────────────────────────────────────────────────────

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const nodeSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  shape: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});

const payloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Ghost AI, an expert software architect. Generate a concise, well-structured technical specification document in Markdown.

Structure the document as follows:
## System Overview
A 2–4 sentence summary of the overall architecture.

## Components
A subsection for each node describing its role and responsibilities.

## Service Interactions
Describe the data flows and relationships between components, derived from the connections.

## Design Decisions
Key architectural choices and trade-offs derived from the design conversation.

## Implementation Notes
Practical guidance: deployment considerations, scaling concerns, suggested technologies.

Rules:
- Use proper Markdown (##, ###, bullets, inline code for names)
- Be technically precise and concise
- Use the node labels and shapes to infer each component's role
- If there is no conversation history, omit the Design Decisions section
- Return only the Markdown document — no preamble, no trailing commentary`;

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildUserPrompt(
  nodes: z.infer<typeof nodeSchema>[],
  edges: z.infer<typeof edgeSchema>[],
  chatHistory: z.infer<typeof chatMessageSchema>[]
): string {
  const nodesText =
    nodes.length > 0
      ? nodes
          .map((n) => `- ${n.id}: "${n.label ?? "unlabeled"}" (${n.shape ?? "rectangle"})`)
          .join("\n")
      : "No nodes defined.";

  const edgesText =
    edges.length > 0
      ? edges
          .map((e) => `- ${e.source} → ${e.target}${e.label ? ` [${e.label}]` : ""}`)
          .join("\n")
      : "No connections defined.";

  const historyText =
    chatHistory.length > 0
      ? chatHistory
          .map((m) => `${m.role === "user" ? "User" : "Ghost AI"}: ${m.content}`)
          .join("\n")
      : "";

  return [
    `Architecture Components (${nodes.length} nodes):\n${nodesText}`,
    `\nConnections (${edges.length} edges):\n${edgesText}`,
    historyText ? `\nDesign Conversation:\n${historyText}` : "",
    "\nGenerate the complete technical specification document.",
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: payloadSchema,
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    randomize: true,
  },
  run: async (payload) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;

    logger.info("Spec generation triggered", {
      projectId,
      roomId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      historyLength: chatHistory.length,
    });

    metadata.set("status", "starting");
    metadata.set("nodeCount", nodes.length);
    metadata.set("edgeCount", edges.length);

    try {
      metadata.set("status", "generating");

      const userPrompt = buildUserPrompt(nodes, edges, chatHistory);

      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });

      const specUUID = randomUUID();
      const blob = await put(`specs/${projectId}/${specUUID}.md`, text, {
        access: "private",
        contentType: "text/markdown",
        addRandomSuffix: false,
      });

      const projectSpec = await prisma.projectSpec.create({
        data: { projectId, filePath: blob.url },
      });

      metadata.set("status", "complete");
      metadata.set("specLength", text.length);
      metadata.set("specId", projectSpec.id);

      logger.info("Spec generated", { projectId, specId: projectSpec.id, length: text.length });
      return { spec: text, specId: projectSpec.id };
    } catch (error) {
      metadata.set("status", "error");
      logger.error("Spec generation failed", { error, projectId });
      throw error;
    }
  },
});
