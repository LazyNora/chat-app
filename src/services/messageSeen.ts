import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { MessageSeenStatus } from "@/types";

// Update last seen message for a user in a channel
export async function updateLastSeenMessage(
	userId: string,
	groupId: string,
	channelId: string,
	messageId: string
): Promise<void> {
	const seenRef = doc(
		db,
		`users/${userId}/messageSeenStatus`,
		channelId
	);

	await setDoc(
		seenRef,
		{
			groupId,
			lastSeenMessageId: messageId,
			lastSeenAt: serverTimestamp(),
		},
		{ merge: true }
	);
}

// Get last seen message status
export async function getLastSeenMessage(
	userId: string,
	channelId: string
): Promise<MessageSeenStatus | null> {
	const seenRef = doc(
		db,
		`users/${userId}/messageSeenStatus`,
		channelId
	);
	const seenSnap = await getDoc(seenRef);

	if (seenSnap.exists()) {
		return seenSnap.data() as MessageSeenStatus;
	}

	return null;
}

// Get unread count for a channel
export async function getUnreadCount(
	userId: string,
	groupId: string,
	channelId: string,
	lastMessageId: string | null
): Promise<number> {
	if (!lastMessageId) return 0;

	const seenStatus = await getLastSeenMessage(userId, channelId);
	if (!seenStatus || !seenStatus.lastSeenMessageId) {
		// If never seen, count all messages
		return 999; // Show as "99+" if too many
	}

	// In a real implementation, you'd query messages after lastSeenMessageId
	// For now, we'll return a placeholder
	return 0;
}

