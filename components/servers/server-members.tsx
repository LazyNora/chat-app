"use client";
import { Member, MemberRole, Server } from "@/types/types";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { UserAvatar } from "../user-avatar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ShieldAlert, ShieldCheck } from "lucide-react";

interface ServerMemberProps {
  member: Member;
  server: Server;
}

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.ADMIN]: <ShieldCheck className="w-4 h-4 text-indigo-500" />,
  [MemberRole.MODERATOR]: <ShieldAlert className="w-4 h-4 text-rose-500" />,
};

const ServerMembers = ({ member, server }: ServerMemberProps) => {
  const params = useParams();
  const router = useRouter();

  const icon = roleIconMap[member.role];

  const onClick = () => {
    router.push(`/servers/${server.id}/conversations/${member.profileId}`);
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1",
        params?.memberId === member.id && "bg-zinc-700/20 dark:bg-zinc-700"
      )}
    >
      <UserAvatar
        src={member.profile?.imageUrl}
        fallBack={member.profile?.name}
      />
      <p
        className={cn(
          "font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
          params?.memberId === member.id &&
            "text-primary dark:text-zinc-200 dark:group-hover:text-white"
        )}
      >
        {member?.profile?.name}
      </p>
      {icon}
    </button>
  );
};

export default ServerMembers;
