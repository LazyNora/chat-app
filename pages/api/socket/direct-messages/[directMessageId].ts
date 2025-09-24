import { getProfileFromRequest } from "@/actions/user-actions";
import {
  Channel,
  Conversation,
  DirectMessage,
  Message,
  Server,
} from "@/models/models.server";
import { MemberRole, NextApiResponseServerIO } from "@/types/types";
import { NextApiRequest } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (req.method !== "DELETE" && req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  try {
    const profile = await getProfileFromRequest(req);
    if (!profile) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { content } = req.body;
    const { directMessageId, conversationId } = req.query;

    if (!directMessageId && !conversationId) {
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
      conversation.memberOne?.getId() === profile.getId()
        ? conversation.memberTwo
        : conversation.memberOne;

    const directMessage = new DirectMessage();
    await directMessage.load(directMessageId as string);
    if (!directMessage || directMessage.deleted) {
      return res.status(404).json({ message: "Direct message not found" });
    }
    await directMessage.loadMember();
    await directMessage.member?.loadProfile();

    const isMessageOwner =
      directMessage.member?.profileId === member?.profileId;

    if (!isMessageOwner) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const updatedAt = new Date().toISOString();

    if (req.method === "DELETE") {
      if (directMessage.fileUrl && directMessage.fileUrl !== "null") {
        directMessage.fileUrl = "null"; // đợi delete part
      }
      directMessage.deleted = true;
      directMessage.content = "This message has been deleted";
      directMessage.updatedAt = updatedAt;
      await directMessage.save();
    }

    if (req.method === "PATCH") {
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      if (!isMessageOwner) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      directMessage.content = content;
      directMessage.updatedAt = updatedAt;
      await directMessage.save();
    }

    const updateKey = `chat:${conversationId}:messages:update`;
    res?.socket.server.io.emit(updateKey, directMessage);
    return res.status(200).json({ message: "Message update", data: directMessage });
  } catch (error) {
    console.error("Error handling message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
