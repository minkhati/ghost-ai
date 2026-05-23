import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await getProjectWithAccess(projectId, identity.userId, identity.email);
  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    select: { id: true, filePath: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ specs });
}
