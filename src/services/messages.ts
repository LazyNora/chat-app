import {
	collection,
	doc,
	setDoc,
	getDoc,
	getDocs,
	query,
	orderBy,
	limit,
	where,
	deleteDoc,
	serverTimestamp,
	Timestamp,
	writeBatch,
	updateDoc,
	arrayUnion,
	arrayRemove,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import type { Message, MessageFile } from "@/types";

// Send a message
export async function sendMessage(
	groupId: string,
	channelId: string,
	senderId: string,
	senderName: string,
	senderPhotoURL: string | null,
	content: string,
	mentions: string[] = [],
	mentionsEveryone: boolean = false,
	replyTo: string | null = null,
	files: MessageFile[] | null = null,
	gifURL: string | null = null
): Promise<string> {
	const messageRef = doc(collection(db, `groups/${groupId}/channels/${channelId}/messages`));
	const messageId = messageRef.id;

	// Determine message type
	let messageType: "text" | "file" | "gif" | "sticker" | "system" = "text";
	if (gifURL) {
		messageType = "gif";
	} else if (files && files.length > 0) {
		messageType = "file";
	}

	const messageData: Omit<Message, "id" | "createdAt"> & {
		createdAt: ReturnType<typeof serverTimestamp>;
	} = {
		content,
		senderId,
		senderName,
		senderPhotoURL,
		type: messageType,
		files,
		gifURL,
		stickerURL: null,
		mentions,
		mentionsEveryone,
		reactions: {},
		replyTo,
		threadId: null,
		edited: false,
		editedAt: null,
		deleted: false,
		deletedAt: null,
		createdAt: serverTimestamp(),
		moderationStatus: null,
	};

	const batch = writeBatch(db);

	// Create message
	batch.set(messageRef, messageData);

	// Update channel lastMessageAt
	const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
	batch.update(channelRef, { lastMessageAt: serverTimestamp() });

	await batch.commit();

	return messageId;
}

// Get a single message by ID
export async function getMessage(
	groupId: string,
	channelId: string,
	messageId: string
): Promise<Message | null> {
	const messageRef = doc(db, `groups/${groupId}/channels/${channelId}/messages`, messageId);
	const messageSnap = await getDoc(messageRef);

	if (messageSnap.exists()) {
		return { id: messageSnap.id, ...messageSnap.data() } as Message;
	}

	return null;
}

// Get messages from a channel
export async function getChannelMessages(
	groupId: string,
	channelId: string,
	limitCount: number = 50
): Promise<Message[]> {
	const messagesRef = collection(db, `groups/${groupId}/channels/${channelId}/messages`);
	const q = query(
		messagesRef,
		where("deleted", "==", false),
		orderBy("createdAt", "desc"),
		limit(limitCount)
	);

	const snapshot = await getDocs(q);
	const messages = snapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data(),
	})) as Message[];

	return messages.reverse(); // Return in chronological order
}

// Edit a message
export async function editMessage(
	groupId: string,
	channelId: string,
	messageId: string,
	newContent: string
): Promise<void> {
	const messageRef = doc(db, `groups/${groupId}/channels/${channelId}/messages`, messageId);
	await updateDoc(messageRef, {
		content: newContent,
		edited: true,
		editedAt: serverTimestamp(),
	});
}

// Delete a message
export async function deleteMessage(
	groupId: string,
	channelId: string,
	messageId: string,
	hardDelete: boolean = false
): Promise<void> {
	const messageRef = doc(db, `groups/${groupId}/channels/${channelId}/messages`, messageId);

	if (hardDelete) {
		await deleteDoc(messageRef);
	} else {
		await updateDoc(messageRef, {
			deleted: true,
			deletedAt: serverTimestamp(),
			content: "[Message deleted]",
		});
	}
}

// Add reaction to message
export async function addReaction(
	groupId: string,
	channelId: string,
	messageId: string,
	emoji: string,
	userId: string
): Promise<void> {
	const messageRef = doc(db, `groups/${groupId}/channels/${channelId}/messages`, messageId);
	const messageSnap = await getDoc(messageRef);

	if (messageSnap.exists()) {
		const message = messageSnap.data() as Message;
		const reactions = message.reactions || {};

		if (reactions[emoji]) {
			// Add user to existing reaction if not already there
			if (!reactions[emoji].includes(userId)) {
				await updateDoc(messageRef, {
					[`reactions.${emoji}`]: arrayUnion(userId),
				});
			}
		} else {
			// Create new reaction
			await updateDoc(messageRef, {
				[`reactions.${emoji}`]: [userId],
			});
		}
	}
}

// Remove reaction from message
export async function removeReaction(
	groupId: string,
	channelId: string,
	messageId: string,
	emoji: string,
	userId: string
): Promise<void> {
	const messageRef = doc(db, `groups/${groupId}/channels/${channelId}/messages`, messageId);
	const messageSnap = await getDoc(messageRef);

	if (messageSnap.exists()) {
		const message = messageSnap.data() as Message;
		const reactions = message.reactions || {};

		if (reactions[emoji]) {
			const updatedUsers = reactions[emoji].filter((uid) => uid !== userId);

			if (updatedUsers.length === 0) {
				// Remove reaction entirely if no users left
				const newReactions = { ...reactions };
				delete newReactions[emoji];
				await updateDoc(messageRef, { reactions: newReactions });
			} else {
				await updateDoc(messageRef, {
					[`reactions.${emoji}`]: updatedUsers,
				});
			}
		}
	}
}

