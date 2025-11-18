import { ReactNode, useState } from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	Settings,
	Trash,
	Link,
	Bell,
	BellOff,
	Edit,
	Hash,
} from "lucide-react";
import type { Channel } from "@/types";
import { deleteChannel } from "@/services/channels";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ChannelContextMenuProps {
	children: ReactNode;
	channel: Channel;
	groupId: string;
	onEdit?: () => void;
	onSettings?: () => void;
	onPermissions?: () => void;
	isMuted?: boolean;
	onToggleMute?: () => void;
}

export function ChannelContextMenu({
	children,
	channel,
	groupId,
	onEdit,
	onSettings,
	onPermissions,
	isMuted = false,
	onToggleMute,
}: ChannelContextMenuProps) {
	const { hasPermission } = usePermissions(groupId);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const handleCopyLink = () => {
		const link = `${window.location.origin}/groups/${groupId}/channels/${channel.id}`;
		navigator.clipboard.writeText(link);
		toast.success("Channel link copied");
	};

	const handleDelete = async () => {
		try {
			await deleteChannel(groupId, channel.id);
			toast.success("Channel deleted");
		} catch (error) {
			console.error("Error deleting channel:", error);
			toast.error("Failed to delete channel");
		}
	};

	const canManageChannels = hasPermission("manageChannels");

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-56">
				<div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
					<Hash className="inline h-4 w-4 mr-1" />
					{channel.name}
				</div>
				<ContextMenuSeparator />

				{canManageChannels && onEdit && (
					<ContextMenuItem onClick={onEdit}>
						<Edit className="mr-2 h-4 w-4" />
						Edit Channel
					</ContextMenuItem>
				)}

				{canManageChannels && onSettings && (
					<ContextMenuItem onClick={onSettings}>
						<Settings className="mr-2 h-4 w-4" />
						Channel Settings
					</ContextMenuItem>
				)}

				{canManageChannels && onPermissions && (
					<ContextMenuItem onClick={onPermissions}>
						<Settings className="mr-2 h-4 w-4" />
						Permissions
					</ContextMenuItem>
				)}

				{canManageChannels && <ContextMenuSeparator />}

				<ContextMenuItem onClick={handleCopyLink}>
					<Link className="mr-2 h-4 w-4" />
					Copy Channel Link
				</ContextMenuItem>

				{onToggleMute && (
					<ContextMenuItem onClick={onToggleMute}>
						{isMuted ? (
							<>
								<Bell className="mr-2 h-4 w-4" />
								Unmute Channel
							</>
						) : (
							<>
								<BellOff className="mr-2 h-4 w-4" />
								Mute Channel
							</>
						)}
					</ContextMenuItem>
				)}

				{canManageChannels && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
							<Trash className="mr-2 h-4 w-4" />
							Delete Channel
						</ContextMenuItem>
					</>
				)}
			</ContextMenuContent>
			<ConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				title="Delete Channel"
				description={`Are you sure you want to delete #${channel.name}? This action cannot be undone.`}
				confirmText="Delete"
				onConfirm={handleDelete}
				variant="destructive"
			/>
		</ContextMenu>
	);
}

