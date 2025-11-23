import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { sendDirectMessage, uploadDMFile, uploadDMAudioFile } from "@/services/dmMessages";
import { ReplyPreview } from "./ReplyPreview";
import { GifPicker } from "./GifPicker";
import { VoiceMessageRecorder } from "./VoiceMessageRecorder";
import { Paperclip, Send, X, ImageIcon, Mic } from "lucide-react";
import { toast } from "sonner";
import type { Message, MessageFile } from "@/types";
import { useDMTypingIndicators, useTypingTrigger } from "@/hooks/usePusher";

interface DMMessageInputProps {
	conversationId: string;
	replyingTo?: Message | null;
	onCancelReply?: () => void;
	disabled?: boolean;
}

export function DMMessageInput({
	conversationId,
	replyingTo,
	onCancelReply,
	disabled = false,
}: DMMessageInputProps) {
	const [content, setContent] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [sending, setSending] = useState(false);
	const [showGifPicker, setShowGifPicker] = useState(false);
	const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { user, userProfile } = useAuthStore();

	// Typing indicators
	useDMTypingIndicators(conversationId);
	const { triggerTypingIndicator, stopTypingIndicator } = useTypingTrigger(`presence-dm-${conversationId}`);

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

	// Handle content change and trigger typing
	const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setContent(e.target.value);
		if (e.target.value.trim()) {
			triggerTypingIndicator();
		}
	};

	// Handle send
	const handleSend = async () => {
		if (!user || !userProfile || (!content.trim() && files.length === 0)) return;

		setSending(true);
		try {
			let uploadedFiles: MessageFile[] | null = null;
			let gifURL: string | null = null;
			let audioURL: string | null = null;
			let audioDuration: number | null = null;

			// Upload files if any
			if (files.length > 0) {
				const uploadPromises = files.map((file) => uploadDMFile(conversationId, file));
				uploadedFiles = await Promise.all(uploadPromises);
			}

			await sendDirectMessage(
				conversationId,
				user.uid,
				userProfile.displayName,
				userProfile.photoURL,
				content || "",
				uploadedFiles,
				gifURL,
				audioURL,
				audioDuration
			);

			setContent("");
			setFiles([]);
			setShowGifPicker(false);
			onCancelReply?.();
		} catch (error: any) {
			console.error("Error sending message:", error);
			toast.error(error.message || "Failed to send message");
		} finally {
			setSending(false);
		}
	};

	// Handle voice message
	const handleSendVoiceMessage = async (audioBlob: Blob, duration: number) => {
		if (!user || !userProfile) return;

		setSending(true);
		try {
			const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, {
				type: audioBlob.type,
			});
			const uploadedAudio = await uploadDMAudioFile(conversationId, audioFile);

			await sendDirectMessage(
				conversationId,
				user.uid,
				userProfile.displayName,
				userProfile.photoURL,
				content || "Sent a voice message",
				null,
				null,
				uploadedAudio.url,
				duration
			);
			setContent("");
			setShowVoiceRecorder(false);
			onCancelReply?.();
			toast.success("Voice message sent!");
		} catch (error: any) {
			console.error("Error sending voice message:", error);
			toast.error(error.message || "Failed to send voice message");
		} finally {
			setSending(false);
		}
	};

	// Handle keyboard shortcuts
	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (!sending && !disabled && (content.trim() || files.length > 0)) {
				handleSend();
			}
		}
	};

	// Handle GIF selection
	const handleGifSelect = (gifURL: string) => {
		setShowGifPicker(false);
		// Send GIF immediately
		if (user && userProfile) {
			sendDirectMessage(
				conversationId,
				user.uid,
				userProfile.displayName,
				userProfile.photoURL,
				"",
				null,
				gifURL,
				null,
				null
			).catch((error) => {
				console.error("Error sending GIF:", error);
				toast.error("Failed to send GIF");
			});
		}
	};

	return (
		<div className="border-t space-y-0 relative">
			{/* Reply Preview */}
			{replyingTo && (
				<ReplyPreview
					message={replyingTo}
					onCancel={() => onCancelReply?.()}
				/>
			)}

			{/* Files Preview */}
			{files.length > 0 && (
				<div className="p-2 border-b flex flex-wrap gap-2">
					{files.map((file, index) => (
						<div
							key={index}
							className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
							<Paperclip className="h-4 w-4" />
							<span className="truncate max-w-[200px]">{file.name}</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-4 w-4"
								onClick={() => removeFile(index)}>
								<X className="h-3 w-3" />
							</Button>
						</div>
					))}
				</div>
			)}

			{showVoiceRecorder ? (
				<div className="p-4">
					<VoiceMessageRecorder
						onSend={handleSendVoiceMessage}
						onCancel={() => setShowVoiceRecorder(false)}
					/>
				</div>
			) : (
				<div className="p-4 space-y-2">
					{/* GIF Picker */}
					{showGifPicker && (
						<div className="mb-2">
							<GifPicker open={showGifPicker} onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
						</div>
					)}

					<div className="relative">
						<input
							type="file"
							ref={fileInputRef}
							className="hidden"
							multiple
							onChange={handleFileSelect}
							accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
						/>
						<Textarea
							ref={textareaRef}
							value={content}
							onChange={handleContentChange}
							onKeyDown={handleKeyDown}
							placeholder={`Message ${replyingTo ? `@${replyingTo.senderName}` : ""}`}
							disabled={sending || disabled}
							className="min-h-[60px] max-h-[200px] pr-20 resize-none"
						/>
						<div className="absolute bottom-2 right-2 flex items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={() => fileInputRef.current?.click()}
								disabled={sending || disabled}>
								<Paperclip className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={() => setShowGifPicker(!showGifPicker)}
								disabled={sending || disabled}>
								<ImageIcon className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={() => setShowVoiceRecorder(true)}
								disabled={sending || disabled}>
								<Mic className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={handleSend}
								disabled={sending || disabled || (!content.trim() && files.length === 0)}>
								<Send className="h-4 w-4" />
							</Button>
						</div>
					</div>
					<p className="text-xs text-muted-foreground px-2">
						Press Enter to send, Shift+Enter for new line
					</p>
				</div>
			)}
		</div>
	);
}

