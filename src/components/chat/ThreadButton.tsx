import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistance } from "date-fns";
import type { Thread } from "@/types";

interface ThreadButtonProps {
	thread: Thread | null;
	onClick: () => void;
}

export function ThreadButton({ thread, onClick }: ThreadButtonProps) {
	if (!thread) return null;

	const lastMessageTime = thread.lastMessageAt
		? formatDistance(thread.lastMessageAt.toDate(), new Date(), { addSuffix: true })
		: null;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClick}
						className="h-7 px-2 text-xs gap-1 text-primary hover:bg-primary/10">
						<MessageSquare className="h-3.5 w-3.5" />
						<span>{thread.messageCount}</span>
						<span className="text-muted-foreground">
							{thread.messageCount === 1 ? "message" : "messages"}
						</span>
						{lastMessageTime && (
							<span className="text-muted-foreground">• {lastMessageTime}</span>
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<div className="text-xs">
						<p>View thread</p>
						{lastMessageTime && <p className="text-muted-foreground">Last message {lastMessageTime}</p>}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

