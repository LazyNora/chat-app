import { BaseModel } from "../lib/firebase/base-model.server";

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

export class Profile extends BaseModel {
	static collectionName = "profiles";
	public userId!: string;

	public name!: string;

	public imageUrl!: string;

	public email!: string;

	public createdAt?: string;

	public updatedAt?: string;

	public servers?: Server[];

	public members?: Member[];

	public channels?: Channel[];

	async loadServers(): Promise<Server[]> {
		const servers = await this.loadRelatedModels(Server, { profileId: this.getId() });
		this.servers = servers as Server[];
		return servers as Server[];
	}

	async loadMembers(): Promise<Member[]> {
		const members = await this.loadRelatedModels(Member, { profileId: this.getId() });
		this.members = members as Member[];
		return members as Member[];
	}

	async loadChannels(): Promise<Channel[]> {
		const channels = await this.loadRelatedModels(Channel, { profileId: this.getId() });
		this.channels = channels as Channel[];
		return channels as Channel[];
	}
}

export class Server extends BaseModel {
	static collectionName = "servers";
	public name!: string;

	public imageUrl!: string;

	public inviteCode!: string;

	public profileId!: string;

	public createdAt?: string;

	public updatedAt?: string;

	public profile?: Profile;

	public members?: Member[];

	public channels?: Channel[];

	async loadProfile(): Promise<Profile | undefined> {
		const profile = await this.loadRelation(Profile, this.profileId);
		this.profile = profile as Profile;
		return profile as Profile;
	}

	async loadMembers(): Promise<Member[]> {
		const members = await this.loadRelatedModels(Member, { serverId: this.getId() });
		this.members = members as Member[];
		return members as Member[];
	}

	async loadChannels(): Promise<Channel[]> {
		const channels = await this.loadRelatedModels(Channel, { serverId: this.getId() });
		this.channels = channels as Channel[];
		return channels as Channel[];
	}
}

export class Member extends BaseModel {
	static collectionName = "members";
	public role: MemberRole = MemberRole.GUEST;

	public profileId!: string;

	public serverId!: string;

	public createdAt?: string;

	public updatedAt?: string;

	public profile?: Profile;

	public server?: Server;

	public messages?: Message[];

	public directMessages?: DirectMessage[];

	public conversationsInitiated?: Conversation[];

	public conversationsReceived?: Conversation[];

	async loadProfile(): Promise<Profile | undefined> {
		const profile = await this.loadRelation(Profile, this.profileId);
		this.profile = profile as Profile;
		return profile as Profile;
	}

	async loadServer(): Promise<Server | undefined> {
		const server = await this.loadRelation(Server, this.serverId);
		this.server = server as Server;
		return server as Server;
	}

	async loadMessages(): Promise<Message[]> {
		const messages = await this.loadRelatedModels(Message, { memberId: this.getId() });
		this.messages = messages as Message[];
		return messages as Message[];
	}

	async loadDirectMessages(): Promise<DirectMessage[]> {
		const directMessages = await this.loadRelatedModels(DirectMessage, { memberId: this.getId() });
		this.directMessages = directMessages as DirectMessage[];
		return directMessages as DirectMessage[];
	}

	async loadConversationsInitiated(): Promise<Conversation[]> {
		const conversations = await this.loadRelatedModels(Conversation, { memberOneId: this.getId() });
		this.conversationsInitiated = conversations as Conversation[];
		return conversations as Conversation[];
	}

	async loadConversationsReceived(): Promise<Conversation[]> {
		const conversations = await this.loadRelatedModels(Conversation, { memberTwoId: this.getId() });
		this.conversationsReceived = conversations as Conversation[];
		return conversations as Conversation[];
	}
}

export class Channel extends BaseModel {
	static collectionName = "channels";
	public name!: string;

	public type: ChannelType = ChannelType.TEXT;

	public profileId!: string;

	public serverId!: string;

	public createdAt?: string;

	public updatedAt?: string;

	public profile?: Profile;

	public server?: Server;

	public messages?: Message[];

	async loadProfile(): Promise<Profile | undefined> {
		const profile = await this.loadRelation<Profile>(Profile, this.profileId);
		this.profile = profile;
		return profile;
	}

	async loadServer(): Promise<Server | undefined> {
		const server = await this.loadRelation<Server>(Server, this.serverId);
		this.server = server;
		return server;
	}

	async loadMessages(): Promise<Message[]> {
		const messages = await this.loadRelatedModels<Message>(Message, { channelId: this.getId() });
		this.messages = messages;
		return messages;
	}
}

export class Message extends BaseModel {
	static collectionName = "messages";
	public content!: string;

	public fileUrl?: string;

	public memberId!: string;

	public channelId!: string;

	public deleted: boolean = false;

	public createdAt?: string;

	public updatedAt?: string;

	public member?: Member;

	public channel?: Channel;

	async loadMember(): Promise<Member | undefined> {
		const member = await this.loadRelation<Member>(Member, this.memberId);
		this.member = member;
		return member;
	}

	async loadChannel(): Promise<Channel | undefined> {
		const channel = await this.loadRelation<Channel>(Channel, this.channelId);
		this.channel = channel;
		return channel;
	}
}

export class Conversation extends BaseModel {
	static collectionName = "conversations";
	public memberOneId!: string;

	public memberTwoId!: string;

	public directMessages?: DirectMessage[];

	public memberOne?: Member;

	public memberTwo?: Member;

	async loadMemberOne(): Promise<Member | undefined> {
		const member = await this.loadRelation<Member>(Member, this.memberOneId);
		this.memberOne = member;
		return member;
	}

	async loadMemberTwo(): Promise<Member | undefined> {
		const member = await this.loadRelation<Member>(Member, this.memberTwoId);
		this.memberTwo = member;
		return member;
	}

	async loadDirectMessages(): Promise<DirectMessage[]> {
		const messages = await this.loadRelatedModels<DirectMessage>(DirectMessage, {
			conversationId: this.getId(),
		});
		this.directMessages = messages;
		return messages;
	}
}

export class DirectMessage extends BaseModel {
	static collectionName = "directMessages";
	public content!: string;

	public fileUrl?: string;

	public memberId!: string;

	public conversationId!: string;

	public deleted: boolean = false;

	public createdAt?: string;

	public updatedAt?: string;

	public member?: Member;

	public conversation?: Conversation;

	async loadMember(): Promise<Member | undefined> {
		const member = await this.loadRelation<Member>(Member, this.memberId);
		this.member = member;
		return member;
	}

	async loadConversation(): Promise<Conversation | undefined> {
		const conversation = await this.loadRelation<Conversation>(Conversation, this.conversationId);
		this.conversation = conversation;
		return conversation as Conversation;
	}
}
