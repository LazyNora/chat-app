import Pusher from 'pusher-js';

const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY || '', {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER || '',
  authEndpoint: `${import.meta.env.VITE_BACKEND_URL}/api/pusher/auth`,
});

// Subscribe to user presence channel
export function subscribeToUserPresence(userId: string) {
  return pusher.subscribe(`presence-user-${userId}`);
}

// Subscribe to group presence channel
export function subscribeToGroupPresence(groupId: string) {
  return pusher.subscribe(`presence-group-${groupId}`);
}

// Trigger typing indicator
export function triggerTyping(channelName: string, userId: string, userName: string) {
  const channel = pusher.channel(channelName);
  if (channel) {
    channel.trigger('client-typing', {
      userId,
      userName,
    });
  }
}

// Trigger stopped typing
export function triggerStoppedTyping(channelName: string, userId: string) {
  const channel = pusher.channel(channelName);
  if (channel) {
    channel.trigger('client-stopped-typing', {
      userId,
    });
  }
}

// Update user status
export function updateUserStatus(
  userId: string,
  status: 'online' | 'idle' | 'dnd' | 'invisible'
) {
  const channel = pusher.channel(`presence-user-${userId}`);
  if (channel) {
    channel.trigger('client-status-changed', {
      status,
    });
  }
}

export default pusher;

