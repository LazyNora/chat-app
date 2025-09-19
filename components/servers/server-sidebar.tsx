import { initialProfile } from "@/actions/user-actions";
import { Profile, Server } from "@/models/models.server";
import type { Channel, Member, Server as ServerType } from "@/types/types";

import { redirect } from "next/navigation";
import React from "react";
import ServerHeader from "./server-header";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import ServerSearch from "./server-search";
import { ChannelType, MemberRole } from "@/types/types";
import { Separator } from "@/components/ui/separator";
import ServerSection from "./server-section";
import ServerChannel from "./server-channel";
import ServerMembers from "./server-members";
const iconMap = {
  [ChannelType.TEXT]: "📄",
  [ChannelType.AUDIO]: "🔊",
  [ChannelType.VIDEO]: "📹",
};
const roleIconMap = {
  [MemberRole.GUEST]: "👤",
  [MemberRole.ADMIN]: "👑",
  [MemberRole.MODERATOR]: "🛡️",
};

export const ServerSidebar = async ({ serverId }: { serverId: string }) => {
  const profile = await initialProfile();
  if (!profile) {
    return redirect("/login");
  }
  const server = new Server();
  await server.load(serverId);
  const members = await server.loadMembers();

  const profileMembers = await Promise.all(
    members.map(async (member) => {
      const profile = new Profile();
      await profile.load(member.profileId);
      return profile;
    })
  );

  members.forEach((member, index) => {
    member.profile = profileMembers[index];
  });

  server.members = members;

  await server.loadChannels();
  if (!server) {
    return redirect("/");
  }

  const roleMember = server.members?.find(
    (m) => m.profileId === profile.getId()
  )?.role;

  const textChannels = server?.channels?.filter(
    (channel) => channel.type === ChannelType.TEXT
  );
  const audioChannels = server?.channels?.filter(
    (channel) => channel.type === ChannelType.AUDIO
  );
  const videoChannels = server?.channels?.filter(
    (channel) => channel.type === ChannelType.VIDEO
  );

  const memberAfterFillter = server?.members.filter(
    (member) => member.profileId !== profile.getId()
  );

  const role = server.members.find(
    (member) => member.profileId === profile.getId()
  )?.role;

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
      <ServerHeader
        server={server.toPlainObject() as ServerType}
        role={roleMember}
      />
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          <ServerSearch
            data={[
              {
                label: "Text Channels",
                type: "channel",
                data: textChannels?.map((channel) => ({
                  id: channel.getId(),
                  name: channel.name,
                  icon: iconMap[channel.type],
                })),
              },
              {
                label: "Audio Channels",
                type: "channel",
                data: audioChannels?.map((channel) => ({
                  id: channel.getId(),
                  name: channel.name,
                  icon: iconMap[channel.type],
                })),
              },
              {
                label: "Video Channels",
                type: "channel",
                data: videoChannels?.map((channel) => ({
                  id: channel.getId(),
                  name: channel.name,
                  icon: iconMap[channel.type],
                })),
              },
              {
                label: "Members",
                type: "member",
                data: memberAfterFillter?.map((member) => ({
                  id: member.getId(),
                  name: member.profile?.name || "Unknown",
                  icon: roleIconMap[member.role],
                })),
              },
            ]}
          />
        </div>
        <Separator className="bg-zinc-200 dark:bg-zinc-700 rounded-md my-2" />
        {!!textChannels?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="channels"
              channelType={ChannelType.TEXT}
              role={role}
              label="Text Channels"
            />
            {textChannels.map((channel) => (
              <ServerChannel
                key={channel.getId()}
                channel={channel.toPlainObject() as Channel}
                role={role}
                server={server.toPlainObject() as ServerType}
              />
            ))}
          </div>
        )}
        {!!audioChannels?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="channels"
              channelType={ChannelType.AUDIO}
              role={role}
              label="Audio Channels"
            />
            {audioChannels.map((channel) => (
              <ServerChannel
                key={channel.getId()}
                channel={channel.toPlainObject() as Channel}
                role={role}
                server={server.toPlainObject() as ServerType}
              />
            ))}
          </div>
        )}

        {!!videoChannels?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="channels"
              channelType={ChannelType.VIDEO}
              role={role}
              label="Video Channels"
            />
            {videoChannels.map((channel) => (
              <ServerChannel
                key={channel.getId()}
                channel={channel.toPlainObject() as Channel}
                role={role}
                server={server.toPlainObject() as ServerType}
              />
            ))}
          </div>
        )}
        {!!memberAfterFillter?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="members"
              role={role}
              label="Members"
              server={server.toPlainObject() as ServerType}
            />
            <div className="space-y-[2px]">
              {memberAfterFillter.map((member) => (
                <ServerMembers
                  key={member.getId()}
                  member={member.toPlainObject() as Member}
                  server={server.toPlainObject() as ServerType}
                />
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
