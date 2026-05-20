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

  let blobUrl: URL;
  try {
    blobUrl = new URL(project.canvasJsonPath);
  } catch {
    return Response.json({ error: "Invalid canvas blob URL" }, { status: 502 });
  }
  if (
    blobUrl.protocol !== "https:" ||
    !blobUrl.hostname.endsWith(".blob.vercel-storage.com")
  ) {
    return Response.json({ error: "Canvas blob URL not allowed" }, { status: 502 });
  }

  const blobAbort = new AbortController();
  const blobTimer = setTimeout(() => blobAbort.abort(), 10_000);
  let blobRes: Response;
  try {
    blobRes = await fetch(blobUrl.href, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN ?? ""}` },
      signal: blobAbort.signal,
    });
  } catch (err) {
    clearTimeout(blobTimer);
    if (err instanceof Error && err.name === "AbortError") {
      return Response.json({ error: "Canvas blob fetch timed out" }, { status: 504 });
    }
    return Response.json({ error: "Failed to fetch canvas blob" }, { status: 502 });
  }
  clearTimeout(blobTimer);
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
