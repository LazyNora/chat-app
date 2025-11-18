import { useState, useEffect } from "react";
import { Pin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getMessage } from "@/services/messages";

interface PinnedMessageBannerProps {
	groupId: string;
	channelId: string;
	onOpenPanel: () => void;
	onClose?: () => void;
}

export function PinnedMessageBanner({
	groupId,
	channelId,
	onOpenPanel,
	onClose,
}: PinnedMessageBannerProps) {
	const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
	const [latestMessage, setLatestMessage] = useState<Message | null>(null);

	// Real-time channel pinned messages
	useEffect(() => {
		if (!groupId || !channelId) return;

		const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
		const unsubscribe = onSnapshot(channelRef, async (snap) => {
			if (snap.exists()) {
				const channelData = snap.data();
				const pinnedIds = channelData.pinnedMessageIds || [];
				setPinnedMessageIds(pinnedIds);

				// Get latest pinned message
				if (pinnedIds.length > 0) {
					const latestId = pinnedIds[pinnedIds.length - 1];
					const msg = await getMessage(groupId, channelId, latestId);
					setLatestMessage(msg);
				} else {
					setLatestMessage(null);
				}
			}
		});

		return () => unsubscribe();
	}, [groupId, channelId]);

	if (!latestMessage || pinnedMessageIds.length === 0) return null;

	return (
		<div
			className={cn(
				"flex items-center gap-3 px-4 py-2 bg-primary/10 border-b border-primary/20",
				"cursor-pointer hover:bg-primary/15 transition-colors"
			)}
			onClick={onOpenPanel}>
			<Pin className="h-4 w-4 text-primary shrink-0" />
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">{latestMessage.senderName}</span>
					{pinnedMessageIds.length > 1 && (
						<span className="text-xs text-muted-foreground">
							+{pinnedMessageIds.length - 1} more pinned
						</span>
					)}
				</div>
				<p className="text-sm text-muted-foreground truncate">{latestMessage.content}</p>
			</div>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<div>
							<Button
								size="icon"
								variant="ghost"
								className="h-7 w-7 shrink-0"
								onClick={(e) => {
									e.stopPropagation();
									onClose?.();
								}}>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</TooltipTrigger>
					<TooltipContent>Hide banner</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}

