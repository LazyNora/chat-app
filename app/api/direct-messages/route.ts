import { initialProfile } from "@/actions/user-actions";
import { Conversation, DirectMessage, Message } from "@/models/models.server";
import { NextResponse } from "next/server";
const MESSAGES_BATCH = 20;
export async function GET(request: Request) {
  try {
    const profile = await initialProfile();
    if (!profile) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    // const cursor = searchParams.get("cursor");
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json("conversationId are required", {
        status: 400,
      });
    }
    const conversation = new Conversation();
    await conversation.load(conversationId);

    if (!conversation) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    await conversation.loadDirectMessages();
    await conversation.loadMemberOne();
    await conversation.loadMemberTwo();
    await conversation.memberOne?.loadProfile();
    await conversation.memberTwo?.loadProfile();

    // Load member and profile for each direct message
    const messages = conversation.directMessages || [];

    await Promise.all(
      messages.map(async (message) => {
        await message.loadMember();
        await message.member?.loadProfile();
      })
    );

    const messagesSorted = messages.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ items: messagesSorted }, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json("Failed to fetch messages", { status: 500 });
  }
}
