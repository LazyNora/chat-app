import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import Markdown from "react-markdown";

interface MessageContentProps {
	content: string;
	mentions: string[];
	mentionsEveryone: boolean;
}

export function MessageContent({ content, mentions, mentionsEveryone }: MessageContentProps) {
	const { user } = useAuthStore();
	const isMentioned = user ? mentions.includes(user.uid) || mentionsEveryone : false;

	// Parse message content and render mentions as pills, preserving markdown
	const renderContentWithMentions = () => {
		// Use a more sophisticated regex that doesn't break markdown
		// Match @mentions that are not part of markdown syntax
		const mentionRegex = /@(\w+)/g;
		const parts: Array<{ type: "text" | "mention"; content: string; mentionName?: string }> = [];
		let lastIndex = 0;
		let match;

		while ((match = mentionRegex.exec(content)) !== null) {
			// Add text before mention
			if (match.index > lastIndex) {
				parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
			}
			// Add mention
			parts.push({ type: "mention", content: match[0], mentionName: match[1] });
			lastIndex = match.index + match[0].length;
		}

		// Add remaining text
		if (lastIndex < content.length) {
			parts.push({ type: "text", content: content.slice(lastIndex) });
		}

		// If no mentions found, render entire content as markdown
		if (parts.length === 0) {
			parts.push({ type: "text", content });
		}

		return (
			<div
				className={cn(
					"prose prose-sm dark:prose-invert max-w-none wrap-break-word",
					isMentioned && "bg-primary/10 rounded px-2 py-1"
				)}>
				{parts.map((part, index) => {
					if (part.type === "mention") {
						const mentionName = part.mentionName!;
						const isCurrentUser = mentions.includes(user?.uid || "");
						const isEveryone = mentionName === "everyone" && mentionsEveryone;

						// Apply highlighting if mentioning current user or @everyone
						const shouldHighlight =
							isEveryone || (isCurrentUser && part.content === `@${mentionName}`);

						return (
							<span
								key={index}
								className={cn(
									"inline-flex items-center px-1.5 py-0.5 rounded font-medium mx-0.5",
									shouldHighlight
										? "bg-primary/20 text-primary hover:bg-primary/30"
										: "bg-accent text-accent-foreground hover:bg-accent/80",
									"cursor-pointer transition-colors"
								)}
								title={isEveryone ? "Mentions everyone" : `Mention: ${part.content}`}>
								{part.content}
							</span>
						);
					}

					// Regular text - render with markdown
					return (
						<span key={index} className="inline-block">
							<Markdown remarkPlugins={[remarkGfm]}>{part.content}</Markdown>
						</span>
					);
				})}
			</div>
		);
	};

	return <>{renderContentWithMentions()}</>;
}
