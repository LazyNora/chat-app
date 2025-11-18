import { useState, useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { sendMessage, sendMessageWithFiles } from "@/services/messages";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";

interface MessageInputProps {
	groupId: string;
	channelId: string;
}

export function MessageInput({ groupId, channelId }: MessageInputProps) {
	const [content, setContent] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [sending, setSending] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { user, userProfile } = useAuthStore();

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files);

			// Check file size (50MB max)
			const maxSize = 50 * 1024 * 1024;
			const oversizedFiles = newFiles.filter((f) => f.size > maxSize);

			if (oversizedFiles.length > 0) {
				toast.error("Some files are too large (max 50MB)");
				return;
			}

			setFiles((prev) => [...prev, ...newFiles]);
		}
	};

	const removeFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSend = async () => {
		if (!user || !userProfile) return;
		if (!content.trim() && files.length === 0) return;

		setSending(true);

		try {
			if (files.length > 0) {
				await sendMessageWithFiles(
					groupId,
					channelId,
					user.uid,
					userProfile.displayName,
					userProfile.photoURL,
					content,
					files
				);
			} else {
				await sendMessage(
					groupId,
					channelId,
					user.uid,
					userProfile.displayName,
					userProfile.photoURL,
					content
				);
			}

			setContent("");
			setFiles([]);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} catch (error: any) {
			console.error("Error sending message:", error);
			toast.error(error.message || "Failed to send message");
		} finally {
			setSending(false);
		}
	};

	const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="border-t p-4 space-y-2">
			{files.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{files.map((file, index) => (
						<div
							key={index}
							className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-sm">
							<span className="truncate max-w-[200px]">{file.name}</span>
							<button onClick={() => removeFile(index)} className="hover:text-destructive">
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
				</div>
			)}

			<div className="flex gap-2">
				<input
					ref={fileInputRef}
					type="file"
					multiple
					className="hidden"
					onChange={handleFileSelect}
					accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
				/>

				<Button
					type="button"
					variant="outline"
					size="icon"
					onClick={() => fileInputRef.current?.click()}
					disabled={sending}>
					<Paperclip className="h-5 w-5" />
				</Button>

				<Textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					onKeyDown={handleKeyPress}
					placeholder="Type a message... (Markdown supported)"
					className="flex-1 min-h-[60px] max-h-[200px] resize-none"
					disabled={sending}
				/>

				<Button onClick={handleSend} disabled={sending || (!content.trim() && files.length === 0)}>
					<Send className="h-5 w-5" />
				</Button>
			</div>

			<p className="text-xs text-muted-foreground">
				Press <kbd className="px-1 rounded bg-muted">Enter</kbd> to send,{" "}
				<kbd className="px-1 rounded bg-muted">Shift+Enter</kbd> for new line
			</p>
		</div>
	);
}
