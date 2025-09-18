"use client";
import { Member, MemberRole, Server } from "@/types/types";
import { useParams, useRouter } from "next/navigation";
import React from "react";
interface ServerMemberProps {
  member: Member;
  server: Server;
}
const roleIconMap = {
  [MemberRole.GUEST]: "👤",
  [MemberRole.ADMIN]: "👑",
  [MemberRole.MODERATOR]: "🛡️",
};
const ServerMembers = ({ member, server }: ServerMemberProps) => {
  const params = useParams();
  const router = useRouter();

  const icon = roleIconMap[member.role];

  return <div>fadfdsafs</div>;
};

export default ServerMembers;
