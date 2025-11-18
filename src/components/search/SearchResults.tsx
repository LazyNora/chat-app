import { Hash, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import type { SearchResult } from "@/services/search";
import { MessageContent } from "@/components/chat/MessageContent";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
	results: SearchResult[];
	query: string;
	onJumpToMessage: (result: SearchResult) => void;
}

export function SearchResults({ results, query, onJumpToMessage }: SearchResultsProps) {
	const highlightText = (text: string, searchQuery: string) => {
		if (!searchQuery.trim()) return text;

		const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
		return parts.map((part, index) =>
			part.toLowerCase() === searchQuery.toLowerCase() ? (
				<mark key={index} className="bg-yellow-200 dark:bg-yellow-900">
					{part}
				</mark>
			) : (
				part
			)
		);
	};

	return (
		<div className="space-y-4">
			{results.map((result, index) => {
				const timestamp = result.message.createdAt?.toDate
					? formatDistance(result.message.createdAt.toDate(), new Date(), {
							addSuffix: true,
						})
					: "Just now";

				return (
					<div
						key={`${result.channel.id}-${result.message.id}-${index}`}
						className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
						onClick={() => onJumpToMessage(result)}>
						{/* Channel Header */}
						<div className="flex items-center gap-2 mb-2">
							<Hash className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">{result.channel.name}</span>
							<span className="text-xs text-muted-foreground">•</span>
							<span className="text-xs text-muted-foreground">{timestamp}</span>
						</div>

						{/* Context Before */}
						{result.contextBefore && (
							<div className="text-xs text-muted-foreground mb-1 pl-4 border-l-2 border-muted-foreground/30">
								<span className="font-medium">{result.contextBefore.senderName}:</span>{" "}
								{result.contextBefore.content.slice(0, 100)}
								{result.contextBefore.content.length > 100 && "..."}
							</div>
						)}

						{/* Main Message */}
						<div className="flex items-start gap-3">
							<Avatar className="h-8 w-8">
								<AvatarImage src={result.message.senderPhotoURL || undefined} />
								<AvatarFallback>
									{result.message.senderName.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-semibold text-sm">
										{result.message.senderName}
									</span>
									{result.message.type !== "text" && (
										<Badge variant="secondary" className="text-xs">
											{result.message.type}
										</Badge>
									)}
								</div>

								<div className="text-sm">
									<MessageContent
										content={result.message.content}
										mentions={result.message.mentions}
										mentionsEveryone={result.message.mentionsEveryone}
									/>
								</div>

								{result.message.files && result.message.files.length > 0 && (
									<div className="mt-2 text-xs text-muted-foreground">
										{result.message.files.length} file
										{result.message.files.length > 1 ? "s" : ""} attached
									</div>
								)}
							</div>

							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 shrink-0"
								onClick={(e) => {
									e.stopPropagation();
									onJumpToMessage(result);
								}}>
								<ArrowRight className="h-4 w-4" />
							</Button>
						</div>

						{/* Context After */}
						{result.contextAfter && (
							<div className="text-xs text-muted-foreground mt-1 pl-4 border-l-2 border-muted-foreground/30">
								<span className="font-medium">{result.contextAfter.senderName}:</span>{" "}
								{result.contextAfter.content.slice(0, 100)}
								{result.contextAfter.content.length > 100 && "..."}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

