import { useState } from "react";
import type { Message } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { addReaction, removeReaction, deleteMessage, editMessage } from "@/services/messages";
import { formatDistance } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MoreVertical, Edit, Trash, Smile } from "lucide-react";
import { toast } from "sonner";

interface MessageItemProps {
	message: Message;
	groupId: string;
	channelId: string;
	showAvatar: boolean;
}

export function MessageItem({ message, groupId, channelId, showAvatar }: MessageItemProps) {
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

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this message?")) return;

		try {
			await deleteMessage(groupId, channelId, message.id);
			toast.success("Message deleted");
		} catch (error) {
			console.error("Error deleting message:", error);
			toast.error("Failed to delete message");
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
		<div
			className="group flex gap-3 hover:bg-muted/50 p-2 rounded"
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
					</div>
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
					<div className="prose prose-sm dark:prose-invert max-w-none">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
					</div>
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
			</div>

			{showActions && isOwner && !isEditing && (
				<div className="flex items-start gap-1">
					<Button
						size="icon"
						variant="ghost"
						className="h-6 w-6"
						onClick={() => handleReaction("👍")}>
						<Smile className="h-4 w-4" />
					</Button>
					<Button
						size="icon"
						variant="ghost"
						className="h-6 w-6"
						onClick={() => setIsEditing(true)}>
						<Edit className="h-4 w-4" />
					</Button>
					<Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleDelete}>
						<Trash className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
