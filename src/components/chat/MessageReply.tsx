import { useState, useEffect } from "react";
import { Reply } from "lucide-react";
import { getMessage } from "@/services/messages";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";

interface MessageReplyProps {
	groupId: string;
	channelId: string;
	replyToId: string;
	onJumpTo?: (messageId: string) => void;
}

export function MessageReply({ groupId, channelId, replyToId, onJumpTo }: MessageReplyProps) {
	const [parentMessage, setParentMessage] = useState<Message | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadParentMessage = async () => {
			try {
				const message = await getMessage(groupId, channelId, replyToId);
				setParentMessage(message);
			} catch (error) {
				console.error("Error loading parent message:", error);
			} finally {
				setLoading(false);
			}
		};

		loadParentMessage();
	}, [groupId, channelId, replyToId]);

	if (loading) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
				<Reply className="h-3 w-3" />
				<span>Loading reply...</span>
			</div>
		);
	}

	if (!parentMessage) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
				<Reply className="h-3 w-3" />
				<span className="italic">Message not found</span>
			</div>
		);
	}

	return (
		<button
			onClick={() => onJumpTo?.(replyToId)}
			className={cn(
				"flex items-center gap-2 text-sm mb-2 px-2 py-1 rounded",
				"border-l-2 border-muted-foreground/50 bg-muted/30",
				"hover:bg-muted/50 transition-colors text-left w-full"
			)}>
			<Reply className="h-3 w-3 text-muted-foreground shrink-0" />
			<div className="flex-1 min-w-0">
				<span className="font-medium text-muted-foreground">{parentMessage.senderName}</span>
				<span className="ml-2 truncate text-muted-foreground">
					{parentMessage.content}
				</span>
			</div>
		</button>
	);
}

