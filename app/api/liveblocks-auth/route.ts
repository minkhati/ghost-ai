import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";
import { getLiveblocks, getCursorColor } from "@/lib/liveblocks";

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const room = typeof body?.room === "string" ? body.room : null;
  if (!room) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const project = await getProjectWithAccess(room, identity.userId, identity.email);
  if (!project) {
    return new Response("Forbidden", { status: 403 });
  }

  const user = await currentUser();
  const name =
    user?.fullName ?? user?.firstName ?? user?.username ?? identity.email;
  const avatar = user?.imageUrl ?? "";

  const liveblocks = getLiveblocks();
  await liveblocks.getOrCreateRoom(room, { defaultAccesses: [] });
  await liveblocks.updateRoom(room, {
    usersAccesses: { [identity.userId]: ["room:write"] },
  });

  const { status, body: responseBody } = await liveblocks.identifyUser(
    { userId: identity.userId, groupIds: [] },
    { userInfo: { name, avatar, color: getCursorColor(identity.userId) } }
  );

  return new Response(responseBody, { status });
}
