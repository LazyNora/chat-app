import { ReactNode, useState } from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	User,
	UserX,
	Clock,
	Ban,
	MessageSquare,
	Shield,
} from "lucide-react";
import type { GroupMember } from "@/types";
import { removeMemberFromGroup, timeoutMember, banMember } from "@/services/groups";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/authStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface MemberContextMenuProps {
	children: ReactNode;
	member: GroupMember;
	groupId: string;
	onViewProfile?: () => void;
	onManageRoles?: () => void;
	onSendDM?: () => void;
}

export function MemberContextMenu({
	children,
	member,
	groupId,
	onViewProfile,
	onManageRoles,
	onSendDM,
}: MemberContextMenuProps) {
	const { user } = useAuthStore();
	const { hasPermission } = usePermissions(groupId);
	const [showKickDialog, setShowKickDialog] = useState(false);
	const [showBanDialog, setShowBanDialog] = useState(false);
	const [showDeleteMessagesDialog, setShowDeleteMessagesDialog] = useState(false);
	const [deleteMessages, setDeleteMessages] = useState(false);

	const handleKick = async () => {
		try {
			await removeMemberFromGroup(groupId, member.userId);
			toast.success(`${member.displayName} has been kicked`);
		} catch (error) {
			console.error("Error kicking member:", error);
			toast.error("Failed to kick member");
		}
	};

	const handleTimeout = async (durationMs: number, durationLabel: string) => {
		try {
			await timeoutMember(groupId, member.userId, durationMs);
			toast.success(`${member.displayName} has been timed out for ${durationLabel}`);
		} catch (error) {
			console.error("Error timing out member:", error);
			toast.error("Failed to timeout member");
		}
	};

	const handleBan = async () => {
		try {
			await banMember(groupId, member.userId, undefined, deleteMessages);
			toast.success(`${member.displayName} has been banned`);
			setDeleteMessages(false);
		} catch (error) {
			console.error("Error banning member:", error);
			toast.error("Failed to ban member");
		}
	};

	const handleBanClick = () => {
		setShowBanDialog(true);
	};

	const handleBanConfirm = () => {
		setShowBanDialog(false);
		setShowDeleteMessagesDialog(true);
	};

	const handleDeleteMessagesConfirm = () => {
		setDeleteMessages(true);
		setShowDeleteMessagesDialog(false);
		handleBan();
	};

	const canKick = hasPermission("kickMembers");
	const canBan = hasPermission("banMembers");
	const canManageRoles = hasPermission("manageRoles");
	const isSelf = user?.uid === member.userId;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-56">
				<div className="px-2 py-1.5 text-sm font-semibold">
					{member.displayName}
				</div>
				<ContextMenuSeparator />

				{onViewProfile && (
					<ContextMenuItem onClick={onViewProfile}>
						<User className="mr-2 h-4 w-4" />
						View Profile
					</ContextMenuItem>
				)}

				{onSendDM && !isSelf && (
					<ContextMenuItem onClick={onSendDM}>
						<MessageSquare className="mr-2 h-4 w-4" />
						Send Direct Message
					</ContextMenuItem>
				)}

				{canManageRoles && onManageRoles && !isSelf && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={onManageRoles}>
							<Shield className="mr-2 h-4 w-4" />
							Manage Roles
						</ContextMenuItem>
					</>
				)}

				{(canKick || canBan) && !isSelf && <ContextMenuSeparator />}

				{canKick && !isSelf && (
					<ContextMenuItem onClick={() => setShowKickDialog(true)} className="text-orange-600">
						<UserX className="mr-2 h-4 w-4" />
						Kick Member
					</ContextMenuItem>
				)}

				{canKick && !isSelf && (
					<ContextMenuSub>
						<ContextMenuSubTrigger>
							<Clock className="mr-2 h-4 w-4" />
							Timeout
						</ContextMenuSubTrigger>
						<ContextMenuSubContent>
							<ContextMenuItem
								onClick={() => handleTimeout(10 * 60 * 1000, "10 minutes")}>
								10 minutes
							</ContextMenuItem>
							<ContextMenuItem
								onClick={() => handleTimeout(60 * 60 * 1000, "1 hour")}>
								1 hour
							</ContextMenuItem>
							<ContextMenuItem
								onClick={() => handleTimeout(24 * 60 * 60 * 1000, "1 day")}>
								1 day
							</ContextMenuItem>
							<ContextMenuItem
								onClick={() => handleTimeout(7 * 24 * 60 * 60 * 1000, "1 week")}>
								1 week
							</ContextMenuItem>
						</ContextMenuSubContent>
					</ContextMenuSub>
				)}

				{canBan && !isSelf && (
					<ContextMenuItem onClick={handleBanClick} className="text-destructive">
						<Ban className="mr-2 h-4 w-4" />
						Ban Member
					</ContextMenuItem>
				)}
			</ContextMenuContent>
			<ConfirmDialog
				open={showKickDialog}
				onOpenChange={setShowKickDialog}
				title="Kick Member"
				description={`Are you sure you want to kick ${member.displayName}?`}
				confirmText="Kick"
				onConfirm={handleKick}
				variant="destructive"
			/>
			<ConfirmDialog
				open={showBanDialog}
				onOpenChange={setShowBanDialog}
				title="Ban Member"
				description={`Are you sure you want to ban ${member.displayName}? This will remove them from the group permanently.`}
				confirmText="Ban"
				onConfirm={handleBanConfirm}
				variant="destructive"
			/>
			<ConfirmDialog
				open={showDeleteMessagesDialog}
				onOpenChange={setShowDeleteMessagesDialog}
				title="Delete Messages"
				description="Also delete their messages from the last 24 hours?"
				confirmText="Yes, Delete Messages"
				cancelText="No, Just Ban"
				onConfirm={handleDeleteMessagesConfirm}
			/>
		</ContextMenu>
	);
}

