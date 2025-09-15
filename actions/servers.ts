import { Member } from "@/models/models.server";

export async function getServerIdIncludeCurrentUser(userId: string) {
	const member = await Member.findOne<Member>("profileId", "==", userId);
	if (!member) {
		return null;
	}

	return member.serverId;
}
