import {
	collection,
	doc,
	setDoc,
	getDoc,
	getDocs,
	query,
	orderBy,
	limit,
	serverTimestamp,
	Timestamp,
	updateDoc,
	onSnapshot,
	arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import type { Message, MessageFile } from "@/types";

// Send a direct message
export async function sendDirectMessage(
	conversationId: string,
	senderId: string,
	senderName: string,
	senderPhotoURL: string | null,
	content: string,
	files: MessageFile[] | null = null,
	gifURL: string | null = null,
	audioURL: string | null = null,
	audioDuration: number | null = null
): Promise<string> {
	const messageRef = doc(collection(db, `directMessages/${conversationId}/messages`));
	const messageId = messageRef.id;

	// Determine message type
	let messageType: "text" | "file" | "gif" | "sticker" | "system" | "voice" = "text";
	if (audioURL) {
		messageType = "voice";
	} else if (gifURL) {
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
		audioURL,
		audioDuration,
		mentions: [],
		mentionsEveryone: false,
		reactions: {},
		replyTo: null,
		threadId: null,
		edited: false,
		editedAt: null,
		deleted: false,
		deletedAt: null,
		createdAt: serverTimestamp(),
		moderationStatus: null,
	};

	await setDoc(messageRef, messageData);

	// Update conversation last message
	const conversationRef = doc(db, "directMessages", conversationId);
	await updateDoc(conversationRef, {
		lastMessage: content || files?.[0]?.name || "Sent an attachment" || "Sent a GIF" || "Sent a voice message",
		lastMessageAt: serverTimestamp(),
	});

	return messageId;
}

// Get direct messages
export async function getDirectMessages(
	conversationId: string,
	limitCount: number = 50
): Promise<Message[]> {
	const messagesRef = collection(db, `directMessages/${conversationId}/messages`);
	const q = query(messagesRef, orderBy("createdAt", "desc"), limit(limitCount));

	const snapshot = await getDocs(q);
	const messages = snapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data(),
	})) as Message[];

	return messages.reverse(); // Reverse to show oldest first
}

// Subscribe to direct messages (real-time)
export function subscribeToDirectMessages(
	conversationId: string,
	callback: (messages: Message[]) => void
): () => void {
	const messagesRef = collection(db, `directMessages/${conversationId}/messages`);
	const q = query(messagesRef, orderBy("createdAt", "desc"), limit(50));

	const unsubscribe = onSnapshot(q, (snapshot) => {
		const messages = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as Message[];
		callback(messages.reverse()); // Reverse to show oldest first
	});

	return unsubscribe;
}

// Upload file for direct message
export async function uploadDMFile(
	conversationId: string,
	file: File
): Promise<MessageFile> {
	const timestamp = Date.now();
	const fileName = `${timestamp}_${file.name}`;
	const filePath = `directMessages/${conversationId}/files/${fileName}`;
	const fileRef = ref(storage, filePath);

	await uploadBytes(fileRef, file);
	const downloadURL = await getDownloadURL(fileRef);

	// Generate thumbnail for images
	let thumbnailURL: string | null = null;
	if (file.type.startsWith("image/")) {
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

// Upload audio file for direct message
export async function uploadDMAudioFile(
	conversationId: string,
	file: File
): Promise<{ name: string; url: string; type: string; size: number }> {
	const timestamp = Date.now();
	const fileName = `${timestamp}_${file.name}`;
	const filePath = `directMessages/${conversationId}/audio/${fileName}`;
	const fileRef = ref(storage, filePath);

	await uploadBytes(fileRef, file);
	const downloadURL = await getDownloadURL(fileRef);

	return {
		name: file.name,
		url: downloadURL,
		type: file.type,
		size: file.size,
	};
}

// Add reaction to DM message
export async function addDMReaction(
	conversationId: string,
	messageId: string,
	emoji: string,
	userId: string
): Promise<void> {
	const messageRef = doc(db, `directMessages/${conversationId}/messages`, messageId);
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

// Remove reaction from DM message
export async function removeDMReaction(
	conversationId: string,
	messageId: string,
	emoji: string,
	userId: string
): Promise<void> {
	const messageRef = doc(db, `directMessages/${conversationId}/messages`, messageId);
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

// Edit a DM message
export async function editDMMessage(
	conversationId: string,
	messageId: string,
	newContent: string
): Promise<void> {
	const messageRef = doc(db, `directMessages/${conversationId}/messages`, messageId);
	await updateDoc(messageRef, {
		content: newContent,
		edited: true,
		editedAt: serverTimestamp(),
	});
}

