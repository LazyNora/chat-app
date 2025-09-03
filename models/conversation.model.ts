import { Field, BaseModel, Model, BelongsTo, HasMany } from "@arbel/firebase-orm";
import { Member } from "./member.model";
import { DirectMessage } from "./directmessage.model";

@Model({
	reference_path: "conversations",
	path_id: "conversation_id",
})
export class Conversation extends BaseModel {
	@Field({ is_required: true, field_name: "member_one_id" })
	public memberOneId!: string;

	@Field({ is_required: true, field_name: "member_two_id" })
	public memberTwoId!: string;

	@HasMany({ model: DirectMessage, foreignKey: "conversation_id" })
	public directMessages?: DirectMessage[];

	@BelongsTo({ model: Member, localKey: "memberOneId" })
	public memberOne?: Member;

	@BelongsTo({ model: Member, localKey: "memberTwoId" })
	public memberTwo?: Member;
}
