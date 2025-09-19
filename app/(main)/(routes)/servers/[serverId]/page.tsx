import { initialProfile } from "@/actions/user-actions";
import { Server } from "@/models/models.server";
import { redirect } from "next/navigation";
import React from "react";

interface PageProps {
  params: { serverId: string };
}

const Page = async ({ params }: PageProps) => {
  const profile = await initialProfile();
  if (!profile) {
    return redirect("/login");
  }
  const { serverId } = await params;
  const server = new Server();
  await server.load(serverId);

  const members = await server.loadMembers();
  const isMember = members.find(
    (member) => member.profileId === profile.getId()
  );

  if (!isMember) {
    return redirect("/"); // User is not a member of this server
  }
  await server.loadChannels();
  const generalChannels = server.channels?.find(
    (channel) => channel.name === "general"
  );
  
  if (!generalChannels) {
    return null;
  }
  return redirect(`/servers/${serverId}/channels/${generalChannels.getId()}`);
};

export default Page;
