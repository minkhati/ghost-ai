import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

interface EnrichedCollaborator {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

async function enrichEmails(emails: string[]): Promise<EnrichedCollaborator[]> {
  if (emails.length === 0) return [];
  const client = await clerkClient();
  return Promise.all(
    emails.map(async (email) => {
      try {
        const res = await client.users.getUserList({ emailAddress: [email], limit: 1 });
        const user = res.data[0] ?? null;
        return {
          email,
          displayName: user
            ? (user.fullName ?? user.username ?? user.firstName ?? null)
            : null,
          avatarUrl: user?.imageUrl ?? null,
        };
      } catch {
        return { email, displayName: null, avatarUrl: null };
      }
    })
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getCurrentIdentity();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const project = await getProjectWithAccess(projectId, identity.userId, identity.email);
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const records = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  const collaborators = await enrichEmails(records.map((r) => r.email));
  return Response.json({ collaborators });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getCurrentIdentity();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const project = await getProjectWithAccess(projectId, identity.userId, identity.email);
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  if (project.ownerId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    await prisma.projectCollaborator.create({ data: { projectId, email } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json({ error: "Already a collaborator" }, { status: 409 });
    }
    throw e;
  }

  const [enriched] = await enrichEmails([email]);
  return Response.json({ collaborator: enriched }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getCurrentIdentity();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const project = await getProjectWithAccess(projectId, identity.userId, identity.email);
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  if (project.ownerId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return Response.json({ error: "Email required" }, { status: 400 });
  }

  await prisma.projectCollaborator.deleteMany({ where: { projectId, email } });

  return new Response(null, { status: 204 });
}
