import { getProfileFromRequest } from "@/actions/user-actions";
import { Channel, Message, Server } from "@/models/models.server";
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
    const { channelId, serverId } = req.query;

    if (!content || (!channelId && !serverId)) {
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
    const createdAt = new Date().toISOString();

    const message = new Message();
    message.content = content;
    message.fileUrl = fileUrl;
    message.channelId = channel.getId();
    message.memberId = isMember.getId();
    message.createdAt = createdAt;
    message.updatedAt = createdAt;

    await message.save();
    await message.loadMember();
    await message.member?.loadProfile();
    const channelKey = `channel:${channelId}:messages`;

    res?.socket.server.io.emit(channelKey, { action: "create", message });

    return res.status(200).json({ message: "Message sent", data: message });
  } catch (error) {
    console.error("Error handling message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
