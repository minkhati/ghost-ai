import { prisma } from "@/lib/prisma";

export async function getOwnedProjects(userId: string) {
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSharedProjects(email: string) {
  if (!email) return [];
  const records = await prisma.projectCollaborator.findMany({
    where: { email },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });
  return records.map((r) => r.project);
}
