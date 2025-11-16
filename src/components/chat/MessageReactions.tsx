import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

interface MessageReactionsProps {
  onReaction: (emoji: string) => void;
}

export function MessageReactions({ onReaction }: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowPicker(!showPicker)}
      >
        <Smile className="h-4 w-4" />
      </Button>

      {showPicker && (
        <div className="absolute z-50 mt-2">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              onReaction(emojiData.emoji);
              setShowPicker(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

