import { useState } from "react";
import type { Message } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import { addReaction, removeReaction, editMessage } from "@/services/messages";
import { MessageContextMenu } from "./MessageContextMenu";
import { MessageContent } from "./MessageContent";
import { MessageReply } from "./MessageReply";
import { ThreadButton } from "./ThreadButton";
import { formatDistance } from "date-fns";
import { Edit, Pin } from "lucide-react";
import { MessageReactions } from "./MessageReactions";
import { toast } from "sonner";
import type { Thread } from "@/types";

interface MessageItemProps {
	message: Message;
	groupId: string;
	channelId: string;
	showAvatar: boolean;
	isPinned?: boolean;
	thread?: Thread | null;
	onReply?: (message: Message) => void;
	onCreateThread?: (message: Message) => void;
	onOpenThread?: (threadId: string) => void;
}

export function MessageItem({
	message,
	groupId,
	channelId,
	showAvatar,
	isPinned = false,
	thread,
	onReply,
	onCreateThread,
	onOpenThread,
}: MessageItemProps) {
	const { user } = useAuthStore();
	const [showActions, setShowActions] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content);

	const isOwner = user?.uid === message.senderId;
	const timestamp = message.createdAt?.toDate
		? formatDistance(message.createdAt.toDate(), new Date(), { addSuffix: true })
		: "Just now";

	const handleReaction = async (emoji: string) => {
		if (!user) return;

		try {
			const userReacted = message.reactions[emoji]?.includes(user.uid);

			if (userReacted) {
				await removeReaction(groupId, channelId, message.id, emoji, user.uid);
			} else {
				await addReaction(groupId, channelId, message.id, emoji, user.uid);
			}
		} catch (error) {
			console.error("Error handling reaction:", error);
		}
	};

	const handleEdit = async () => {
		if (!editContent.trim()) return;

		try {
			await editMessage(groupId, channelId, message.id, editContent);
			setIsEditing(false);
			toast.success("Message updated");
		} catch (error) {
			console.error("Error editing message:", error);
			toast.error("Failed to edit message");
		}
	};

	return (
		<MessageContextMenu
			message={message}
			groupId={groupId}
			channelId={channelId}
			isPinned={isPinned}
			onEdit={isOwner ? () => setIsEditing(true) : undefined}
			onReply={onReply ? () => onReply(message) : undefined}
			onCreateThread={onCreateThread ? () => onCreateThread(message) : undefined}>
			<div
				className="group relative flex gap-3 hover:bg-muted/50 p-2 rounded"
				onMouseEnter={() => setShowActions(true)}
				onMouseLeave={() => setShowActions(false)}>
				{showAvatar ? (
					<Avatar className="h-10 w-10">
						<AvatarImage src={message.senderPhotoURL || undefined} />
						<AvatarFallback>{message.senderName.charAt(0).toUpperCase()}</AvatarFallback>
					</Avatar>
				) : (
					<div className="w-10" />
				)}

				<div className="flex-1 min-w-0">
					{showAvatar && (
						<div className="flex items-baseline gap-2 mb-1">
							<span className="font-semibold">{message.senderName}</span>
							<span className="text-xs text-muted-foreground">{timestamp}</span>
							{message.edited && <span className="text-xs text-muted-foreground">(edited)</span>}
							{isPinned && (
								<Badge variant="secondary" className="text-xs">
									<Pin className="h-3 w-3 mr-1" />
									Pinned
								</Badge>
							)}
						</div>
					)}

					{message.replyTo && (
						<MessageReply
							groupId={groupId}
							channelId={channelId}
							replyToId={message.replyTo}
						/>
					)}

				{isEditing ? (
					<div className="space-y-2">
						<textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							className="w-full p-2 rounded border bg-background"
							rows={3}
						/>
						<div className="flex gap-2">
							<Button size="sm" onClick={handleEdit}>
								Save
							</Button>
							<Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
								Cancel
							</Button>
						</div>
					</div>
				) : (
					<>
						{message.type === "gif" && message.gifURL ? (
							<div className="mt-2">
								<img
									src={message.gifURL}
									alt="GIF"
									className="max-w-md rounded-lg cursor-pointer"
									onClick={() => window.open(message.gifURL!, "_blank")}
								/>
								{message.content && message.content !== "Sent a GIF" && (
									<div className="mt-2">
										<MessageContent
											content={message.content}
											mentions={message.mentions}
											mentionsEveryone={message.mentionsEveryone}
										/>
									</div>
								)}
							</div>
						) : (
							<MessageContent
								content={message.content}
								mentions={message.mentions}
								mentionsEveryone={message.mentionsEveryone}
							/>
						)}
					</>
				)}

				{message.files && message.files.length > 0 && (
					<div className="mt-2 space-y-2">
						{message.files.map((file, index) => (
							<div key={index} className="border rounded p-2">
								{file.type.startsWith("image/") && file.thumbnailURL ? (
									<img
										src={file.thumbnailURL}
										alt={file.name}
										className="max-w-md rounded cursor-pointer"
										onClick={() => window.open(file.url, "_blank")}
									/>
								) : (
									<a
										href={file.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:underline flex items-center gap-2">
										<span>{file.name}</span>
										<span className="text-xs text-muted-foreground">
											({(file.size / 1024 / 1024).toFixed(2)} MB)
										</span>
									</a>
								)}
							</div>
						))}
					</div>
				)}

				{Object.keys(message.reactions).length > 0 && (
					<div className="flex flex-wrap gap-1 mt-2">
						{Object.entries(message.reactions).map(([emoji, users]) => (
							<button
								key={emoji}
								onClick={() => handleReaction(emoji)}
								className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-sm hover:bg-accent ${
									user && users.includes(user.uid) ? "bg-accent border-primary" : ""
								}`}>
								<span>{emoji}</span>
								<span>{users.length}</span>
							</button>
						))}
					</div>
				)}

					{message.threadId && thread && onOpenThread && (
						<div className="mt-2">
							<ThreadButton
								thread={thread}
								onClick={() => onOpenThread(message.threadId!)}
							/>
						</div>
					)}
				</div>

				{/* Overlay action buttons */}
				{showActions && !isEditing && (
					<TooltipProvider>
						<div className="absolute right-2 top-2 flex items-center gap-1 bg-background/90 backdrop-blur-sm border rounded-md p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
							<MessageReactions onReaction={handleReaction} />

							{isOwner && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="icon"
											variant="ghost"
											className="h-7 w-7"
											onClick={() => setIsEditing(true)}>
											<Edit className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Edit Message</TooltipContent>
								</Tooltip>
							)}
						</div>
					</TooltipProvider>
				)}
			</div>
		</MessageContextMenu>
	);
}
