import { Conversation, Member } from "@/models/models.server";
import React from "react";

const Page = async () => {
  const memberOneId = "rcIdtWcPW0d0tsLwaOOYHhOkxUG2";
  const memberTwoId = "CVTvjnhJJ5NmKvbOxvwqf25knGy1";
  const serverId = "8COCcUpEEeNUcZeHw5IQ";

  // const conversation = new Conversation();
  // // conversation.memberOneId = "rcIdtWcPW0d0tsLwaOOYHhOkxUG2";
  // // conversation.memberTwoId = "CVTvjnhJJ5NmKvbOxvwqf25knGy1";
  // // await conversation.save();

  // // console.log("Created conversation:", conversation);
  // await conversation.load("HJl1uqwuG4hOfTuOeoMw");

  // const conversation = await Conversation.query<Conversation>()
  //   .where("memberOneId", "==", memberOneId)
  //   .where("memberTwoId", "==", memberTwoId)
  //   .get();
  // console.log("conversation:", conversation);
  // const memberOne = await conversation[0].loadMemberOne();
  // const memberTwo = await conversation[0].loadMemberTwo();
  // console.log("memberOne:", memberOne);
  // console.log("memberTwo:", memberTwo);

  //   conversation: [
  //   Conversation {
  //     id: '6Zwa45vw8pgYxd89VACG',
  //     memberOneId: 'rcIdtWcPW0d0tsLwaOOYHhOkxUG2',
  //     memberTwoId: 'CVTvjnhJJ5NmKvbOxvwqf25knGy1',
  //     directMessages: undefined,
  //     memberOne: undefined,
  //     memberTwo: undefined
  //   },
  //   Conversation {
  //     id: 'HJl1uqwuG4hOfTuOeoMw',
  //     memberOneId: 'rcIdtWcPW0d0tsLwaOOYHhOkxUG2',
  //     memberTwoId: 'CVTvjnhJJ5NmKvbOxvwqf25knGy1',
  //     directMessages: undefined,
  //     memberOne: undefined,
  //     memberTwo: undefined
  //   },
  //   Conversation {
  //     id: 'nWCs5X53goqDEvJGrX7W',
  //     memberOneId: 'rcIdtWcPW0d0tsLwaOOYHhOkxUG2',
  //     memberTwoId: 'CVTvjnhJJ5NmKvbOxvwqf25knGy1',
  //     directMessages: undefined,
  //     memberOne: undefined,
  //     memberTwo: undefined
  //   }
  // ]
  // memberOne: undefined
  // memberTwo: undefined

  const conversation = new Conversation();
  await conversation.load("9Wy4ZFj1aOLGavfgIi4G");
  console.log("Loaded conversation:", conversation);
  await conversation.loadMemberOne(); // undifined
  await conversation.loadMemberTwo(); // undifined
  console.log("Loaded conversation with members:", conversation);

  // const memberOne = await Member.query<Member>()
  //   .where("profileId", "==", "6OsqGeyrkdCksbpz9H2p")
  //   .where("serverId", "==", "8COCcUpEEeNUcZeHw5IQ")
  //   .get();
  // const memberTwo = await Member.query<Member>()
  //   .where("profileId", "==", "sSzKlAq1lk8h46Getcae")
  //   .where("serverId", "==", "8COCcUpEEeNUcZeHw5IQ")
  //   .get();
  // console.log("Loaded members:", memberOne, memberTwo);
  // await memberOne[0].loadProfile();
  // await memberTwo[0].loadProfile();
  // console.log("Loaded members with profile:", memberOne, memberTwo);

  return <div>Page</div>;
};

export default Page;
