import { NextResponse } from "next/server";
import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3";
import type { designAgent } from "@/trigger/design-agent";

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : null;
  const roomId = typeof body?.roomId === "string" ? body.roomId.trim() : null;
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : null;

  if (!prompt || !roomId || !projectId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const project = await getProjectWithAccess(projectId, identity.userId, identity.email);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof designAgent>("design-agent", { prompt, roomId });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId,
      userId: identity.userId,
    },
  });

  return NextResponse.json({ runId: handle.id });
}
