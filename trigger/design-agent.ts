import { task, logger } from "@trigger.dev/sdk/v3";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { LiveMap, LiveObject, LsonObject } from "@liveblocks/node";
import { getLiveblocks } from "@/lib/liveblocks";
import { NODE_COLORS, SHAPE_SIZES } from "@/types/canvas";
import type { ShapeType } from "@/types/canvas";

const AI_USER_ID = "ghost-ai";
const AI_USER_INFO = { name: "Ghost AI", avatar: "", color: "#6457f9" };

// ─── Zod schemas for Gemini structured output ────────────────────────────────

const ShapeTypeSchema = z.enum([
  "rectangle", "diamond", "circle", "pill", "cylinder", "hexagon",
]);

const DesignNodeSchema = z.object({
  id: z.string().describe("Unique kebab-case ID like 'api-gateway'"),
  label: z.string().describe("Short display label"),
  shape: ShapeTypeSchema,
  colorIndex: z.number().int().min(0).max(7).describe(
    "0=Neutral, 1=Blue, 2=Purple, 3=Orange, 4=Red, 5=Pink, 6=Green, 7=Teal"
  ),
  x: z.number().describe("X position in pixels"),
  y: z.number().describe("Y position in pixels"),
});

const DesignEdgeSchema = z.object({
  id: z.string().describe("Unique edge ID"),
  source: z.string().describe("Source node ID"),
  target: z.string().describe("Target node ID"),
  label: z.string().optional().describe("Optional short edge label"),
});

const ActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add_node"), node: DesignNodeSchema }),
  z.object({
    type: z.literal("move_node"),
    id: z.string(),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    type: z.literal("resize_node"),
    id: z.string(),
    width: z.number(),
    height: z.number(),
  }),
  z.object({
    type: z.literal("update_node"),
    id: z.string(),
    label: z.string().optional(),
    colorIndex: z.number().int().min(0).max(7).optional(),
    shape: ShapeTypeSchema.optional(),
  }),
  z.object({ type: z.literal("delete_node"), id: z.string() }),
  z.object({ type: z.literal("add_edge"), edge: DesignEdgeSchema }),
  z.object({ type: z.literal("delete_edge"), id: z.string() }),
]);

const DesignOutputSchema = z.object({
  summary: z.string().describe("1–2 sentence summary of what was designed"),
  actions: z.array(ActionSchema),
});

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Ghost AI, an expert software architect designing systems on a collaborative canvas.

Node shapes — choose the best fit:
- rectangle: general-purpose node (default, 160×80)
- diamond: decision / gateway (140×100)
- circle: event / endpoint (100×100)
- pill: service / process (160×60)
- cylinder: database / storage (100×120)
- hexagon: external system / boundary (120×110)

Color index guidelines:
- 0 Neutral: labels, containers, misc
- 1 Blue: services, APIs, application servers
- 2 Purple: AI / ML components
- 3 Orange: queues, message brokers, async
- 4 Red: databases, critical data stores
- 5 Pink: gateways, load balancers, interfaces
- 6 Green: monitoring, health checks, success paths
- 7 Teal: external systems, third-party services

