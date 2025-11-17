import {
	collection,
	doc,
	setDoc,
	getDoc,
	getDocs,
	query,
	where,
	serverTimestamp,
	updateDoc,
	deleteDoc,
	Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Friendship, DirectMessageConversation } from "@/types";

// Create friendship ID from two user IDs
function getFriendshipId(userId1: string, userId2: string): string {
	return [userId1, userId2].sort().join("_");
}

// Send friend request
export async function sendFriendRequest(requesterId: string, recipientId: string): Promise<void> {
	const friendshipId = getFriendshipId(requesterId, recipientId);
	const friendshipRef = doc(db, "friends", friendshipId);

	const friendshipData = {
		userIds: [requesterId, recipientId].sort(),
		status: "pending",
		requesterId,
		createdAt: serverTimestamp(),
		acceptedAt: null,
	};

	await setDoc(friendshipRef, friendshipData);
}

// Accept friend request
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
	const friendshipRef = doc(db, "friends", friendshipId);

	await updateDoc(friendshipRef, {
		status: "accepted",
		acceptedAt: serverTimestamp(),
	});
}

// Reject/Remove friend
export async function removeFriend(friendshipId: string): Promise<void> {
	const friendshipRef = doc(db, "friends", friendshipId);
	await deleteDoc(friendshipRef);
}

// Block user
export async function blockUser(userId: string, blockedUserId: string): Promise<void> {
	const friendshipId = getFriendshipId(userId, blockedUserId);
	const friendshipRef = doc(db, "friends", friendshipId);

	await setDoc(friendshipRef, {
		userIds: [userId, blockedUserId].sort(),
		status: "blocked",
		requesterId: userId,
		createdAt: serverTimestamp(),
		acceptedAt: null,
	});
}

// Get user's friends
export async function getUserFriends(userId: string): Promise<Friendship[]> {
	const friendsRef = collection(db, "friends");
	const q = query(
		friendsRef,
		where("userIds", "array-contains", userId),
		where("status", "==", "accepted")
	);

	const snapshot = await getDocs(q);
	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Friendship[];
}

// Get pending friend requests
export async function getPendingRequests(userId: string): Promise<Friendship[]> {
	const friendsRef = collection(db, "friends");
	const q = query(
		friendsRef,
		where("userIds", "array-contains", userId),
		where("status", "==", "pending")
	);

	const snapshot = await getDocs(q);
	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Friendship[];
}

// Create or get DM conversation
export async function getOrCreateDMConversation(
	userId1: string,
	user1Name: string,
	user1Photo: string | null,
	userId2: string,
	user2Name: string,
	user2Photo: string | null
): Promise<string> {
	const conversationId = getFriendshipId(userId1, userId2);
	const conversationRef = doc(db, "directMessages", conversationId);
	const conversationSnap = await getDoc(conversationRef);

	if (!conversationSnap.exists()) {
		const conversationData = {
			participantIds: [userId1, userId2].sort(),
			participantData: {
				[userId1]: { displayName: user1Name, photoURL: user1Photo },
				[userId2]: { displayName: user2Name, photoURL: user2Photo },
			},
			lastMessageAt: serverTimestamp(),
			lastMessage: null,
			unreadCount: {
				[userId1]: 0,
				[userId2]: 0,
			},
			createdAt: serverTimestamp(),
		};

		await setDoc(conversationRef, conversationData);
	}

	return conversationId;
}

// Get user's DM conversations
export async function getUserDMConversations(userId: string): Promise<DirectMessageConversation[]> {
	const dmsRef = collection(db, "directMessages");
	const q = query(dmsRef, where("participantIds", "array-contains", userId));

	const snapshot = await getDocs(q);
	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as DirectMessageConversation[];
}
