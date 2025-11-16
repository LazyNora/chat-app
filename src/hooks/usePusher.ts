import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { subscribeToGroupPresence, subscribeToUserPresence } from '@/services/pusher';

// Hook to manage Pusher presence for a group
export function useGroupPresence(groupId: string | null) {
  const { user } = useAuthStore();
  const { setUserOnline, setUserOffline } = usePresenceStore();

  useEffect(() => {
    if (!groupId || !user) return;

    const channel = subscribeToGroupPresence(groupId);

    // Handle presence events
    channel.bind('pusher:subscription_succeeded', (members: any) => {
      members.each((member: any) => {
        setUserOnline(member.id, member.info.status || 'online');
      });
    });

    channel.bind('pusher:member_added', (member: any) => {
      setUserOnline(member.id, member.info.status || 'online');
    });

    channel.bind('pusher:member_removed', (member: any) => {
      setUserOffline(member.id);
    });

    channel.bind('client-status-changed', (data: any) => {
      setUserOnline(data.userId, data.status);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [groupId, user, setUserOnline, setUserOffline]);
}

// Hook to manage typing indicators
export function useTypingIndicators(groupId: string | null, channelId: string | null) {
  const { setUserTyping, removeUserTyping } = usePresenceStore();

  useEffect(() => {
    if (!groupId || !channelId) return;

    const channel = subscribeToGroupPresence(groupId);

    channel.bind('client-typing', (data: any) => {
      setUserTyping(data.userId, data.userName, channelId);

      // Auto-remove after 3 seconds
      setTimeout(() => {
        removeUserTyping(data.userId, channelId);
      }, 3000);
    });

    channel.bind('client-stopped-typing', (data: any) => {
      removeUserTyping(data.userId, channelId);
    });

    return () => {
      channel.unbind('client-typing');
      channel.unbind('client-stopped-typing');
    };
  }, [groupId, channelId, setUserTyping, removeUserTyping]);
}

