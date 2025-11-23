import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { subscribeToGroupPresence, subscribeToUserPresence, triggerTyping, triggerStoppedTyping } from '@/services/pusher';

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

// Hook to manage typing indicators for group channels
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

// Hook to manage user presence for direct messages
export function useUserPresence(userId: string | null) {
  const { setUserOnline, setUserOffline } = usePresenceStore();

  useEffect(() => {
    if (!userId) return;

    const channel = subscribeToUserPresence(userId);

    channel.bind('pusher:subscription_succeeded', (members: any) => {
      members.each((member: any) => {
        if (member.id === userId) {
          setUserOnline(member.id, member.info.status || 'online');
        }
      });
    });

    channel.bind('pusher:member_added', (member: any) => {
      if (member.id === userId) {
        setUserOnline(member.id, member.info.status || 'online');
      }
    });

    channel.bind('pusher:member_removed', (member: any) => {
      if (member.id === userId) {
        setUserOffline(member.id);
      }
    });

    channel.bind('client-status-changed', (data: any) => {
      if (data.userId === userId) {
        setUserOnline(data.userId, data.status);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [userId, setUserOnline, setUserOffline]);
}

// Hook to manage typing indicators for direct messages
export function useDMTypingIndicators(conversationId: string | null) {
  const { user, userProfile } = useAuthStore();
  const { setUserTyping, removeUserTyping } = usePresenceStore();

  useEffect(() => {
    if (!conversationId || !user || !userProfile) return;

    // Use DM conversation channel for typing indicators
    const channelName = `presence-dm-${conversationId}`;
    const channel = subscribeToGroupPresence(conversationId); // Reusing group presence for DM

    channel.bind('client-typing', (data: any) => {
      if (data.userId !== user.uid) {
        setUserTyping(data.userId, data.userName, conversationId);

        // Auto-remove after 3 seconds
        setTimeout(() => {
          removeUserTyping(data.userId, conversationId);
        }, 3000);
      }
    });

    channel.bind('client-stopped-typing', (data: any) => {
      if (data.userId !== user.uid) {
        removeUserTyping(data.userId, conversationId);
      }
    });

    return () => {
      channel.unbind('client-typing');
      channel.unbind('client-stopped-typing');
    };
  }, [conversationId, user, userProfile, setUserTyping, removeUserTyping]);
}

// Hook to trigger typing indicator
export function useTypingTrigger(conversationId: string | null, type: 'group' | 'dm' = 'group') {
  const { user, userProfile } = useAuthStore();
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerTypingIndicator = React.useCallback(() => {
    if (!conversationId || !user || !userProfile) return;

    const channelName = type === 'dm'
      ? `presence-dm-${conversationId}`
      : `presence-group-${conversationId}`;

    triggerTyping(channelName, user.uid, userProfile.displayName);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      triggerStoppedTyping(channelName, user.uid);
    }, 3000);
  }, [conversationId, user, userProfile, type]);

  const stopTypingIndicator = React.useCallback(() => {
    if (!conversationId || !user) return;

    const channelName = type === 'dm'
      ? `presence-dm-${conversationId}`
      : `presence-group-${conversationId}`;

    triggerStoppedTyping(channelName, user.uid);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId, user, type]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { triggerTypingIndicator, stopTypingIndicator };
}

import React from 'react';
