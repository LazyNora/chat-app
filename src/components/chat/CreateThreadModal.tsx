import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { createThread } from "@/services/threads";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { Message } from "@/types";

interface CreateThreadModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	message: Message;
	groupId: string;
	channelId: string;
	onThreadCreated?: (threadId: string) => void;
}

export function CreateThreadModal({
	open,
	onOpenChange,
	message,
	groupId,
	channelId,
	onThreadCreated,
}: CreateThreadModalProps) {
	const [threadName, setThreadName] = useState("");
	const [loading, setLoading] = useState(false);
	const { user } = useAuthStore();

	const handleCreate = async () => {
		if (!user) return;

		setLoading(true);

		try {
			// Use message content as thread name if not provided
			const name = threadName.trim() || message.content.slice(0, 100) || "Thread";
			const threadId = await createThread(
				groupId,
				channelId,
				message.id,
				name,
				user.uid
			);
			toast.success("Thread created");
			setThreadName("");
			onOpenChange(false);
			onThreadCreated?.(threadId);
		} catch (error) {
			console.error("Error creating thread:", error);
			toast.error("Failed to create thread");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<MessageSquare className="h-5 w-5" />
						Create Thread
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<Label>Thread Name</Label>
						<Input
							value={threadName}
							onChange={(e) => setThreadName(e.target.value)}
							placeholder="Thread name (optional)"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleCreate();
								}
							}}
							autoFocus
						/>
						<p className="text-xs text-muted-foreground mt-1">
							Leave empty to use message content as thread name
						</p>
					</div>

					<div className="p-3 bg-muted rounded text-sm">
						<div className="text-xs text-muted-foreground mb-1">Parent Message:</div>
						<div className="font-medium">{message.senderName}</div>
						<div className="text-muted-foreground truncate">{message.content}</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={loading || !user}>
						Create Thread
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

