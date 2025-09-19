import { initialProfile } from "@/actions/user-actions";
import { Channel, Server } from "@/models/models.server";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const profile = await initialProfile();
    if (!profile) {
      return NextResponse.json(
        { message: "User is not authenticated" },
        { status: 401 }
      );
    }

    const { channelId } = await params;
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId");
    if (!channelId) {
      return NextResponse.json(
        { message: "Channel ID is required" },
        { status: 400 }
      );
    }
    if (!serverId) {
      return NextResponse.json(
        { message: "Server ID is required" },
        { status: 400 }
      );
    }

    const server = new Server();
    await server.load(serverId);
    await server.loadMembers();

    if (!server) {
      return NextResponse.json(
        { message: "Server not found" },
        { status: 404 }
      );
    }

    const currentMember = server.members?.find(
      (m) => m.profileId === profile.getId()
    );

    if (!currentMember) {
      return NextResponse.json(
        { message: "You are not a member of this server" },
        { status: 403 }
      );
    }

    if (currentMember.role !== "ADMIN" && currentMember.role !== "MODERATOR") {
      return NextResponse.json(
        { message: "You do not have permission to delete channels" },
        { status: 403 }
      );
    }
    const channel = new Channel();
    await channel.load(channelId);

    if (channel.name === "general") {
      return NextResponse.json(
        { message: "Cannot delete the general channel" },
        { status: 403 }
      );
    }

    await channel.destroy();

    return NextResponse.json(
      { message: "Channel deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const profile = await initialProfile();
    if (!profile) {
      return NextResponse.json(
        { message: "User is not authenticated" },
        { status: 401 }
      );
    }

    const { name, type } = await req.json();
    if (!name || !type) {
      return NextResponse.json(
        { message: "Name and type are required" },
        { status: 400 }
      );
    }
    if (name === "general") {
      return NextResponse.json(
        { message: "Channel name cannot be 'general'" },
        { status: 400 }
      );
    }

    const { channelId } = await params;
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId");
    if (!channelId) {
      return NextResponse.json(
        { message: "Channel ID is required" },
        { status: 400 }
      );
    }
    if (!serverId) {
      return NextResponse.json(
        { message: "Server ID is required" },
        { status: 400 }
      );
    }

    const server = new Server();
    await server.load(serverId);
    await server.loadMembers();

    if (!server) {
      return NextResponse.json(
        { message: "Server not found" },
        { status: 404 }
      );
    }

    const currentMember = server.members?.find(
      (m) => m.profileId === profile.getId()
    );

    if (!currentMember) {
      return NextResponse.json(
        { message: "You are not a member of this server" },
        { status: 403 }
      );
    }

    if (currentMember.role !== "ADMIN" && currentMember.role !== "MODERATOR") {
      return NextResponse.json(
        { message: "You do not have permission to delete channels" },
        { status: 403 }
      );
    }
    const channel = new Channel();
    await channel.load(channelId);

    channel.name = name;
    channel.type = type;
    await channel.save();

    return NextResponse.json(
      { message: "Channel updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message },
      { status: 500 }
    );
  }
}
