import { Field, BaseModel, Model, BelongsTo, HasMany } from "@arbel/firebase-orm";
import { Profile } from "./profile.model";
import { Member } from "./member.model";
import { Channel } from "./channel.model";

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

	@HasMany({ model: Member, foreignKey: "server_id" })
	public members?: Member[];

	@HasMany({ model: Channel, foreignKey: "server_id" })
	public channels?: Channel[];
}