Layout rules:
- Flow left-to-right or top-to-bottom
- Leave 80–120 px between node edges
- Center the design around (500, 350)
- Use kebab-case IDs: "api-gateway", "user-db", "auth-service"
- Connect logically related nodes with add_edge actions
- When current nodes exist, build upon or refine them; prefer move/update over delete`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface SimpleNode { id: string; label: string; shape: string; x: number; y: number }
interface SimpleEdge { id: string; source: string; target: string }

function parseExistingCanvas(storage: unknown): { nodes: SimpleNode[]; edges: SimpleEdge[] } {
  try {
    const s = storage as {
      data?: {
        flow?: {
          data?: {
            nodes?: { data?: Record<string, { data?: Record<string, unknown> }> };
            edges?: { data?: Record<string, { data?: Record<string, unknown> }> };
          };
        };
      };
    };
    const flowData = s.data?.flow?.data;
    if (!flowData) return { nodes: [], edges: [] };

    const nodesRaw = Object.values(flowData.nodes?.data ?? {});
    const edgesRaw = Object.values(flowData.edges?.data ?? {});

    const nodes: SimpleNode[] = nodesRaw.map((n) => {
      const d = n.data ?? {};
      const pos = d.position as { x?: number; y?: number } | undefined;
      const nd = d.data as { label?: string; shape?: string } | undefined;
      return {
        id: (d.id as string) ?? "",
        label: nd?.label ?? "",
        shape: nd?.shape ?? "rectangle",
        x: pos?.x ?? 0,
        y: pos?.y ?? 0,
      };
    });

    const edges: SimpleEdge[] = edgesRaw.map((e) => {
      const d = e.data ?? {};
      return {
        id: (d.id as string) ?? "",
        source: (d.source as string) ?? "",
        target: (d.target as string) ?? "",
      };
    });

    return { nodes, edges };
  } catch {
    return { nodes: [], edges: [] };
  }
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

export const designAgent = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload) => {
    const { prompt, roomId } = payload;
    logger.info("Design agent triggered", { prompt, roomId });

    const liveblocks = getLiveblocks();

    // Show AI as present and thinking
    await liveblocks.setPresence(roomId, {
      userId: AI_USER_ID,
      data: { cursor: { x: 500, y: 350 }, thinking: true },
      userInfo: AI_USER_INFO,
      ttl: 300,
    });

    await liveblocks.broadcastEvent(roomId, {
      type: "AI_STATUS",
      message: "Ghost AI is thinking…",
      phase: "thinking",
    });

    try {
      // Read current canvas for context
      let currentCanvas = { nodes: [] as SimpleNode[], edges: [] as SimpleEdge[] };
      try {
        const storage = await liveblocks.getStorageDocument(roomId, "plain-lson");
        currentCanvas = parseExistingCanvas(storage);
      } catch {
        // Empty canvas — proceed without context
      }

      const canvasContext =
        currentCanvas.nodes.length > 0
          ? `Current canvas (${currentCanvas.nodes.length} nodes): ${currentCanvas.nodes
              .map((n) => `${n.id} ("${n.label}", ${n.shape})`)
              .join("; ")}`
          : "The canvas is currently empty.";

      logger.info("Generating design", { canvasContext });

      // Generate design with Gemini
      const { object: design } = await generateObject({
        model: anthropic("claude-sonnet-4-6"),
        schema: DesignOutputSchema,
        system: SYSTEM_PROMPT,
        prompt: `User request: "${prompt}"\n\n${canvasContext}\n\nGenerate the architecture as canvas actions.`,
      });

      logger.info("Design generated", {
        summary: design.summary,
        actionCount: design.actions.length,
      });

      await liveblocks.broadcastEvent(roomId, {
        type: "AI_STATUS",
        message: "Applying design to canvas…",
        phase: "applying",
      });

      // Apply mutations to shared canvas storage
      await liveblocks.mutateStorage(roomId, ({ root }) => {
        // Cast through unknown to escape the empty Storage = {} type constraint
        const r = root as unknown as LiveObject<LsonObject>;

        // Initialise flow storage if the room is brand new
        if (r.get("flow") === undefined) {
          r.set(
            "flow",
            new LiveObject({
              nodes: new LiveMap<string, LiveObject<LsonObject>>(),
              edges: new LiveMap<string, LiveObject<LsonObject>>(),
            })
          );
        }

        const flow = r.get("flow") as LiveObject<LsonObject>;
        const nodesMap = flow.get("nodes") as LiveMap<string, LiveObject<LsonObject>>;
        const edgesMap = flow.get("edges") as LiveMap<string, LiveObject<LsonObject>>;

        for (const action of design.actions) {
          switch (action.type) {
            case "add_node": {
              const { node } = action;
              const colorPair = NODE_COLORS[node.colorIndex] ?? NODE_COLORS[0];
              const size = SHAPE_SIZES[node.shape as ShapeType] ?? SHAPE_SIZES.rectangle;
              nodesMap.set(
                node.id,
                new LiveObject({
                  id: node.id,
                  type: "canvasNode",
                  position: { x: node.x, y: node.y },
                  data: {
                    label: node.label,
                    color: colorPair.bg,
                    textColor: colorPair.text,
                    shape: node.shape,
                  },
                  width: size.width,
                  height: size.height,
                })
              );
              break;
            }

            case "move_node": {
              const node = nodesMap.get(action.id);
              if (node) (node as LiveObject<LsonObject>).set("position", { x: action.x, y: action.y });
              break;
            }

            case "resize_node": {
              const node = nodesMap.get(action.id);
              if (node) {
                (node as LiveObject<LsonObject>).set("width", action.width);
                (node as LiveObject<LsonObject>).set("height", action.height);
              }
              break;
            }

            case "update_node": {
              const node = nodesMap.get(action.id) as LiveObject<LsonObject> | undefined;
              if (node) {
                const currentData = node.get("data") as { label: string; color: string; textColor: string; shape: string };
                const colorPair =
                  action.colorIndex !== undefined
                    ? (NODE_COLORS[action.colorIndex] ?? NODE_COLORS[0])
                    : null;
                node.set("data", {
                  label: action.label ?? currentData.label,
                  color: colorPair ? colorPair.bg : currentData.color,
                  textColor: colorPair ? colorPair.text : currentData.textColor,
                  shape: action.shape ?? currentData.shape,
                });
              }
              break;
            }

            case "delete_node": {
              nodesMap.delete(action.id);
              // Remove any edges that reference this node
              for (const [edgeId, edge] of edgesMap) {
                const e = edge as LiveObject<LsonObject>;
                const src = e.get("source") as string | undefined;
                const tgt = e.get("target") as string | undefined;
                if (src === action.id || tgt === action.id) {
                  edgesMap.delete(edgeId);
                }
              }
              break;
            }

            case "add_edge": {
              const { edge } = action;
              edgesMap.set(
                edge.id,
                new LiveObject({
                  id: edge.id,
                  type: "canvasEdge",
                  source: edge.source,
                  target: edge.target,
                  data: { label: edge.label ?? "" },
                })
              );
              break;
            }

            case "delete_edge": {
              edgesMap.delete(action.id);
              break;
            }
          }
        }
      });

      await liveblocks.broadcastEvent(roomId, {
        type: "AI_STATUS",
        message: design.summary,
        phase: "done",
      });

      logger.info("Design applied", { roomId, summary: design.summary });
      return { success: true, summary: design.summary };
    } catch (error) {
      logger.error("Design agent failed", { error });

      await liveblocks.broadcastEvent(roomId, {
        type: "AI_STATUS",
        message: "Ghost AI encountered an error. Please try again.",
        phase: "error",
      });

      throw error;
    } finally {
      // Clear AI presence (expire in 2 s)
      await liveblocks.setPresence(roomId, {
        userId: AI_USER_ID,
        data: { cursor: null, thinking: false },
        userInfo: AI_USER_INFO,
        ttl: 2,
      });
    }
  },
});
