import { initialProfile } from "@/actions/user-actions";
import ChatHeader from "@/components/chats/chat-header";
import ChatInput from "@/components/chats/chat-input";
import ChatMessages from "@/components/chats/chat-messages";
import MediaRoom from "@/components/media-room";
import { Channel, Member } from "@/models/models.server";
import { ChannelType, type Member as MemberType } from "@/types/types";
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
    <div className=" dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader name={channel.name} serverId={serverId} type="channel" />
      {channel.type === ChannelType.TEXT && (
        <div>
          <div className="flex-1 overflow-y-auto ">
            <ChatMessages
              member={member[0].toPlainObject() as MemberType}
              name={channel.name}
              chatId={channelId}
              type="channel"
              apiUrl={"/api/messages"}
              socketUrl={"/api/socket/messages"}
              socketQuery={{
                channelId: channel.getId(),
                serverId: channel.serverId,
              }}
              paramKey="channelId"
              paramValue={channel.getId()}
            />
          </div>
          <ChatInput
            name={channel.name}
            apiUrl={`/api/socket/messages`}
            type="channel"
            query={{ channelId: channel.getId(), serverId: channel.serverId }}
            chatId={channelId}
          />
        </div>
      )}
      {channel.type === ChannelType.AUDIO && (
        <MediaRoom chatId={channelId} video={false} audio={true} />
      )}
    </div>
  );
};

export default Page;
