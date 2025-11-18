import { useState, useEffect } from "react";
import { X, Pin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageItem } from "./MessageItem";
import type { Message } from "@/types";
import { collection, query, where, orderBy, onSnapshot, doc, onSnapshot as onDocSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";

interface PinnedMessagesPanelProps {
	groupId: string;
	channelId: string;
	onClose: () => void;
	onJumpToMessage?: (messageId: string) => void;
}

export function PinnedMessagesPanel({
	groupId,
	channelId,
	onClose,
	onJumpToMessage,
}: PinnedMessagesPanelProps) {
	const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);

	// Real-time channel pinned messages
	useEffect(() => {
		if (!groupId || !channelId) return;

		const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
		const unsubscribe = onDocSnapshot(channelRef, (snap) => {
			if (snap.exists()) {
				const channelData = snap.data();
				const pinnedIds = channelData.pinnedMessageIds || [];
				setPinnedMessageIds(pinnedIds);
			}
		});

		return () => unsubscribe();
	}, [groupId, channelId]);

	// Real-time pinned messages
	useEffect(() => {
		if (!groupId || !channelId || pinnedMessageIds.length === 0) {
			setPinnedMessages([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		const messagesRef = collection(db, `groups/${groupId}/channels/${channelId}/messages`);
		const q = query(
			messagesRef,
			where("deleted", "==", false),
			orderBy("createdAt", "desc")
		);

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const allMessages = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Message[];

			// Filter to only pinned messages
			const pinned = allMessages.filter((msg) => pinnedMessageIds.includes(msg.id));
			setPinnedMessages(pinned);
			setLoading(false);
		});

		return () => unsubscribe();
	}, [groupId, channelId, pinnedMessageIds]);

	return (
		<div className="w-full h-full border-l bg-background flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<div className="flex items-center gap-2">
					<Pin className="h-5 w-5" />
					<div>
						<h3 className="font-semibold">Pinned Messages</h3>
						<p className="text-xs text-muted-foreground">
							{pinnedMessages.length} of 50 messages
						</p>
					</div>
				</div>
				<Button size="icon" variant="ghost" onClick={onClose}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Pinned Messages */}
			<ScrollArea className="flex-1">
				{loading ? (
					<div className="flex flex-col items-center justify-center h-full gap-4">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						<Button variant="outline" onClick={() => window.location.reload()}>
							Retry
						</Button>
					</div>
				) : pinnedMessages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full p-8 text-center">
						<Pin className="h-12 w-12 text-muted-foreground mb-4" />
						<h4 className="font-semibold mb-2">No Pinned Messages</h4>
						<p className="text-sm text-muted-foreground">
							Important messages that are pinned will show up here.
						</p>
					</div>
				) : (
					<div className="p-4 space-y-4">
						{pinnedMessages.map((message) => (
							<div key={message.id} className="border rounded-lg p-3">
								<MessageItem
									message={message}
									groupId={groupId}
									channelId={channelId}
									showAvatar={true}
									isPinned={true}
								/>
								{onJumpToMessage && (
									<div className="mt-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onJumpToMessage(message.id)}>
											Jump to message
										</Button>
									</div>
								)}
								<Separator className="mt-3" />
							</div>
						))}
					</div>
				)}
			</ScrollArea>
		</div>
	);
}

