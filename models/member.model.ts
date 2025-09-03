import { Field, BaseModel, Model, BelongsTo, HasMany } from "@arbel/firebase-orm";
import { Profile } from "./profile.model";
import { Server } from "./server.model";
import { Message } from "./message.model";
import { DirectMessage } from "./directmessage.model";
import { Conversation } from "./conversation.model";

export enum MemberRole {
	ADMIN = "ADMIN",
	MODERATOR = "MODERATOR",
	GUEST = "GUEST",
}

@Model({
	reference_path: "members",
	path_id: "member_id",
})
export class Member extends BaseModel {
	@Field({ is_required: true })
	public role: MemberRole = MemberRole.GUEST;

	@Field({ is_required: true, field_name: "profile_id" })
	public profileId!: string;

	@Field({ is_required: true, field_name: "server_id" })
	public serverId!: string;

	@Field({ is_required: false, field_name: "created_at" })
	public createdAt?: string;

	@Field({ is_required: false, field_name: "updated_at" })
	public updatedAt?: string;

	@BelongsTo({ model: Profile, localKey: "profileId" })
	public profile?: Profile;

	@BelongsTo({ model: Server, localKey: "serverId" })
	public server?: Server;

	@HasMany({ model: Message, foreignKey: "member_id" })
	public messages?: Message[];

	@HasMany({ model: DirectMessage, foreignKey: "member_id" })
	public directMessages?: DirectMessage[];

	@HasMany({ model: Conversation, foreignKey: "member_one_id" })
	public conversationsInitiated?: Conversation[];

	@HasMany({ model: Conversation, foreignKey: "member_two_id" })
	public conversationsReceived?: Conversation[];
}
