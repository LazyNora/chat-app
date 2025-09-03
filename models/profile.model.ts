import { Field, BaseModel, Model, HasMany } from "@arbel/firebase-orm";
import { Server } from "./server.model";
import { Member } from "./member.model";
import { Channel } from "./channel.model";

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

	@HasMany({ model: Server, foreignKey: "profile_id" })
	public servers?: Server[];

	@HasMany({ model: Member, foreignKey: "profile_id" })
	public members?: Member[];

	@HasMany({ model: Channel, foreignKey: "profile_id" })
	public channels?: Channel[];
}
