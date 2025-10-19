import { initialProfile } from "@/actions/user-actions";
import ChatHeader from "@/components/chats/chat-header";
import ChatMessages from "@/components/chats/chat-messages";
import { getOrCreateConversation } from "@/lib/conversation";
import { Member } from "@/models/models.server";
import { redirect } from "next/navigation";
import React from "react";
import type { Member as MemberType } from "@/types/types";
import ChatInput from "@/components/chats/chat-input";
import MediaRoom from "@/components/media-room";

interface PageProps {
  params: {
    serverId: string;
    memberId: string;
  };
  searchParams: {
    video?: boolean;
  };
}

const Page = async ({ params, searchParams }: PageProps) => {
  const profile = await initialProfile();
  if (!profile) {
    return redirect("/login");
  }
  const { serverId, memberId } = await params;
  const { video } = await searchParams;

  const memberResults = await Member.query<Member>()
    .where("profileId", "==", profile.userId)
    .where("serverId", "==", serverId)
    .limit(1)
    .get();

  const currentMember = memberResults[0];
  if (!currentMember) {
    return redirect("/"); // User is not a member of this server
  }

  const conversation = await getOrCreateConversation(
    profile.getId(),
    memberId,
    serverId
  );

  if (!conversation) {
    return redirect(`/servers/${serverId}`); // Conversation could not be created or found
  }

  const { memberOne, memberTwo } = conversation;

  if (!memberOne || !memberTwo) {
    return redirect(`/servers/${serverId}`); // Members not found in the conversation
  }
  const otherMember =
    memberOne.profileId === profile.getId() ? memberTwo : memberOne;
  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-screen">
      <ChatHeader
        imageUrl={otherMember.profile?.imageUrl || ""}
        name={otherMember.profile?.name || "Unknown"}
        serverId={serverId}
        type="conversation"
      />
      {!video ? (
        <>
          <div className="flex-1 overflow-y-auto ">
            <ChatMessages
              member={currentMember.toPlainObject() as MemberType}
              name={otherMember.profile?.name || "Unknown"}
              chatId={conversation.getId()}
              type="conversation"
              apiUrl={"/api/direct-messages"}
              socketUrl={"/api/socket/direct-messages"}
              socketQuery={{
                conversationId: conversation.getId(),
              }}
              paramKey="conversationId"
              paramValue={conversation.getId()}
            />
          </div>
          <ChatInput
            name={otherMember.profile?.name || "Unknown"}
            apiUrl={`/api/socket/direct-messages`}
            type="conversation"
            query={{ conversationId: conversation.getId() }}
            chatId={conversation.getId()}
          />
        </>
      ) : (
        <MediaRoom chatId={conversation.getId()} video={true} audio={true} />
      )}
    </div>
  );
};

export default Page;
