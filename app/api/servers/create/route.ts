import { authConfig } from "@/config/server-config";
import {
  Channel,
  ChannelType,
  Member,
  MemberRole,
  Profile,
  Server,
} from "@/models/models.server";
import { getTokens } from "next-firebase-auth-edge";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
export async function POST(request: NextRequest) {
  try {
    const tokens = await getTokens(request.cookies, authConfig);
    if (!tokens) {
      return NextResponse.json(
        { message: "User is not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serverName, imageUrl } = body;
    console.log(serverName, imageUrl);

    if (!serverName || typeof imageUrl !== "string") {
      return NextResponse.json(
        { message: "Invalid server name " },
        { status: 400 }
      );
    }

    const profile = await Profile.findOne<Profile>(
      "userId",
      "==",
      tokens.decodedToken.uid
    );

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found for the user" },
        { status: 404 }
      );
    }

    const server = new Server();

    server.name = serverName;
    server.imageUrl = imageUrl || "";
    server.inviteCode = uuidv4();
    server.profileId = profile.userId;

    await server.save();

    const channel = new Channel();
    channel.name = "General";
    channel.type = ChannelType.TEXT;
    channel.serverId = server.getId();
    channel.profileId = profile.getId();
    await channel.save();

    const menmber = new Member();
    menmber.profileId = profile.getId();
    menmber.serverId = server.getId();
    menmber.role = MemberRole.ADMIN;
    await menmber.save();

    return NextResponse.json(
      {
        message: "Server created successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Server creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create server" },
      { status: 500 }
    );
  }
}
