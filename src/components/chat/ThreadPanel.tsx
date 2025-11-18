import { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Archive, Maximize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getThread, sendThreadMessage, toggleThreadArchive } from "@/services/threads";
import { getMessage } from "@/services/messages";
import { MessageItem } from "./MessageItem";
import type { Thread, Message } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { formatDistance } from "date-fns";
import { collection, query, where, orderBy, onSnapshot, doc, onSnapshot as onDocSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";

interface ThreadPanelProps {
	groupId: string;
	channelId: string;
	threadId: string;
	onClose: () => void;
	onFullView?: () => void;
}

export function ThreadPanel({ groupId, channelId, threadId, onClose, onFullView }: ThreadPanelProps) {
	const [thread, setThread] = useState<Thread | null>(null);
	const [parentMessage, setParentMessage] = useState<Message | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [threadContent, setThreadContent] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const { user, userProfile } = useAuthStore();

	// Real-time thread updates
	useEffect(() => {
		if (!threadId) return;

		const threadRef = doc(db, `groups/${groupId}/channels/${channelId}/threads`, threadId);
		const unsubscribeThread = onDocSnapshot(threadRef, async (snap) => {
			if (snap.exists()) {
				const threadData = { id: snap.id, ...snap.data() } as Thread;
				setThread(threadData);

				if (!parentMessage && threadData.parentMessageId) {
					const parent = await getMessage(groupId, channelId, threadData.parentMessageId);
					setParentMessage(parent);
				}
				setLoading(false);
			}
		});

		return () => unsubscribeThread();
	}, [threadId, groupId, channelId, parentMessage]);

	// Real-time thread messages
	useEffect(() => {
		if (!threadId) return;

		const messagesRef = collection(
			db,
			`groups/${groupId}/channels/${channelId}/threads/${threadId}/messages`
		);
		const q = query(
			messagesRef,
			where("deleted", "==", false),
			orderBy("createdAt", "asc")
		);

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const msgs = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Message[];
			setMessages(msgs);
			setTimeout(() => {
				messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
			}, 100);
		});

		return () => unsubscribe();
	}, [threadId, groupId, channelId]);

	const handleArchive = async () => {
		if (!thread) return;

		try {
			await toggleThreadArchive(groupId, channelId, threadId, true);
			toast.success("Thread archived");
			onClose();
		} catch (error) {
			console.error("Error archiving thread:", error);
			toast.error("Failed to archive thread");
		}
	};

	const handleSendMessage = async () => {
		if (!user || !userProfile || !threadContent.trim()) return;

		try {
			await sendThreadMessage(
				groupId,
				channelId,
				threadId,
				user.uid,
				userProfile.displayName,
				userProfile.photoURL,
				threadContent.trim()
			);
			setThreadContent("");
		} catch (error) {
			console.error("Error sending thread message:", error);
			toast.error("Failed to send message");
		}
	};

	if (loading) {
		return (
			<div className="w-full h-full border-l bg-background flex flex-col items-center justify-center gap-4">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<Button variant="outline" onClick={() => window.location.reload()}>
					Retry
				</Button>
			</div>
		);
	}

	if (!thread || !parentMessage) {
		return (
			<div className="w-full h-full border-l bg-background flex flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">Thread not found</p>
				<Button variant="outline" onClick={onClose}>
					Close
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full h-full border-l bg-background flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<div className="flex items-center gap-2">
					<MessageSquare className="h-5 w-5" />
					<div>
						<h3 className="font-semibold">Thread</h3>
						<p className="text-xs text-muted-foreground">
							{thread.messageCount} {thread.messageCount === 1 ? "message" : "messages"}
							{thread.lastMessageAt && (
								<> • Last message {formatDistance(thread.lastMessageAt.toDate(), new Date(), { addSuffix: true })}</>
							)}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-1">
					{onFullView && (
						<Button size="icon" variant="ghost" onClick={onFullView}>
							<Maximize2 className="h-4 w-4" />
						</Button>
					)}
					<Button size="icon" variant="ghost" onClick={handleArchive}>
						<Archive className="h-4 w-4" />
					</Button>
					<Button size="icon" variant="ghost" onClick={onClose}>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Parent Message */}
			<div className="p-4 bg-muted/30">
				<div className="text-xs text-muted-foreground mb-2">Thread started by {parentMessage.senderName}</div>
				<MessageItem
					message={parentMessage}
					groupId={groupId}
					channelId={channelId}
					showAvatar={true}
				/>
			</div>

			<Separator />

			{/* Thread Messages */}
			<ScrollArea className="flex-1 p-4">
				<div className="space-y-2">
					{messages.map((message, index) => {
						const prevMessage = messages[index - 1];
						const showAvatar =
							index === 0 ||
							prevMessage?.senderId !== message.senderId ||
							(message.createdAt && prevMessage?.createdAt &&
								message.createdAt.toMillis() - prevMessage.createdAt.toMillis() > 300000);
						return (
							<MessageItem
								key={message.id}
								message={message}
								groupId={groupId}
								channelId={channelId}
								showAvatar={showAvatar}
							/>
						);
					})}
					{messages.length === 0 && (
						<div className="text-center text-muted-foreground text-sm py-8">
							No messages yet. Be the first to reply!
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
			</ScrollArea>

			{/* Message Input for Thread */}
			<div className="border-t p-4">
				<div className="flex gap-2">
					<textarea
						value={threadContent}
						onChange={(e) => setThreadContent(e.target.value)}
						placeholder="Type a reply..."
						className="flex-1 min-h-[60px] max-h-[200px] resize-none p-2 rounded border bg-background"
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSendMessage();
							}
						}}
					/>
					<Button onClick={handleSendMessage} disabled={!threadContent.trim()}>
						Send
					</Button>
				</div>
			</div>
		</div>
	);
}

