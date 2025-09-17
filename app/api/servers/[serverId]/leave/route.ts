import { initialProfile } from "@/actions/user-actions";
import { Server } from "@/models/models.server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { serverId: string } }
) {
  try {
    const profile = await initialProfile();
    if (!profile) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { serverId } = await params;

    if (!serverId) {
      return NextResponse.json({ message: "Bad request" }, { status: 400 });
    }

    const server = new Server();
    await server.load(serverId);

    if (!server.getId()) {
      return NextResponse.json(
        { message: "Server not found" },
        { status: 404 }
      );
    }
    // check is user created this server
    if (server.profileId === profile.userId) {
      return NextResponse.json(
        { message: "You are the owner of this server. You cannot leave it." },
        { status: 403 }
      );
    }

    const members = await server.loadMembers();
    const isMember = members.find((m) => m.profileId === profile.userId);

    if (!isMember) {
      return NextResponse.json(
        { message: "You are not a member of this server" },
        {
          status: 403,
        }
      );
    }

    await isMember.destroy();

    return NextResponse.json(
      { message: "You have left the server successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
