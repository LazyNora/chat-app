import { Conversation, Member, Profile } from "@/models/models.server";

export const getOrCreateConversation = async (
  memberOneId: string,
  memberTwoId: string,
  serverId: string
) => {
  // Tìm cuộc trò chuyện giữa hai thành viên (cả 2 chiều)
  let conversation = await findConversationWithMembers(
    memberOneId,
    memberTwoId,
    serverId
  );

  if (!conversation) {
    // Nếu không tìm thấy, tạo cuộc trò chuyện mới
    conversation = await createConversation(memberOneId, memberTwoId, serverId);
  }

  return conversation;
};

const findConversationWithMembers = async (
  memberOneId: string,
  memberTwoId: string,
  serverId: string
) => {
  try {
    // Tìm conversation theo cả 2 chiều (A->B hoặc B->A)
    let conversationId = await findConversation(
      memberOneId,
      memberTwoId,
      serverId
    );

    if (!conversationId) {
      conversationId = await findConversation(
        memberTwoId,
        memberOneId,
        serverId
      );
    }

    if (!conversationId) {
      return null;
    }


    const memberOne = await Member.query<Member>()
      .where("profileId", "==", memberOneId)
      .where("serverId", "==", serverId)
      .get();
    const memberTwo = await Member.query<Member>()
      .where("profileId", "==", memberTwoId)
      .where("serverId", "==", serverId)
      .get();
    if (!memberOne || !memberTwo) {
      return null;
    }

    const conversation = new Conversation();
    await conversation.load(conversationId);
    // Load members and profiles sau khi tạo
    conversation.memberOne = memberOne[0];
    conversation.memberTwo = memberTwo[0];

    const profileMemberOne = await Profile.findOne<Profile>(
      "userId",
      "==",
      conversation.memberOne.profileId
    );
    const profileMemberTwo = await Profile.findOne<Profile>(
      "userId",
      "==",
      conversation.memberTwo.profileId
    );
    conversation.memberOne.profile = profileMemberOne || undefined;
    conversation.memberTwo.profile = profileMemberTwo || undefined;



    return conversation;
  } catch (error) {
    console.error("Error finding conversation with members:", error);
    return null;
  }
};

const findConversation = async (
  memberOneId: string,
  memberTwoId: string,
  serverId: string
) => {
  try {
    const memberOne = await Member.query<Member>()
      .where("profileId", "==", memberOneId)
      .where("serverId", "==", serverId)
      .get();

    const memberTwo = await Member.query<Member>()
      .where("profileId", "==", memberTwoId)
      .where("serverId", "==", serverId)
      .get();

    console.log("Member IDs:", memberOne[0]?.getId(), memberTwo[0]?.getId());

    const queryConversation = await Conversation.query<Conversation>()
      .where("memberOneId", "==", memberOne[0].getId())
      .where("memberTwoId", "==", memberTwo[0].getId())
      .get();

    if (!queryConversation || queryConversation.length === 0) {
      return null;
    }

    return queryConversation[0].getId();
  } catch (error) {
    console.error("Error finding conversation:", error);
    return null;
  }
};

const createConversation = async (
  memberOneId: string,
  memberTwoId: string,
  serverId: string
) => {
  const memberOne = await Member.query<Member>()
    .where("profileId", "==", memberOneId)
    .where("serverId", "==", serverId)
    .get();
  const memberTwo = await Member.query<Member>()
    .where("profileId", "==", memberTwoId)
    .where("serverId", "==", serverId)
    .get();

  const conversation = new Conversation();
  conversation.memberOneId = memberOne[0].getId();
  conversation.memberTwoId = memberTwo[0].getId();
  await conversation.save();  

  // Load members and profiles sau khi tạo
  conversation.memberOne = memberOne[0];
  conversation.memberTwo = memberTwo[0];
  const profileMemberOne = await Profile.findOne<Profile>(
    "userId",
    "==",
    conversation.memberOne.profileId
  );
  const profileMemberTwo = await Profile.findOne<Profile>(
    "userId",
    "==",
    conversation.memberTwo.profileId
  );
  conversation.memberOne.profile = profileMemberOne || undefined;
  conversation.memberTwo.profile = profileMemberTwo || undefined;
  return conversation;
};
