import { redirect } from "next/navigation";
import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";
import { getOwnedProjects, getSharedProjects } from "@/lib/projects";
import { AccessDenied } from "@/components/editor/access-denied";
import { WorkspaceClient } from "@/components/editor/workspace-client";
import type { Project } from "@/hooks/use-project-actions";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function WorkspacePage({ params }: PageProps) {
  const { roomId } = await params;

  const identity = await getCurrentIdentity();
  if (!identity) redirect("/sign-in");

  const { userId, email } = identity;

  const project = await getProjectWithAccess(roomId, userId, email);
  if (!project) return <AccessDenied />;

  const [rawOwned, rawShared] = await Promise.all([
    getOwnedProjects(userId),
    getSharedProjects(email),
  ]);

  const ownedProjects: Project[] = rawOwned.map((p) => ({ id: p.id, name: p.name, owned: true }));
  const sharedProjects: Project[] = rawShared.map((p) => ({ id: p.id, name: p.name, owned: false }));

  return (
    <WorkspaceClient
      project={{ id: project.id, name: project.name }}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
