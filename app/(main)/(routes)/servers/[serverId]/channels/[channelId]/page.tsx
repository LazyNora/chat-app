import { initialProfile } from "@/actions/user-actions";
import ChatHeader from "@/components/chats/chat-header";
import { Channel, Member } from "@/models/models.server";
import { redirect } from "next/navigation";
import React from "react";
interface PageProps {
  params: {
    serverId: string;
    channelId: string;
  };
}
const Page = async ({ params }: PageProps) => {
  const profile = await initialProfile();
  if (!profile) {
    return redirect("/login");
  }

  const { serverId, channelId } = await params;

  const channel = new Channel();
  await channel.load(channelId);
  const member = await Member.query()
    .where("profileId", "==", profile.getId())
    .where("serverId", "==", serverId)
    .get();
  if (!channel || !member || member.length === 0) {
    return redirect("/"); // User is not a member of this server
  }
  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader name={channel.name} serverId={serverId} type="channel" />
    </div>
  );
};

export default Page;
