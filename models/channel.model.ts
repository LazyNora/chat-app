import { Field, BaseModel, Model, BelongsTo, HasMany } from "@arbel/firebase-orm";
import { Profile } from "./profile.model";
import { Server } from "./server.model";
import { Message } from "./message.model";

export enum ChannelType {
	TEXT = "TEXT",
	AUDIO = "AUDIO",
	VIDEO = "VIDEO",
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

	@HasMany({ model: Message, foreignKey: "channel_id" })
	public messages?: Message[];
}
