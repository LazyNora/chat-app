import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	EmojiPicker,
	EmojiPickerSearch,
	EmojiPickerContent,
	EmojiPickerFooter,
} from '@/components/ui/emoji-picker';

interface MessageReactionsProps {
	onReaction: (emoji: string) => void;
}

export function MessageReactions({ onReaction }: MessageReactionsProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					size="sm"
					variant="ghost"
					className="h-7 w-7">
					<Smile className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-fit p-0" align="end">
				<EmojiPicker
					className="h-[342px]"
					onEmojiSelect={({ emoji }) => {
						onReaction(emoji);
						setIsOpen(false);
					}}>
					<EmojiPickerSearch />
					<EmojiPickerContent />
					<EmojiPickerFooter />
				</EmojiPicker>
			</PopoverContent>
		</Popover>
	);
}
