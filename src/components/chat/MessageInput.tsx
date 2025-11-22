import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { sendMessage, sendMessageWithFiles, uploadAudioFile } from "@/services/messages";
import { sendThreadMessage } from "@/services/threads";
import { getGroupMembers } from "@/services/groups";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { ReplyPreview } from "./ReplyPreview";
import { GifPicker } from "./GifPicker";
import { VoiceMessageRecorder } from "./VoiceMessageRecorder";
import { Paperclip, Send, X, ImageIcon, Mic } from "lucide-react";
import { toast } from "sonner";
import type { GroupMember, Message } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";

interface MessageInputProps {
	groupId: string;
	channelId: string;
	threadId?: string;
	replyingTo?: Message | null;
	onCancelReply?: () => void;
	disabled?: boolean;
}

export function MessageInput({
	groupId,
	channelId,
	threadId,
	replyingTo,
	onCancelReply,
	disabled = false,
}: MessageInputProps) {
	const [content, setContent] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [sending, setSending] = useState(false);
	const [members, setMembers] = useState<GroupMember[]>([]);
	const [showMentions, setShowMentions] = useState(false);
	const [mentionSearch, setMentionSearch] = useState("");
	const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
	const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
	const [cursorPosition, setCursorPosition] = useState(0);
	const [showGifPicker, setShowGifPicker] = useState(false);
	const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { user, userProfile } = useAuthStore();
	const { hasPermission } = usePermissions(groupId);

	// Load members for mentions
	useEffect(() => {
		const loadMembers = async () => {
			try {
				const groupMembers = await getGroupMembers(groupId);
				setMembers(groupMembers);
			} catch (error) {
				console.error("Error loading members:", error);
			}
		};

		loadMembers();
	}, [groupId]);

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

	// Handle content change and detect mentions
	const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newContent = e.target.value;
		const newCursorPos = e.target.selectionStart;

		setContent(newContent);
		setCursorPosition(newCursorPos);

		// Check for @ mention
		const textBeforeCursor = newContent.slice(0, newCursorPos);
		const lastAtIndex = textBeforeCursor.lastIndexOf("@");

		if (lastAtIndex !== -1) {
			const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

			// Check if we're in a mention (no spaces after @)
			if (!textAfterAt.includes(" ") && textAfterAt.length >= 0) {
				setMentionSearch(textAfterAt);
				setShowMentions(true);
				setSelectedMentionIndex(0);

				// Calculate position for autocomplete dropdown - position above input
				if (textareaRef.current) {
					const rect = textareaRef.current.getBoundingClientRect();
					setMentionPosition({
						top: rect.top - 5, // Position above instead of below
						left: rect.left,
					});
				}
				return;
			}
		}

		setShowMentions(false);
	};

	// Handle mention selection
	const handleMentionSelect = (member: GroupMember | "everyone") => {
		const textBeforeCursor = content.slice(0, cursorPosition);
		const lastAtIndex = textBeforeCursor.lastIndexOf("@");
		const textAfterCursor = content.slice(cursorPosition);

		const mentionText = member === "everyone" ? "@everyone " : `@${member.displayName} `;
		const newContent = content.slice(0, lastAtIndex) + mentionText + textAfterCursor;

		setContent(newContent);
		setShowMentions(false);

		// Focus back on textarea and set cursor position
		setTimeout(() => {
			if (textareaRef.current) {
				const newCursorPos = lastAtIndex + mentionText.length;
				textareaRef.current.focus();
				textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
			}
		}, 0);
	};

	// Extract mentions from message content
	const extractMentions = (): { userIds: string[]; mentionsEveryone: boolean } => {
		const mentions = content.match(/@(\w+)/g) || [];
		const mentionsEveryone = mentions.some((m) => m === "@everyone");
		const userIds: string[] = [];

		mentions.forEach((mention) => {
			const name = mention.slice(1); // Remove @
			const member = members.find((m) => m.displayName === name);
			if (member) {
				userIds.push(member.userId);
			}
		});

		return { userIds, mentionsEveryone };
	};

	// Handle GIF selection
	const handleGifSelect = async (gifUrl: string) => {
		if (!user || !userProfile) return;

		setSending(true);

		try {
			const { userIds, mentionsEveryone } = extractMentions();
			const replyToId = replyingTo?.id || null;

			await sendMessage(
				groupId,
				channelId,
				user.uid,
				userProfile.displayName,
				userProfile.photoURL,
				content || "Sent a GIF",
				userIds,
				mentionsEveryone,
				replyToId,
				null,
				gifUrl
			);

			setContent("");
			setShowMentions(false);
			onCancelReply?.();
			toast.success("GIF sent!");
		} catch (error: any) {
			console.error("Error sending GIF:", error);
			toast.error(error.message || "Failed to send GIF");
		} finally {
			setSending(false);
		}
	};

	const handleVoiceMessageSend = async (audioBlob: Blob, duration: number) => {
		if (!user || !userProfile) return;

		setSending(true);
		setShowVoiceRecorder(false);

		try {
			// Upload audio file
			const audioURL = await uploadAudioFile(groupId, channelId, audioBlob);

			// Send message with audio
			const { userIds, mentionsEveryone } = extractMentions();
			const replyToId = replyingTo?.id || null;

			await sendMessage(
				groupId,
				channelId,
				user.uid,
				userProfile.displayName,
				userProfile.photoURL,
				content || "Voice message",
				userIds,
				mentionsEveryone,
				replyToId,
				null,
				null,
				audioURL,
				duration
			);

			setContent("");
			setShowMentions(false);
			onCancelReply?.();
			toast.success("Voice message sent!");
		} catch (error: any) {
			console.error("Error sending voice message:", error);
			toast.error(error.message || "Failed to send voice message");
		} finally {
			setSending(false);
		}
	};

	const handleSend = async () => {
		if (!user || !userProfile) return;
		if (!content.trim() && files.length === 0) return;

		setSending(true);

		try {
			// If threadId is provided, send to thread
			if (threadId) {
				if (!content.trim()) {
					toast.error("Thread messages cannot contain files only");
					setSending(false);
					return;
				}
				await sendThreadMessage(
					groupId,
					channelId,
					threadId,
					user.uid,
					userProfile.displayName,
					userProfile.photoURL,
					content.trim()
				);
			} else {
				const { userIds, mentionsEveryone } = extractMentions();
				const replyToId = replyingTo?.id || null;

				if (files.length > 0) {
					await sendMessageWithFiles(
						groupId,
						channelId,
						user.uid,
						userProfile.displayName,
						userProfile.photoURL,
						content,
						files,
						userIds,
						mentionsEveryone
					);
				} else {
					await sendMessage(
						groupId,
						channelId,
						user.uid,
						userProfile.displayName,
						userProfile.photoURL,
						content,
						userIds,
						mentionsEveryone,
						replyToId
					);
				}
			}

			setContent("");
			setFiles([]);
			setShowMentions(false);
			onCancelReply?.();
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
		// Handle mention autocomplete navigation
		if (showMentions) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				const filteredMembers = members.filter((m) =>
					m.displayName.toLowerCase().includes(mentionSearch.toLowerCase())
				);
				const canMentionEveryone = hasPermission("mentionEveryone");
				const showEveryone = canMentionEveryone && "everyone".includes(mentionSearch.toLowerCase());
				const maxIndex = showEveryone ? filteredMembers.length : filteredMembers.length - 1;
				setSelectedMentionIndex((prev) => {
					return prev < maxIndex ? prev + 1 : 0;
				});
				return;
			}

			if (e.key === "ArrowUp") {
				e.preventDefault();
				const filteredMembers = members.filter((m) =>
					m.displayName.toLowerCase().includes(mentionSearch.toLowerCase())
				);
				const canMentionEveryone = hasPermission("mentionEveryone");
				const showEveryone = canMentionEveryone && "everyone".includes(mentionSearch.toLowerCase());
				const maxIndex = showEveryone ? filteredMembers.length : filteredMembers.length - 1;
				setSelectedMentionIndex((prev) => {
					return prev > 0 ? prev - 1 : maxIndex;
				});
				return;
			}

			if (e.key === "Enter" || e.key === "Tab") {
				e.preventDefault();
				// Get the selected member
				const filteredMembers = members.filter((m) =>
					m.displayName.toLowerCase().includes(mentionSearch.toLowerCase())
				);
				// Check if @everyone should be shown
				const canMentionEveryone = hasPermission("mentionEveryone");
				const showEveryone = canMentionEveryone && "everyone".includes(mentionSearch.toLowerCase());
				const items: (GroupMember | "everyone")[] = showEveryone
					? ["everyone", ...filteredMembers]
					: filteredMembers;

				const selectedItem = items[selectedMentionIndex];
				if (selectedItem) {
					handleMentionSelect(selectedItem);
				}
				return;
			}

			if (e.key === "Escape") {
				e.preventDefault();
				setShowMentions(false);
				return;
			}
		}

		// Normal message sending
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	if (showVoiceRecorder) {
		return (
			<div className="border-t space-y-0 relative">
				<VoiceMessageRecorder
					onSend={handleVoiceMessageSend}
					onCancel={() => setShowVoiceRecorder(false)}
				/>
			</div>
		);
	}

	return (
		<div className="border-t space-y-0 relative">
			{replyingTo && onCancelReply && (
				<ReplyPreview message={replyingTo} onCancel={onCancelReply} className="mx-4 mt-4" />
			)}

			<div className="p-4 space-y-2">
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

				{showMentions && (
					<MentionAutocomplete
						members={members}
						searchQuery={mentionSearch}
						groupId={groupId}
						selectedIndex={selectedMentionIndex}
						onSelect={handleMentionSelect}
						position={mentionPosition}
					/>
				)}

				<GifPicker
					open={showGifPicker}
					onClose={() => setShowGifPicker(false)}
					onSelect={handleGifSelect}
				/>

				<div className="relative">
					<input
						ref={fileInputRef}
						type="file"
						multiple
						className="hidden"
						onChange={handleFileSelect}
						accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
					/>

					<Textarea
						ref={textareaRef}
						value={content}
						onChange={handleContentChange}
						onKeyDown={handleKeyPress}
						placeholder={
							disabled
								? "This thread is archived (read-only)"
								: threadId
								? "Type a reply..."
								: "Type a message... (Markdown supported, type @ to mention)"
						}
						className="flex-1 min-h-[60px] max-h-[200px] resize-none pr-24"
						disabled={sending || disabled}
					/>

					{/* Overlay buttons */}
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
							onClick={() => setShowVoiceRecorder(true)}
							disabled={sending || disabled}>
							<Mic className="h-4 w-4" />
						</Button>

						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={() => setShowGifPicker(true)}
							disabled={sending || disabled}>
							<ImageIcon className="h-4 w-4" />
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

				<p className="text-xs text-muted-foreground">
					Press <kbd className="px-1 rounded bg-muted">Enter</kbd> to send,{" "}
					<kbd className="px-1 rounded bg-muted">Shift+Enter</kbd> for new line,{" "}
					<kbd className="px-1 rounded bg-muted">@</kbd> to mention
				</p>
			</div>
		</div>
	);
}
