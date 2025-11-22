import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { subscribeToDirectMessages } from "@/services/dmMessages";
import type { Message } from "@/types";
import { MessageItem } from "./MessageItem";

interface DMMessageListProps {
	conversationId: string;
	replyingTo?: Message | null;
	onCancelReply?: () => void;
	onReply?: (message: Message) => void;
}

export function DMMessageList({
	conversationId,
	replyingTo,
	onCancelReply,
	onReply,
}: DMMessageListProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messageRefs = useRef<Record<string, HTMLDivElement>>({});
	const { user } = useAuthStore();

	// Auto-scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// Subscribe to direct messages
	useEffect(() => {
		if (!conversationId) return;

		setLoading(true);
		const unsubscribe = subscribeToDirectMessages(conversationId, (msgs) => {
			setMessages(msgs);
			setLoading(false);
			// Scroll to bottom when new messages arrive
			setTimeout(scrollToBottom, 100);
		});

		return () => {
			unsubscribe();
		};
	}, [conversationId]);

	// Scroll to bottom on mount
	useEffect(() => {
		if (messages.length > 0) {
			setTimeout(scrollToBottom, 100);
		}
	}, [messages.length]);

	if (loading) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center gap-4">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<Button variant="outline" onClick={() => window.location.reload()}>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<ScrollArea className="flex-1 p-4">
			<div className="space-y-2">
				{messages.length === 0 ? (
					<div className="flex items-center justify-center h-full">
						<p className="text-muted-foreground">No messages yet. Start the conversation!</p>
					</div>
				) : (
					messages.map((message, index) => {
						const prevMessage = messages[index - 1];
						const showAvatar =
							index === 0 ||
							prevMessage.senderId !== message.senderId ||
							(message.createdAt &&
								prevMessage.createdAt &&
								message.createdAt.toMillis() - prevMessage.createdAt.toMillis() > 300000); // 5 min

						return (
							<div
								key={message.id}
								ref={(el) => {
									if (el) {
										messageRefs.current[message.id] = el;
									}
								}}>
								<MessageItem
									message={message}
									groupId={conversationId} // Use conversationId for compatibility
									channelId={conversationId} // Use conversationId as channelId for DMs
									showAvatar={showAvatar}
									isDM={true} // Mark as DM
									onReply={onReply}
								/>
							</div>
						);
					})
				)}
				<div ref={messagesEndRef} />
			</div>
		</ScrollArea>
	);
}

