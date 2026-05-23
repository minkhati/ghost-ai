import { NextResponse } from "next/server";
import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3";
import type { generateSpec } from "@/trigger/generate-spec";
import { z } from "zod";

const bodySchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string().optional(),
      shape: z.string().optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      label: z.string().optional(),
    })
  ),
});

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;

  // Project access is resolved from roomId only — never trust a client-supplied projectId
  const project = await getProjectWithAccess(roomId, identity.userId, identity.email);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
    projectId: project.id,
    roomId,
    chatHistory,
    nodes,
    edges,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId: identity.userId,
    },
  });

  return NextResponse.json({ runId: handle.id });
}
