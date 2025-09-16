import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/config/server-config";
import type { Server as ServerType } from "@/types/type.d.ts";

import { NextRequest, NextResponse } from "next/server";
import { Profile, Server } from "@/models/models.server";
import { v4 as uuidv4 } from "uuid";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    const { serverId } = await params;

    if (!serverId) {
      return NextResponse.json(
        { message: "Server ID is required" },
        { status: 400 }
      );
    }
    const tokens = await getTokens(request.cookies, authConfig);
    if (!tokens) {
      return NextResponse.json(
        { message: "User is not authenticated" },
        { status: 401 }
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
    await server.load(serverId);
    if (!server) {
      return NextResponse.json(
        { message: "Server not found" },
        { status: 404 }
      );
    }
    server.inviteCode = uuidv4();
    await server.save();
    return NextResponse.json(server.toPlainObject() as ServerType, {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
