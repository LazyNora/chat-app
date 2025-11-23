import { type ReactNode, useState } from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	Edit,
	Trash,
	Pin,
	PinOff,
	Copy,
	Reply,
	MessageSquare,
	Link,
} from "lucide-react";
import type { Message } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { deleteMessage, pinMessage, unpinMessage } from "@/services/messages";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface MessageContextMenuProps {
	children: ReactNode;
	message: Message;
	groupId: string;
	channelId: string;
	isPinned: boolean;
	onEdit?: () => void;
	onReply?: () => void;
	onCreateThread?: () => void;
}

export function MessageContextMenu({
	children,
	message,
	groupId,
	channelId,
	isPinned,
	onEdit,
	onReply,
	onCreateThread,
}: MessageContextMenuProps) {
	const { user } = useAuthStore();
	const { hasPermission } = usePermissions(groupId);
	const isOwner = user?.uid === message.senderId;
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const handleCopyContent = () => {
		navigator.clipboard.writeText(message.content);
		toast.success("Message copied to clipboard");
	};

	const handleCopyLink = () => {
		const link = `${window.location.origin}/groups/${groupId}/channels/${channelId}?message=${message.id}`;
		navigator.clipboard.writeText(link);
		toast.success("Message link copied");
	};

	const handlePin = async () => {
		try {
			if (isPinned) {
				await unpinMessage(groupId, channelId, message.id);
				toast.success("Message unpinned");
			} else {
				await pinMessage(groupId, channelId, message.id);
				toast.success("Message pinned");
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to pin/unpin message");
		}
	};

	const handleDelete = async () => {
		try {
			await deleteMessage(groupId, channelId, message.id);
			toast.success("Message deleted");
		} catch (error) {
			toast.error("Failed to delete message");
		}
	};

	const canManageMessages = hasPermission("manageMessages");
	const canPin = hasPermission("manageMessages");
	const canDelete = isOwner || canManageMessages;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-56">
				{isOwner && onEdit && (
					<ContextMenuItem onClick={onEdit}>
						<Edit className="mr-2 h-4 w-4" />
						Edit Message
					</ContextMenuItem>
				)}

				{onReply && (
					<ContextMenuItem onClick={onReply}>
						<Reply className="mr-2 h-4 w-4" />
						Reply
					</ContextMenuItem>
				)}

				{onCreateThread && (
					<ContextMenuItem onClick={onCreateThread}>
						<MessageSquare className="mr-2 h-4 w-4" />
						Create Thread
					</ContextMenuItem>
				)}

				<ContextMenuSeparator />

				<ContextMenuItem onClick={handleCopyContent}>
					<Copy className="mr-2 h-4 w-4" />
					Copy Message
				</ContextMenuItem>

				<ContextMenuItem onClick={handleCopyLink}>
					<Link className="mr-2 h-4 w-4" />
					Copy Message Link
				</ContextMenuItem>

				{canPin && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={handlePin}>
							{isPinned ? (
								<>
									<PinOff className="mr-2 h-4 w-4" />
									Unpin Message
								</>
							) : (
								<>
									<Pin className="mr-2 h-4 w-4" />
									Pin Message
								</>
							)}
						</ContextMenuItem>
					</>
				)}

				{canDelete && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
							<Trash className="mr-2 h-4 w-4" />
							Delete Message
						</ContextMenuItem>
					</>
				)}
			</ContextMenuContent>
			<ConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				title="Delete Message"
				description="Are you sure you want to delete this message? This action cannot be undone."
				confirmText="Delete"
				onConfirm={handleDelete}
				variant="destructive"
			/>
		</ContextMenu>
	);
}

