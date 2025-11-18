import { X, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";

interface ReplyPreviewProps {
	message: Message;
	onCancel: () => void;
	className?: string;
}

export function ReplyPreview({ message, onCancel, className }: ReplyPreviewProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-2 px-3 py-2 bg-muted rounded-t border-l-4 border-primary",
				className
			)}>
			<Reply className="h-4 w-4 text-muted-foreground shrink-0" />
			<div className="flex-1 min-w-0">
				<div className="text-xs font-medium text-muted-foreground">
					Replying to {message.senderName}
				</div>
				<div className="text-sm truncate">{message.content}</div>
			</div>
			<Button
				size="icon"
				variant="ghost"
				className="h-6 w-6 shrink-0"
				onClick={onCancel}>
				<X className="h-4 w-4" />
			</Button>
		</div>
	);
}