// Upload file to Firebase Storage
export async function uploadMessageFile(
	groupId: string,
	channelId: string,
	file: File
): Promise<MessageFile> {
	const timestamp = Date.now();
	const fileName = `${timestamp}_${file.name}`;
	const filePath = `groups/${groupId}/channels/${channelId}/files/${fileName}`;
	const fileRef = ref(storage, filePath);

	await uploadBytes(fileRef, file);
	const downloadURL = await getDownloadURL(fileRef);

	// Generate thumbnail for images
	let thumbnailURL: string | null = null;
	if (file.type.startsWith("image/")) {
		// For simplicity, we'll use the same URL as thumbnail
		// In production, you might want to generate actual thumbnails
		thumbnailURL = downloadURL;
	}

	return {
		name: file.name,
		url: downloadURL,
		type: file.type,
		size: file.size,
		thumbnailURL,
	};
}

// Send message with files
export async function sendMessageWithFiles(
	groupId: string,
	channelId: string,
	senderId: string,
	senderName: string,
	senderPhotoURL: string | null,
	content: string,
	files: File[],
	mentions: string[] = [],
	mentionsEveryone: boolean = false
): Promise<string> {
	// Upload all files first
	const uploadedFiles = await Promise.all(
		files.map((file) => uploadMessageFile(groupId, channelId, file))
	);

	// Send message with file references
	return sendMessage(
		groupId,
		channelId,
		senderId,
		senderName,
		senderPhotoURL,
		content,
		mentions,
		mentionsEveryone,
		null,
		uploadedFiles
	);
}

// Search messages
export async function searchMessages(
	groupId: string,
	channelId: string,
	searchQuery: string
): Promise<Message[]> {
	// Note: Firestore doesn't support full-text search
	// This is a simple implementation that fetches messages and filters client-side
	// For production, you'd want to use a service like Algolia or Elasticsearch

	const messagesRef = collection(db, `groups/${groupId}/channels/${channelId}/messages`);
	const q = query(
		messagesRef,
		where("deleted", "==", false),
		orderBy("createdAt", "desc"),
		limit(100)
	);

	const snapshot = await getDocs(q);
	const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Message[];

	// Filter messages by search query
	const lowerQuery = searchQuery.toLowerCase();
	return messages.filter(
		(msg) =>
			msg.content.toLowerCase().includes(lowerQuery) ||
			msg.senderName.toLowerCase().includes(lowerQuery)
	);
}

// Get messages by sender
export async function getMessagesBySender(
	groupId: string,
	channelId: string,
	senderId: string
): Promise<Message[]> {
	const messagesRef = collection(db, `groups/${groupId}/channels/${channelId}/messages`);
	const q = query(
		messagesRef,
		where("senderId", "==", senderId),
		where("deleted", "==", false),
		orderBy("createdAt", "desc")
	);

	const snapshot = await getDocs(q);
	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Message[];
}

// Get messages with mentions for a user
export async function getMentionedMessages(
	groupId: string,
	channelId: string,
	userId: string
): Promise<Message[]> {
	const messagesRef = collection(db, `groups/${groupId}/channels/${channelId}/messages`);
	const q = query(
		messagesRef,
		where("mentions", "array-contains", userId),
		where("deleted", "==", false),
		orderBy("createdAt", "desc")
	);

	const snapshot = await getDocs(q);
	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Message[];
}

// Pin a message to channel
export async function pinMessage(
	groupId: string,
	channelId: string,
	messageId: string
): Promise<void> {
	const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
	const channelSnap = await getDoc(channelRef);

	if (channelSnap.exists()) {
		const channel = channelSnap.data();
		const pinnedMessages = channel.pinnedMessageIds || [];

		// Limit to 50 pinned messages
		if (pinnedMessages.length >= 50) {
			throw new Error("Channel has reached maximum of 50 pinned messages");
		}

		await updateDoc(channelRef, {
			pinnedMessageIds: arrayUnion(messageId),
		});
	}
}

// Unpin a message from channel
export async function unpinMessage(
	groupId: string,
	channelId: string,
	messageId: string
): Promise<void> {
	const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
	await updateDoc(channelRef, {
		pinnedMessageIds: arrayRemove(messageId),
	});
}

// Get pinned messages
export async function getPinnedMessages(
	groupId: string,
	channelId: string
): Promise<Message[]> {
	const channelRef = doc(db, `groups/${groupId}/channels`, channelId);
	const channelSnap = await getDoc(channelRef);

	if (!channelSnap.exists()) return [];

	const channel = channelSnap.data();
	const pinnedMessageIds = channel.pinnedMessageIds || [];

	if (pinnedMessageIds.length === 0) return [];

	// Fetch all pinned messages
	const messages: Message[] = [];
	for (const messageId of pinnedMessageIds) {
		const messageRef = doc(db, `groups/${groupId}/channels/${channelId}/messages`, messageId);
		const messageSnap = await getDoc(messageRef);
		if (messageSnap.exists()) {
			messages.push({ id: messageSnap.id, ...messageSnap.data() } as Message);
		}
	}

	return messages;
}