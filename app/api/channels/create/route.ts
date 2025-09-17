import { initialProfile } from "@/actions/user-actions";
import { Channel, Server } from "@/models/models.server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const profile = await initialProfile();

    if (!profile) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json("Missing required fields", { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId");
    if (!serverId) {
      return NextResponse.json("Missing serverId", { status: 400 });
    }

    // Here you would typically create the channel in your database
    const server = new Server();
    await server.load(serverId);
    const members = await server.loadMembers();

    const currentMember = members.find(
      (member) => member.profileId === profile.getId()
    );

    if (!currentMember) {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const canCreateChannel =
      currentMember.role === "ADMIN" || currentMember.role === "MODERATOR";

    if (!canCreateChannel) {
      return NextResponse.json(
        "You don't have permission to create a channel",
        { status: 403 }
      );
    }
    const channel = new Channel();
    channel.name = name;
    channel.type = type;
    channel.serverId = serverId;
    channel.profileId = profile.getId();
    await channel.save();

    return NextResponse.json(
      { message: "Channel created successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating channel:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
