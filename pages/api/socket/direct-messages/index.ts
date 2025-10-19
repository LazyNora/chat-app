import { getProfileFromRequest } from "@/actions/user-actions";
import {
  Channel,
  Conversation,
  DirectMessage,
  Message,
  Server,
} from "@/models/models.server";
import { NextApiResponseServerIO } from "@/types/types";
import { NextApiRequest } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  try {
    const profile = await getProfileFromRequest(req);
    if (!profile) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { content, fileUrl } = req.body;
    const { conversationId } = req.query;

    if (!content || !conversationId) {
      return res.status(400).json({ message: "Bad request" });
    }

    const conversation = new Conversation();
    await conversation.load(conversationId as string);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await conversation.loadMemberOne();
    await conversation.loadMemberTwo();
    await conversation.memberOne?.loadProfile();
    await conversation.memberTwo?.loadProfile();

    const member =
      conversation.memberOne?.profileId === profile.getId()
        ? conversation.memberOne
        : conversation.memberTwo;

    if (!member) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const createdAt = new Date().toISOString();

    const message = new DirectMessage();
    message.content = content;
    message.fileUrl = fileUrl;
    message.conversationId = conversation.getId();
    message.memberId = member.getId();
    message.createdAt = createdAt;
    message.updatedAt = createdAt;

    await message.save();
    await message.loadMember();
    await message.member?.loadProfile();

    const channelKey = `chat:${conversation.getId()}:messages`;

    res?.socket.server.io.emit(channelKey, message);

    return res.status(200).json({ message: "Message sent", data: message });
  } catch (error) {
    console.error("Error handling message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
