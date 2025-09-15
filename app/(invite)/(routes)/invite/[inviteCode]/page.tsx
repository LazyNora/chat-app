import { initialProfile } from "@/actions/user-actions";
import React from "react";
import { redirect } from "next/navigation";
import { Member, Server } from "@/models/models.server";

interface InviteCodePageProps {
  params: {
    inviteCode: string;
  };
}
const InviteCodePage = async ({ params }: InviteCodePageProps) => {
  const profile = await initialProfile();
  if (!profile) {
    return redirect("/login");
  }
  const { inviteCode } = await params;

  if (!inviteCode) {
    return redirect("/");
  }

  const server = await Server.findOne<Server>("inviteCode", "==", inviteCode);
  if (!server) {
    return <div>Invalid invite code</div>;
  }
  const members = await server.loadMembers();
  const isMember = members?.find((m) => m.profileId === profile.getId());
  if (isMember) {
    return redirect(`/servers/${server.getId()}`);
  }

  const newMember = new Member();
  newMember.profileId = profile.getId();
  newMember.serverId = server.getId();
  await newMember.save();
  if (newMember) {
    return redirect(`/servers/${server.getId()}`);
  }

  return null;
};

export default InviteCodePage;
