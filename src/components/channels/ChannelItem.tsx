import { Hash, Volume2, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types";
import { ChannelContextMenu } from "./ChannelContextMenu";
import { Badge } from "@/components/ui/badge";

interface ChannelItemProps {
	channel: Channel;
	groupId: string;
	isActive?: boolean;
	unreadCount?: number;
	isMuted?: boolean;
	onClick?: () => void;
	onEdit?: () => void;
	onSettings?: () => void;
	onPermissions?: () => void;
	onToggleMute?: () => void;
}

export function ChannelItem({
	channel,
	groupId,
	isActive = false,
	unreadCount = 0,
	isMuted = false,
	onClick,
	onEdit,
	onSettings,
	onPermissions,
	onToggleMute,
}: ChannelItemProps) {
	const Icon = channel.type === "voice" ? Volume2 : Hash;

	return (
		<ChannelContextMenu
			channel={channel}
			groupId={groupId}
			onEdit={onEdit}
			onSettings={onSettings}
			onPermissions={onPermissions}
			isMuted={isMuted}
			onToggleMute={onToggleMute}>
			<button
				onClick={onClick}
				className={cn(
					"w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors text-left group",
					isActive && "bg-muted"
				)}>
				<Icon className="h-4 w-4 text-muted-foreground shrink-0" />
				<span
					className={cn(
						"flex-1 truncate text-sm",
						isMuted && "text-muted-foreground line-through"
					)}>
					{channel.name}
				</span>
				{isMuted && <BellOff className="h-3 w-3 text-muted-foreground shrink-0" />}
				{unreadCount > 0 && !isMuted && (
					<Badge variant="destructive" className="h-5 px-1.5 text-xs shrink-0">
						{unreadCount > 99 ? "99+" : unreadCount}
					</Badge>
				)}
			</button>
		</ChannelContextMenu>
	);
}

