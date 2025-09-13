import { Member } from "@/models/models.server";

export async function getServerIdIncludeCurrentUser(userId: string) {
  const member = await Member.findOne<Member>("profileId", "==", userId);
  if (!member) {
    throw new Error("Member not found");
  }

  return member.serverId;
}
