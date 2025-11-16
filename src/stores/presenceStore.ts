import { create } from 'zustand';

interface PresenceUser {
  userId: string;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  lastSeen: number;
}

interface TypingUser {
  userId: string;
  userName: string;
  channelId: string;
}

interface PresenceState {
  onlineUsers: Map<string, PresenceUser>;
  typingUsers: Map<string, TypingUser>;
  setUserOnline: (userId: string, status: 'online' | 'idle' | 'dnd' | 'invisible') => void;
  setUserOffline: (userId: string) => void;
  setUserTyping: (userId: string, userName: string, channelId: string) => void;
  removeUserTyping: (userId: string, channelId: string) => void;
  getOnlineStatus: (userId: string) => PresenceUser | undefined;
  getTypingUsers: (channelId: string) => TypingUser[];
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: new Map(),
  typingUsers: new Map(),

  setUserOnline: (userId, status) =>
    set((state) => {
      const newMap = new Map(state.onlineUsers);
      newMap.set(userId, {
        userId,
        status,
        lastSeen: Date.now(),
      });
      return { onlineUsers: newMap };
    }),

  setUserOffline: (userId) =>
    set((state) => {
      const newMap = new Map(state.onlineUsers);
      newMap.delete(userId);
      return { onlineUsers: newMap };
    }),

  setUserTyping: (userId, userName, channelId) =>
    set((state) => {
      const newMap = new Map(state.typingUsers);
      newMap.set(`${userId}-${channelId}`, {
        userId,
        userName,
        channelId,
      });
      return { typingUsers: newMap };
    }),

  removeUserTyping: (userId, channelId) =>
    set((state) => {
      const newMap = new Map(state.typingUsers);
      newMap.delete(`${userId}-${channelId}`);
      return { typingUsers: newMap };
    }),

  getOnlineStatus: (userId) => get().onlineUsers.get(userId),

  getTypingUsers: (channelId) =>
    Array.from(get().typingUsers.values()).filter((user) => user.channelId === channelId),
}));

