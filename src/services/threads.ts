import {
	collection,
	doc,
	setDoc,
	getDocs,
	query,
	where,
	orderBy,
	serverTimestamp,
	increment,
	updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Thread, Message } from "@/types";
import { sendMessage } from "./messages";

// Create a thread
export async function createThread(
	groupId: string,
	channelId: string,
	parentMessageId: string,
	name: string,
	creatorId: string
): Promise<string> {
	const threadRef = doc(collection(db, `groups/${groupId}/channels/${channelId}/threads`));
	const threadId = threadRef.id;

	const threadData = {
		name,
		creatorId,
		parentMessageId,
		messageCount: 0,
		lastMessageAt: serverTimestamp(),
		archived: false,
		createdAt: serverTimestamp(),
	};

	await setDoc(threadRef, threadData);

	// Update parent message with threadId
	const messageRef = doc(db, `groups/${groupId}/channels/${channelId}/messages`, parentMessageId);
	await updateDoc(messageRef, { threadId });

	return threadId;
}

// Send message in thread
export async function sendThreadMessage(
	groupId: string,
	channelId: string,
	threadId: string,
	senderId: string,
	senderName: string,
	senderPhotoURL: string | null,
	content: string
): Promise<string> {
	const messageRef = doc(
		collection(db, `groups/${groupId}/channels/${channelId}/threads/${threadId}/messages`)
	);

	const messageData = {
		content,
		senderId,
		senderName,
		senderPhotoURL,
		type: "text",
		files: null,
		gifURL: null,
		stickerURL: null,
		mentions: [],
		mentionsEveryone: false,
		reactions: {},
		replyTo: null,
		threadId,
		edited: false,
		editedAt: null,
		deleted: false,
		deletedAt: null,
		createdAt: serverTimestamp(),
		moderationStatus: null,
	};

	await setDoc(messageRef, messageData);

	// Update thread stats
	const threadRef = doc(db, `groups/${groupId}/channels/${channelId}/threads`, threadId);
	await updateDoc(threadRef, {
		messageCount: increment(1),
		lastMessageAt: serverTimestamp(),
	});

	return messageRef.id;
}

// Get threads for a channel
export async function getChannelThreads(groupId: string, channelId: string): Promise<Thread[]> {
	const threadsRef = collection(db, `groups/${groupId}/channels/${channelId}/threads`);
	const q = query(threadsRef, where("archived", "==", false), orderBy("lastMessageAt", "desc"));

	const snapshot = await getDocs(q);
	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Thread[];
}

// Archive/unarchive thread
export async function toggleThreadArchive(
	groupId: string,
	channelId: string,
	threadId: string,
	archived: boolean
): Promise<void> {
	const threadRef = doc(db, `groups/${groupId}/channels/${channelId}/threads`, threadId);
	await updateDoc(threadRef, { archived });
}
