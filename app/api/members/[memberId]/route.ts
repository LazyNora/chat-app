import { initialProfile } from "@/actions/user-actions";
import { Profile, Server } from "@/models/models.server";
import type { Server as ServerType } from "@/types/types";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const profile = await initialProfile();
    if (!profile) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId");
    if (!serverId) {
      return NextResponse.json("Missing serverId", { status: 400 });
    }
    const { memberId } = await params;
    if (!memberId) {
      return NextResponse.json("Missing memberId", { status: 400 });
    }
    const server = new Server();
    await server.load(serverId);
    const members = await server.loadMembers();
    const member = members.find((m) => m.getId() === memberId);
    if (!member || profile.getId() === member.profileId) {
      return NextResponse.json("Member not found", { status: 404 });
    }

    await member.destroy();

    const updatedMembers = members.filter((m) => m.getId() !== memberId);
    const profileMembers = await Promise.all(
      updatedMembers.map(async (member) => {
        const profile = new Profile();
        await profile.load(member.profileId);
        return profile;
      })
    );

    members.forEach((member, index) => {
      member.profile = profileMembers[index];
    });

    server.members = updatedMembers;

    return NextResponse.json(server.toPlainObject() as ServerType, {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const profile = await initialProfile();
    if (!profile) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId");
    if (!serverId) {
      return NextResponse.json("Missing serverId", { status: 400 });
    }

    const { memberId } = await params;
    if (!memberId) {
      return NextResponse.json("Missing memberId", { status: 400 });
    }
    const { role } = await req.json();
    const server = new Server();
    await server.load(serverId);
    const members = await server.loadMembers();
    const member = server.members?.find((m) => m.getId() === memberId);

    if (!member || profile.getId() === member.profileId) {
      return NextResponse.json("Member not found", { status: 404 });
    }

    member.role = role;
    await member.save();

    const profileMembers = await Promise.all(
      members.map(async (member) => {
        const profile = new Profile();
        await profile.load(member.profileId);
        return profile;
      })
    );

    members.forEach((member, index) => {
      member.profile = profileMembers[index];
    });

    server.members = members;

    return NextResponse.json(server.toPlainObject() as ServerType, {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
