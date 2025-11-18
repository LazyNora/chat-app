import { Timestamp } from "firebase/firestore";

// User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  customStatus: string | null;
  customStatusEmoji: string | null;
  statusType: "online" | "idle" | "dnd" | "invisible";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  fcmTokens: string[];
  settings: UserSettings;
}

export interface UserSettings {
  notifications: {
    allMessages: boolean;
    mentions: boolean;
    directMessages: boolean;
    soundEnabled: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowDMs: "everyone" | "friends" | "none";
  };
  appearance: {
    theme: "light" | "dark" | "system";
  };
}

// Group (Server) Types
export interface Group {
  id: string;
  name: string;
  description: string | null;
  iconURL: string | null;
  ownerId: string;
  createdAt: Timestamp;
  settings: GroupSettings;
  memberCount: number;
}

export interface GroupSettings {
  defaultCooldown: number;
  maxFileSize: number;
  contentFilter: "low" | "medium" | "high";
  inviteQREnabled: boolean;
}

export interface GroupMember {
  userId: string;
  displayName: string;
  photoURL: string | null;
  roles: string[];
  joinedAt: Timestamp;
  permissions: string[];
}

export interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  permissions: RolePermissions;
  createdAt: Timestamp;
}

export interface RolePermissions {
  manageGroup: boolean;
  manageRoles: boolean;
  manageChannels: boolean;
  kickMembers: boolean;
  banMembers: boolean;
  viewChannels: boolean;
  sendMessages: boolean;
  sendMediaFiles: boolean;
  mentionEveryone: boolean;
  manageMessages: boolean;
  readMessageHistory: boolean;
  voiceConnect: boolean;
  voiceSpeak: boolean;
  voiceMuteMembers: boolean;
  videoCall: boolean;
  screenShare: boolean;
}

// Channel Types
export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  description: string | null;
  position: number;
  categoryId: string | null;
  permissions: Record<string, ChannelPermissionOverride>;
  settings: ChannelSettings;
  pinnedMessageIds: string[];
  liveKitRoomName: string | null;
  createdAt: Timestamp;
  lastMessageAt: Timestamp | null;
}

export interface ChannelPermissionOverride {
  allow: string[];
  deny: string[];
}

export interface ChannelSettings {
  cooldown: number | null;
  maxFileSize: number | null;
}

export interface ChannelCategory {
  id: string;
  name: string;
  position: number;
  collapsed: boolean;
  createdAt: Timestamp;
}

// Message Types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string | null;
  type: "text" | "file" | "gif" | "sticker" | "system";
  files: MessageFile[] | null;
  gifURL: string | null;
  stickerURL: string | null;
  mentions: string[];
  mentionsEveryone: boolean;
  reactions: Record<string, string[]>;
  replyTo: string | null;
  threadId: string | null;
  edited: boolean;
  editedAt: Timestamp | null;
  deleted: boolean;
  deletedAt: Timestamp | null;
  createdAt: Timestamp;
  moderationStatus: "pending" | "approved" | "flagged" | null;
}

export interface MessageFile {
  name: string;
  url: string;
  type: string;
  size: number;
  thumbnailURL: string | null;
}

export interface Thread {
  id: string;
  name: string;
  creatorId: string;
  parentMessageId: string;
  messageCount: number;
  lastMessageAt: Timestamp;
  archived: boolean;
  createdAt: Timestamp;
}

// Direct Message Types
export interface DirectMessageConversation {
  id: string;
  participantIds: string[];
  participantData: Record<string, ParticipantData>;
  lastMessageAt: Timestamp;
  lastMessage: string | null;
  unreadCount: Record<string, number>;
  createdAt: Timestamp;
}

export interface ParticipantData {
  displayName: string;
  photoURL: string | null;
}

// Friend Types
export interface Friendship {
  id: string;
  userIds: string[];
  status: "pending" | "accepted" | "blocked";
  requesterId: string;
  createdAt: Timestamp;
  acceptedAt: Timestamp | null;
}

// Invite Types
export interface Invite {
  code: string;
  creatorId: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Timestamp | null;
  createdAt: Timestamp;
}

// Message Seen Status
export interface MessageSeenStatus {
  lastSeenMessageId: string;
  lastSeenAt: Timestamp;
}

// Presence Types (Pusher)
export interface PresenceInfo {
  userId: string;
  status: "online" | "idle" | "dnd" | "invisible";
  lastSeen: number;
}

export interface TypingInfo {
  userId: string;
  userName: string;
  channelId: string;
}

