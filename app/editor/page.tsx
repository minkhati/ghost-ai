import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOwnedProjects, getSharedProjects } from "@/lib/projects";
import { EditorHomeClient } from "@/components/editor/editor-home-client";
import type { Project } from "@/hooks/use-project-actions";

export default async function EditorPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  const [rawOwned, rawShared] = await Promise.all([
    getOwnedProjects(userId),
    getSharedProjects(email),
  ]);

  const ownedProjects: Project[] = rawOwned.map((p) => ({ id: p.id, name: p.name, owned: true }));
  const sharedProjects: Project[] = rawShared.map((p) => ({ id: p.id, name: p.name, owned: false }));

  return <EditorHomeClient ownedProjects={ownedProjects} sharedProjects={sharedProjects} />;
}
