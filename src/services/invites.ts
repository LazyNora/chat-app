import {
	collection,
	doc,
	setDoc,
	getDoc,
	getDocs,
	query,
	where,
	deleteDoc,
	serverTimestamp,
	Timestamp,
	increment,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Invite } from "@/types";
import { addMemberToGroup } from "./groups";

// Generate a random invite code
function generateInviteCode(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let code = "";
	for (let i = 0; i < 8; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

// Create an invite
export async function createInvite(
	groupId: string,
	creatorId: string,
	maxUses?: number,
	expiresInHours?: number
): Promise<string> {
	let code = generateInviteCode();
	let inviteRef = doc(db, `groups/${groupId}/invites`, code);
	let inviteSnap = await getDoc(inviteRef);

	// Ensure unique code
	while (inviteSnap.exists()) {
		code = generateInviteCode();
		inviteRef = doc(db, `groups/${groupId}/invites`, code);
		inviteSnap = await getDoc(inviteRef);
	}

	const inviteData: Omit<Invite, "createdAt" | "expiresAt"> & {
		createdAt: ReturnType<typeof serverTimestamp>;
		expiresAt: Timestamp | null;
	} = {
		code,
		creatorId,
		maxUses: maxUses || null,
		usedCount: 0,
		expiresAt: expiresInHours
			? Timestamp.fromDate(new Date(Date.now() + expiresInHours * 60 * 60 * 1000))
			: null,
		createdAt: serverTimestamp(),
	};

	await setDoc(inviteRef, inviteData);

	return code;
}

// Get invite by code
export async function getInvite(groupId: string, code: string): Promise<Invite | null> {
	const inviteRef = doc(db, `groups/${groupId}/invites`, code);
	const inviteSnap = await getDoc(inviteRef);

	if (inviteSnap.exists()) {
		return inviteSnap.data() as Invite;
	}

	return null;
}

// Find invite across all groups
export async function findInvite(
	code: string
): Promise<{ groupId: string; invite: Invite } | null> {
	// This is inefficient - in production, you might want to have a top-level invites collection
	// For now, we'll return null and require the groupId
	return null;
}

// Find invite by code (searches all groups)
export async function findInviteByCode(
	code: string
): Promise<{ groupId: string; invite: Invite } | null> {
	// Get all groups
	const groupsRef = collection(db, "groups");
	const groupsSnap = await getDocs(groupsRef);

	// Search through each group's invites
	for (const groupDoc of groupsSnap.docs) {
		const groupId = groupDoc.id;
		const inviteRef = doc(db, `groups/${groupId}/invites`, code);
		const inviteSnap = await getDoc(inviteRef);

		if (inviteSnap.exists()) {
			const invite = inviteSnap.data() as Invite;
			// Check if expired
			if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) {
				continue;
			}
			// Check if max uses reached
			if (invite.maxUses && invite.usedCount >= invite.maxUses) {
				continue;
			}
			return { groupId, invite };
		}
	}

	return null;
}

// Use an invite (join group)
export async function useInvite(
	groupId: string,
	code: string,
	userId: string,
	userName: string,
	userPhoto: string | null
): Promise<{ success: boolean; error?: string }> {
	const inviteRef = doc(db, `groups/${groupId}/invites`, code);
	const inviteSnap = await getDoc(inviteRef);

	if (!inviteSnap.exists()) {
		return { success: false, error: "Invalid invite code" };
	}

	const invite = inviteSnap.data() as Invite;

	// Check if expired
	if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) {
		return { success: false, error: "Invite has expired" };
	}

	// Check if max uses reached
	if (invite.maxUses && invite.usedCount >= invite.maxUses) {
		return { success: false, error: "Invite has reached maximum uses" };
	}

	// Check if user is already a member
	const memberRef = doc(db, `groups/${groupId}/members`, userId);
	const memberSnap = await getDoc(memberRef);

	if (memberSnap.exists()) {
		return { success: false, error: "You are already a member of this group" };
	}

	// Add user to group
	await addMemberToGroup(groupId, userId, userName, userPhoto);

	// Increment used count
	await setDoc(
		inviteRef,
		{
			usedCount: increment(1),
		},
		{ merge: true }
	);

	return { success: true };
}

// Get all invites for a group
export async function getGroupInvites(groupId: string): Promise<Invite[]> {
	const invitesRef = collection(db, `groups/${groupId}/invites`);
	const invitesSnap = await getDocs(invitesRef);

	return invitesSnap.docs.map((doc) => doc.data() as Invite);
}

// Delete an invite
export async function deleteInvite(groupId: string, code: string): Promise<void> {
	const inviteRef = doc(db, `groups/${groupId}/invites`, code);
	await deleteDoc(inviteRef);
}

// Delete expired invites
export async function deleteExpiredInvites(groupId: string): Promise<number> {
	const invitesRef = collection(db, `groups/${groupId}/invites`);
	const invitesSnap = await getDocs(invitesRef);

	let deletedCount = 0;
	const now = Date.now();

	const deletePromises = invitesSnap.docs
		.filter((doc) => {
			const invite = doc.data() as Invite;
			return invite.expiresAt && invite.expiresAt.toMillis() < now;
		})
		.map((doc) => {
			deletedCount++;
			return deleteDoc(doc.ref);
		});

	await Promise.all(deletePromises);

	return deletedCount;
}
