import { Field, BaseModel, Model, BelongsTo } from "@arbel/firebase-orm";
import { Member } from "./member.model";
import { Conversation } from "./conversation.model";

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
