import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, specId } = await params;

  const project = await getProjectWithAccess(projectId, identity.userId, identity.email);
  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const spec = await prisma.projectSpec.findUnique({ where: { id: specId } });
  if (!spec) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (spec.projectId !== projectId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let blobUrl: URL;
  try {
    blobUrl = new URL(spec.filePath);
  } catch {
    return Response.json({ error: "Invalid spec blob URL" }, { status: 502 });
  }
  if (
    blobUrl.protocol !== "https:" ||
    !blobUrl.hostname.endsWith(".blob.vercel-storage.com")
  ) {
    return Response.json({ error: "Spec blob URL not allowed" }, { status: 502 });
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
      return Response.json({ error: "Spec blob fetch timed out" }, { status: 504 });
    }
    return Response.json({ error: "Failed to fetch spec blob" }, { status: 502 });
  }
  clearTimeout(blobTimer);

  if (!blobRes.ok) {
    return Response.json({ error: "Failed to fetch spec blob" }, { status: 502 });
  }

  const markdown = await blobRes.text();

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
    },
  });
}
