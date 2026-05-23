import { NextResponse } from "next/server";
import { getCurrentIdentity } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { auth } from "@trigger.dev/sdk/v3";

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const runId = typeof body?.runId === "string" ? body.runId.trim() : null;
  if (!runId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({ where: { runId } });
  if (!taskRun || taskRun.userId !== identity.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await auth.createPublicToken({
    scopes: { read: { runs: [runId] } },
    expirationTime: "1h",
  });

  return NextResponse.json({ token });
}
