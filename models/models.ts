import { Field, BaseModel, Model, HasMany, BelongsTo } from "@arbel/firebase-orm";

export enum MemberRole {
	ADMIN = "ADMIN",
	MODERATOR = "MODERATOR",
	GUEST = "GUEST",
}

export enum ChannelType {
	TEXT = "TEXT",
	AUDIO = "AUDIO",
	VIDEO = "VIDEO",
}

@Model({
	reference_path: "profiles",
	path_id: "profile_id",
})
export class Profile extends BaseModel {
	@Field({ is_required: true })
	public userId!: string;

	@Field({ is_required: true })
	public name!: string;

	@Field({ is_required: true })
	public imageUrl!: string;

	@Field({ is_required: true })
	public email!: string;

	@Field({ is_required: false, field_name: "created_at" })
	public createdAt?: string;

	@Field({ is_required: false, field_name: "updated_at" })
	public updatedAt?: string;

	//@HasMany({ model: () => Server, foreignKey: "profile_id" })
	public servers?: Server[];

	// @HasMany({ model: Member, foreignKey: "profile_id" })
	public members?: Member[];

	// @HasMany({ model: Channel, foreignKey: "profile_id" })
	public channels?: Channel[];
}

@Model({
	reference_path: "servers",
	path_id: "server_id",
})
export class Server extends BaseModel {
	@Field({ is_required: true })
	public name!: string;

	@Field({ is_required: true })
	public imageUrl!: string;

	@Field({ is_required: true })
	public inviteCode!: string;

	@Field({ is_required: true, field_name: "profile_id" })
	public profileId!: string;

	@Field({ is_required: false, field_name: "created_at" })
	public createdAt?: string;

	@Field({ is_required: false, field_name: "updated_at" })
	public updatedAt?: string;

	@BelongsTo({ model: Profile, localKey: "profileId" })
	public profile?: Profile;

	// @HasMany({ model: Member, foreignKey: "server_id" })
	public members?: Member[];

	// @HasMany({ model: Channel, foreignKey: "server_id" })
	public channels?: Channel[];
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

	//@HasMany({ model: Message, foreignKey: "member_id" })
	public messages?: Message[];

	//@HasMany({ model: DirectMessage, foreignKey: "member_id" })
	public directMessages?: DirectMessage[];

	//@HasMany({ model: Conversation, foreignKey: "member_one_id" })
	public conversationsInitiated?: Conversation[];

	//@HasMany({ model: Conversation, foreignKey: "member_two_id" })
	public conversationsReceived?: Conversation[];
}

@Model({
	reference_path: "channels",
	path_id: "channel_id",
})
export class Channel extends BaseModel {
	@Field({ is_required: true })
	public name!: string;

	@Field({ is_required: true })
	public type: ChannelType = ChannelType.TEXT;

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

	//@HasMany({ model: Message, foreignKey: "channel_id" })
	public messages?: Message[];
}

@Model({
	reference_path: "messages",
	path_id: "message_id",
})
export class Message extends BaseModel {
	@Field({ is_required: true })
	public content!: string;

	@Field({ is_required: false })
	public fileUrl?: string;

	@Field({ is_required: true, field_name: "member_id" })
	public memberId!: string;

	@Field({ is_required: true, field_name: "channel_id" })
	public channelId!: string;

	@Field({ is_required: false })
	public deleted: boolean = false;

	@Field({ is_required: false, field_name: "created_at" })
	public createdAt?: string;

	@Field({ is_required: false, field_name: "updated_at" })
	public updatedAt?: string;

	@BelongsTo({ model: Member, localKey: "memberId" })
	public member?: Member;

	@BelongsTo({ model: Channel, localKey: "channelId" })
	public channel?: Channel;
}

@Model({
	reference_path: "conversations",
	path_id: "conversation_id",
})
export class Conversation extends BaseModel {
	@Field({ is_required: true, field_name: "member_one_id" })
	public memberOneId!: string;

	@Field({ is_required: true, field_name: "member_two_id" })
	public memberTwoId!: string;

	//@HasMany({ model: DirectMessage, foreignKey: "conversation_id" })
	public directMessages?: DirectMessage[];

	@BelongsTo({ model: Member, localKey: "memberOneId" })
	public memberOne?: Member;

	@BelongsTo({ model: Member, localKey: "memberTwoId" })
	public memberTwo?: Member;
}

@Model({
	reference_path: "directmessages",
	path_id: "directmessage_id",
})
export class DirectMessage extends BaseModel {
	@Field({ is_required: true })
	public content!: string;

	@Field({ is_required: false })
	public fileUrl?: string;

	@Field({ is_required: true, field_name: "member_id" })
	public memberId!: string;

	@Field({ is_required: true, field_name: "conversation_id" })
	public conversationId!: string;

	@Field({ is_required: false })
	public deleted: boolean = false;

	@Field({ is_required: false, field_name: "created_at" })
	public createdAt?: string;

	@Field({ is_required: false, field_name: "updated_at" })
	public updatedAt?: string;

	@BelongsTo({ model: Member, localKey: "memberId" })
	public member?: Member;

	@BelongsTo({ model: Conversation, localKey: "conversationId" })
	public conversation?: Conversation;
}
