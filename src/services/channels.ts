import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Channel, ChannelSettings } from '@/types';

// Create a new channel
export async function createChannel(
  groupId: string,
  name: string,
  type: 'text' | 'voice',
  description?: string,
  categoryId?: string
): Promise<string> {
  const channelRef = doc(collection(db, `groups/${groupId}/channels`));
  const channelId = channelRef.id;

  // Get current channel count for position
  const channelsRef = collection(db, `groups/${groupId}/channels`);
  const channelsSnap = await getDocs(channelsRef);
  const position = channelsSnap.size;

  const defaultSettings: ChannelSettings = {
    cooldown: null,
    maxFileSize: null,
  };

  const channelData: Omit<Channel, 'id' | 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    name,
    type,
    description: description || null,
    position,
    categoryId: categoryId || null,
    permissions: {},
    settings: defaultSettings,
    pinnedMessageIds: [],
    liveKitRoomName: type === 'voice' ? `group-${groupId}-channel-${channelId}` : null,
    createdAt: serverTimestamp(),
    lastMessageAt: null,
  };

  await setDoc(channelRef, channelData);

  return channelId;
}

// Get channel by ID
export async function getChannel(groupId: string, channelId: string): Promise<Channel | null> {
  const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
  const channelSnap = await getDoc(channelRef);

  if (channelSnap.exists()) {
    return { id: channelSnap.id, ...channelSnap.data() } as Channel;
  }

  return null;
}

// Get all channels in a group
export async function getGroupChannels(groupId: string): Promise<Channel[]> {
  const channelsRef = collection(db, `groups/${groupId}/channels`);
  const q = query(channelsRef, orderBy('position', 'asc'));
  const channelsSnap = await getDocs(q);

  return channelsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Channel));
}

// Update channel
export async function updateChannel(
  groupId: string,
  channelId: string,
  updates: Partial<Omit<Channel, 'id' | 'createdAt'>>
): Promise<void> {
  const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
  await setDoc(channelRef, updates, { merge: true });
}

// Delete channel
export async function deleteChannel(groupId: string, channelId: string): Promise<void> {
  const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
  await deleteDoc(channelRef);

  // Note: In production, you might want to also delete all messages in the channel
  // This would require a cloud function or batch operation
}

// Reorder channels
export async function reorderChannels(
  groupId: string,
  channelUpdates: Array<{ id: string; position: number }>
): Promise<void> {
  const promises = channelUpdates.map(({ id, position }) => {
    const channelRef = doc(db, `groups/${groupId}/channels`, id);
    return setDoc(channelRef, { position }, { merge: true });
  });

  await Promise.all(promises);
}

// Pin message in channel
export async function pinMessage(
  groupId: string,
  channelId: string,
  messageId: string
): Promise<void> {
  const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
  const channelSnap = await getDoc(channelRef);

  if (channelSnap.exists()) {
    const channel = channelSnap.data() as Channel;
    const pinnedIds = channel.pinnedMessageIds || [];

    if (!pinnedIds.includes(messageId) && pinnedIds.length < 50) {
      await setDoc(
        channelRef,
        {
          pinnedMessageIds: [...pinnedIds, messageId],
        },
        { merge: true }
      );
    }
  }
}

// Unpin message in channel
export async function unpinMessage(
  groupId: string,
  channelId: string,
  messageId: string
): Promise<void> {
  const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
  const channelSnap = await getDoc(channelRef);

  if (channelSnap.exists()) {
    const channel = channelSnap.data() as Channel;
    const pinnedIds = channel.pinnedMessageIds || [];

    await setDoc(
      channelRef,
      {
        pinnedMessageIds: pinnedIds.filter((id) => id !== messageId),
      },
      { merge: true }
    );
  }
}

// Update channel settings
export async function updateChannelSettings(
  groupId: string,
  channelId: string,
  settings: Partial<ChannelSettings>
): Promise<void> {
  const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
  await setDoc(
    channelRef,
    {
      settings,
    },
    { merge: true }
  );
}

