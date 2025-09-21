import { getProfileFromRequest } from "@/actions/user-actions";
import { Channel, Message, Server } from "@/models/models.server";
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
    const { channelId, serverId, messageId } = req.query;

    if (!content || (!channelId && !serverId && !messageId)) {
      return res.status(400).json({ message: "Bad request" });
    }

    const server = new Server();
    await server.load(serverId as string);
    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }

    const members = await server.loadMembers();
    const isMember = members.find((m) => m.profileId === profile.getId());
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const channel = new Channel();
    await channel.load(channelId as string);

    if (!channel || channel.serverId !== server.getId()) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const message = new Message();
    await message.load(messageId as string);

    await message.loadMember();
    await message.member?.loadProfile();

    if (!message || message.deleted) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isMessageOwner = message.memberId === isMember.getId();
    const isAdmin = isMember.role === MemberRole.ADMIN;
    const isModerator = isMember.role === MemberRole.MODERATOR;
    const canModify = isMessageOwner || isAdmin || isModerator;

    if (!canModify) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.method === "DELETE") {
      message.fileUrl = "null"; // đợi delete part
      message.deleted = true;
      message.content = "This message has been deleted";
      await message.save();
    }

    if (req.method === "PATCH") {
      if (!isMessageOwner) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      message.content = content;
      await message.save();
    }

    const updateKey = `chat:${channelId}:messages:update`;
    res?.socket.server.io.emit(updateKey, { action: "update", message });
    return res.status(200).json({ message: "Message update", data: message });
  } catch (error) {
    console.error("Error handling message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
