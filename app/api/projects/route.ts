import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ projects });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name: string =
    typeof body?.name === "string" && body.name.trim()
      ? body.name.trim()
      : "Untitled Project";
  const rawId = typeof body?.id === "string" ? body.id.trim() : "";
  const customId = rawId && /^[a-z0-9-]+$/.test(rawId) ? rawId : undefined;

  const project = await prisma.project.create({
    data: { ...(customId ? { id: customId } : {}), ownerId: userId, name },
  });

  return Response.json({ project }, { status: 201 });
}
