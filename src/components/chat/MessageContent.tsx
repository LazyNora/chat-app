import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

interface MessageContentProps {
	content: string;
	mentions: string[];
	mentionsEveryone: boolean;
}

export function MessageContent({ content, mentions, mentionsEveryone }: MessageContentProps) {
	const { user } = useAuthStore();
	const isMentioned = user ? (mentions.includes(user.uid) || mentionsEveryone) : false;

	// Parse message content and render mentions as pills
	const renderContentWithMentions = () => {
		// Split content by @ mentions
		const parts = content.split(/(@\w+)/g);

		return (
			<div className={cn("prose prose-sm dark:prose-invert max-w-none break-words", isMentioned && "bg-primary/10 rounded px-2 py-1")}>
				{parts.map((part, index) => {
					// Check if this part is a mention
					if (part.startsWith("@")) {
						const mentionName = part.slice(1);
						const isCurrentUser = mentions.includes(user?.uid || "");
						const isEveryone = mentionName === "everyone" && mentionsEveryone;

						// Apply highlighting if mentioning current user or @everyone
						const shouldHighlight = isEveryone || (isCurrentUser && part === `@${mentionName}`);

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
								title={isEveryone ? "Mentions everyone" : `Mention: ${part}`}>
								{part}
							</span>
						);
					}

					// Regular text - render with markdown
					return (
						<ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>
							{part}
						</ReactMarkdown>
					);
				})}
			</div>
		);
	};

	return <>{renderContentWithMentions()}</>;
}

