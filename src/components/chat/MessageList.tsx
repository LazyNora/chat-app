import { useEffect, useRef, useState } from 'react';
import { collection, query, orderBy, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Message } from '@/types';
import { MessageItem } from './MessageItem';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  groupId: string;
  channelId: string;
}

export function MessageList({ groupId, channelId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!groupId || !channelId) return;

    const messagesRef = collection(db, `groups/${groupId}/channels/${channelId}/messages`);
    const q = query(
      messagesRef,
      where('deleted', '==', false),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      setMessages(msgs);
      setLoading(false);

      // Scroll to bottom when new messages arrive
      setTimeout(scrollToBottom, 100);
    });

    return () => unsubscribe();
  }, [groupId, channelId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message, index) => {
          const showAvatar =
            index === 0 ||
            messages[index - 1].senderId !== message.senderId ||
            (message.createdAt.toMillis() - messages[index - 1].createdAt.toMillis()) > 300000; // 5 min

          return (
            <MessageItem
              key={message.id}
              message={message}
              groupId={groupId}
              channelId={channelId}
              showAvatar={showAvatar}
            />
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

