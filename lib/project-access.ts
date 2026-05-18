import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentIdentity(): Promise<{ userId: string; email: string } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  return { userId, email };
}

export async function getProjectWithAccess(roomId: string, userId: string, email: string) {
  const project = await prisma.project.findUnique({ where: { id: roomId } });
  if (!project) return null;
  if (project.ownerId === userId) return project;
  if (!email) return null;
  const collab = await prisma.projectCollaborator.findFirst({
    where: { projectId: project.id, email },
  });
  return collab ? project : null;
}
