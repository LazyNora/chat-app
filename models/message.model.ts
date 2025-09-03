import { Field, BaseModel, Model, BelongsTo } from "@arbel/firebase-orm";
import { Member } from "./member.model";
import { Channel } from "./channel.model";

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
