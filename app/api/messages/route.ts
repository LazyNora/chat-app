import { initialProfile } from "@/actions/user-actions";
import { Message } from "@/models/models.server";
import { NextResponse } from "next/server";
const MESSAGES_BATCH = 20;
export async function GET(request: Request) {
  try {
    // const profile = await initialProfile();
    // if (!profile) {
    //   return NextResponse.json("Unauthorized", { status: 401 });
    // }
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    console.log("Cursor:", cursor);
    const channelId = searchParams.get("channelId");
    if (!channelId) {
      return NextResponse.json("channelId is required", { status: 400 });
    }
    // const messages: Message[] = await (cursor
    //   ? withCursor(parseInt(cursor), channelId)
    //   : withoutCursor(channelId))();
    const messages = await Message.query<Message>()
      .where("channelId", "==", channelId)
      //   .orderBy("createdAt", "desc")
      .limit(MESSAGES_BATCH)
      .offset(cursor ? parseInt(cursor) : 0)
      .get();
    console.log("Messages:", messages);
    const member = await messages[0]?.loadMember();
    await member?.loadProfile();
    console.log("Member:", member);
    await Promise.all(messages.map((m) => m.loadMember()));

    console.log("Messages with members:", messages);
    // messages.reverse(); // Oldest first
    // let nextCursor = null;
    // if (messages.length === MESSAGES_BATCH) {
    //   nextCursor = messages[messages.length - 1];
    // }
    // console.log("Next Cursor:", nextCursor);

    // return NextResponse.json({ items: messages, nextCursor }, { status: 200 });

    return NextResponse.json(
      {
        items: {
          a: "Fadf",
          b: "fasdfasd",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json("Failed to fetch messages", { status: 500 });
  }

  function withCursor(cursor: number, channelId: string) {
    return async () => {
      const messages = await Message.query<Message>()
        .where("channelId", "==", channelId)
        .orderBy("createdAt", "desc")
        .limit(MESSAGES_BATCH)
        .startAfter(cursor)
        .get();
      await Promise.all(
        messages.map((m) => m.loadMember().then(() => m.member?.loadProfile()))
      );
      return messages;
    };
  }
  function withoutCursor(channelId: string) {
    return async () => {
      const messages = await Message.query<Message>()
        .where("channelId", "==", channelId)
        .orderBy("createdAt", "desc")
        .limit(MESSAGES_BATCH)
        .get();
      await Promise.all(
        messages.map((m) => m.loadMember().then(() => m.member?.loadProfile()))
      );
      return messages;
    };
  }
}
