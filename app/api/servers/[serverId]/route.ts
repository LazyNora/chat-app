import { initialProfile } from "@/actions/user-actions";
import { Server } from "@/models/models.server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    const profile = await initialProfile();

    if (!profile) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { serverId } = await params;
    if (!serverId) {
      return NextResponse.json(
        { message: "Server ID is required" },
        { status: 400 }
      );
    }

    const { serverName, imageUrl } = await request.json();
    if (!serverName || !imageUrl) {
      return NextResponse.json(
        { message: "Server name and Image URL are required" },
        { status: 400 }
      );
    }
    const server = new Server();
    await server.load(serverId);
    if (!server) {
      return NextResponse.json(
        { message: "Server not found" },
        { status: 404 }
      );
    }

    if (server.profileId !== profile.userId) {
      return NextResponse.json(
        { message: "You do not have permission to edit this server" },
        { status: 403 }
      );
    }
    server.name = serverName;
    server.imageUrl = imageUrl;
    await server.save();
    return NextResponse.json(
      { message: "Server updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
