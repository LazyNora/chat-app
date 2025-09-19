import { initialProfile } from "@/actions/user-actions";
import ChatHeader from "@/components/chats/chat-header";
import { getOrCreateConversation } from "@/lib/conversation";
import { Member } from "@/models/models.server";
import { redirect } from "next/navigation";
import React from "react";

interface PageProps {
  params: {
    serverId: string;
    memberId: string;
  };
}

const Page = async ({ params }: PageProps) => {
  const profile = await initialProfile();
  if (!profile) {
    return redirect("/login");
  }
  const { serverId, memberId } = await params;

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
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        imageUrl={otherMember.profile?.imageUrl || ""}
        name={otherMember.profile?.name || "Unknown"}
        serverId={serverId}
        type="conversation"
      />
    </div>
  );
};

export default Page;
