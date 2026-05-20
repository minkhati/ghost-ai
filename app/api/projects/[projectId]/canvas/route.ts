import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";

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

  if (!project.canvasJsonPath) {
    return Response.json({ error: "No saved canvas" }, { status: 404 });
  }

  const blobRes = await fetch(project.canvasJsonPath, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN ?? ""}` },
  });
  if (!blobRes.ok) {
    return Response.json({ error: "Failed to fetch canvas blob" }, { status: 502 });
  }

  const canvas = await blobRes.json();
  return Response.json(canvas);
}

export async function PUT(
  request: Request,
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

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const blob = await put(`canvas/${projectId}.json`, JSON.stringify(body), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  });

  return Response.json({ url: blob.url });
}
