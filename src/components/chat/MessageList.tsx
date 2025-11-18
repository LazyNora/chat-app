import { useEffect, useRef, useState } from "react";
import { collection, query, orderBy, where, limit, onSnapshot, doc, onSnapshot as onDocSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";
import type { Message, Thread } from "@/types";
import { MessageItem } from "./MessageItem";
import { updateLastSeenMessage, getLastSeenMessage } from "@/services/messageSeen";
import { useAuthStore } from "@/stores/authStore";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface MessageListProps {
	groupId: string;
	channelId: string;
	onReply?: (message: Message) => void;
	onCreateThread?: (message: Message) => void;
	onOpenThread?: (threadId: string) => void;
}

export function MessageList({ groupId, channelId, onReply, onCreateThread, onOpenThread }: MessageListProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [threads, setThreads] = useState<Record<string, Thread>>({});
	const [lastSeenMessageId, setLastSeenMessageId] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const { user } = useAuthStore();

	// Auto-scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// Load last seen message
	useEffect(() => {
		if (!user || !channelId) return;

		const loadLastSeen = async () => {
			try {
				const seenStatus = await getLastSeenMessage(user.uid, channelId);
				setLastSeenMessageId(seenStatus?.lastSeenMessageId || null);
			} catch (error) {
				console.error("Error loading last seen:", error);
			}
		};

		loadLastSeen();
	}, [user, channelId]);

	// Update last seen when viewing channel
	useEffect(() => {
		if (!user || !groupId || !channelId || messages.length === 0) return;

		const lastMessage = messages[messages.length - 1];
		if (lastMessage && lastMessage.id !== lastSeenMessageId) {
			updateLastSeenMessage(user.uid, groupId, channelId, lastMessage.id).catch(
				console.error
			);
			setLastSeenMessageId(lastMessage.id);
		}
	}, [user, groupId, channelId, messages, lastSeenMessageId]);

	useEffect(() => {
		if (!groupId || !channelId) return;

		const messagesRef = collection(db, `groups/${groupId}/channels/${channelId}/messages`);
		const q = query(
			messagesRef,
			where("deleted", "==", false),
			orderBy("createdAt", "asc"),
			limit(100)
		);

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const msgs = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Message[];

			setMessages(msgs);
			setLoading(false);

			// Scroll to bottom when new messages arrive
			setTimeout(scrollToBottom, 100);
		});

		// Real-time thread updates for messages with threads
		const threadUnsubscribes: (() => void)[] = [];
		const setupThreadListeners = () => {
			// Clean up previous listeners
			threadUnsubscribes.forEach((unsub) => unsub());
			threadUnsubscribes.length = 0;

			// Set up listeners for each thread
			messages.forEach((msg) => {
				if (msg.threadId) {
					const threadRef = doc(db, `groups/${groupId}/channels/${channelId}/threads`, msg.threadId);
					const unsub = onDocSnapshot(threadRef, (snap) => {
						if (snap.exists()) {
							const threadData = { id: snap.id, ...snap.data() } as Thread;
							setThreads((prev) => ({ ...prev, [msg.threadId!]: threadData }));
						}
					});
					threadUnsubscribes.push(unsub);
				}
			});
		};

		// Setup thread listeners when messages change
		const timeoutId = setTimeout(() => {
			setupThreadListeners();
		}, 100);

		return () => {
			unsubscribe();
			clearTimeout(timeoutId);
			threadUnsubscribes.forEach((unsub) => unsub());
		};
	}, [groupId, channelId, messages]);

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
			<div className="space-y-4">
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
						(message.createdAt && prevMessage.createdAt &&
							message.createdAt.toMillis() - prevMessage.createdAt.toMillis() > 300000); // 5 min

					// Show "NEW" divider if this is the first message after last seen
					const showNewDivider =
						lastSeenMessageId &&
						prevMessage?.id === lastSeenMessageId &&
						message.id !== lastSeenMessageId;

					return (
						<div key={message.id}>
							{showNewDivider && (
								<div className="flex items-center gap-2 my-4">
									<Separator className="flex-1" />
									<span className="text-xs font-semibold text-primary px-2">NEW MESSAGES</span>
									<Separator className="flex-1" />
								</div>
							)}
							<MessageItem
								message={message}
								groupId={groupId}
								channelId={channelId}
								showAvatar={showAvatar}
								thread={message.threadId ? threads[message.threadId] : null}
								onReply={onReply}
								onCreateThread={onCreateThread}
								onOpenThread={onOpenThread}
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
