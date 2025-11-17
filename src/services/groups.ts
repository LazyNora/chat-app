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
	writeBatch,
	Timestamp,
	increment,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Group, GroupMember, Role, GroupSettings } from "@/types";
import {
	DEFAULT_EVERYONE_PERMISSIONS,
	ADMIN_PERMISSIONS,
	computePermissions,
} from "@/lib/permissions";

// Create a new group
export async function createGroup(
	name: string,
	ownerId: string,
	ownerName: string,
	ownerPhoto: string | null,
	description?: string,
	iconURL?: string
): Promise<string> {
	const groupRef = doc(collection(db, "groups"));
	const groupId = groupRef.id;

	const batch = writeBatch(db);

	// Default group settings
	const defaultSettings: GroupSettings = {
		defaultCooldown: 0,
		maxFileSize: 50 * 1024 * 1024, // 50MB
		contentFilter: "medium",
		inviteQREnabled: true,
	};

	// Create group document
	const groupData: Omit<Group, "id" | "createdAt"> & {
		createdAt: ReturnType<typeof serverTimestamp>;
	} = {
		name,
		description: description || null,
		iconURL: iconURL || null,
		ownerId,
		settings: defaultSettings,
		memberCount: 1,
		createdAt: serverTimestamp(),
	};

	batch.set(groupRef, groupData);

	// Create @everyone role
	const everyoneRoleRef = doc(collection(db, `groups/${groupId}/roles`));
	const everyoneRole = {
		name: "@everyone",
		color: "#99AAB5",
		position: 0,
		permissions: DEFAULT_EVERYONE_PERMISSIONS,
		createdAt: serverTimestamp(),
	};
	batch.set(everyoneRoleRef, everyoneRole);

	// Create owner/admin role
	const adminRoleRef = doc(collection(db, `groups/${groupId}/roles`));
	const adminRole = {
		name: "Admin",
		color: "#E91E63",
		position: 100,
		permissions: ADMIN_PERMISSIONS,
		createdAt: serverTimestamp(),
	};
	batch.set(adminRoleRef, adminRole);

	// Add owner as member
	const memberRef = doc(db, `groups/${groupId}/members`, ownerId);
	const memberData: Omit<GroupMember, "joinedAt"> & {
		joinedAt: ReturnType<typeof serverTimestamp>;
	} = {
		userId: ownerId,
		displayName: ownerName,
		photoURL: ownerPhoto,
		roles: [everyoneRoleRef.id, adminRoleRef.id],
		permissions: Object.keys(ADMIN_PERMISSIONS),
		joinedAt: serverTimestamp(),
	};
	batch.set(memberRef, memberData);

	// Create general text channel
	const textChannelRef = doc(collection(db, `groups/${groupId}/channels`));
	batch.set(textChannelRef, {
		name: "general",
		type: "text",
		description: "General discussion",
		position: 0,
		categoryId: null,
		permissions: {},
		settings: {
			cooldown: null,
			maxFileSize: null,
		},
		pinnedMessageIds: [],
		liveKitRoomName: null,
		createdAt: serverTimestamp(),
		lastMessageAt: null,
	});

	// Create general voice channel
	const voiceChannelRef = doc(collection(db, `groups/${groupId}/channels`));
	batch.set(voiceChannelRef, {
		name: "General Voice",
		type: "voice",
		description: "General voice chat",
		position: 1,
		categoryId: null,
		permissions: {},
		settings: {
			cooldown: null,
			maxFileSize: null,
		},
		pinnedMessageIds: [],
		liveKitRoomName: `group-${groupId}-channel-${voiceChannelRef.id}`,
		createdAt: serverTimestamp(),
		lastMessageAt: null,
	});

	await batch.commit();

	return groupId;
}

// Get group by ID
export async function getGroup(groupId: string): Promise<Group | null> {
	const groupRef = doc(db, "groups", groupId);
	const groupSnap = await getDoc(groupRef);

	if (groupSnap.exists()) {
		return { id: groupSnap.id, ...groupSnap.data() } as Group;
	}

	return null;
}

// Get groups where user is a member
export async function getUserGroups(userId: string): Promise<Group[]> {
	const groups: Group[] = [];

	// Query all groups where user is a member (we need to check subcollection)
	// This is inefficient - in production, you might want to denormalize this
	const groupsRef = collection(db, "groups");
	const groupsSnap = await getDocs(groupsRef);

	for (const groupDoc of groupsSnap.docs) {
		const memberRef = doc(db, `groups/${groupDoc.id}/members`, userId);
		const memberSnap = await getDoc(memberRef);

		if (memberSnap.exists()) {
			groups.push({ id: groupDoc.id, ...groupDoc.data() } as Group);
		}
	}

	return groups;
}

// Add member to group
export async function addMemberToGroup(
	groupId: string,
	userId: string,
	userName: string,
	userPhoto: string | null
): Promise<void> {
	const memberRef = doc(db, `groups/${groupId}/members`, userId);

	// Get @everyone role
	const rolesSnap = await getDocs(
		query(collection(db, `groups/${groupId}/roles`), where("name", "==", "@everyone"))
	);

	const everyoneRoleId = rolesSnap.docs[0]?.id || "";

	const memberData: Omit<GroupMember, "joinedAt"> & {
		joinedAt: ReturnType<typeof serverTimestamp>;
	} = {
		userId,
		displayName: userName,
		photoURL: userPhoto,
		roles: [everyoneRoleId],
		permissions: Object.keys(DEFAULT_EVERYONE_PERMISSIONS).filter(
			(key) => DEFAULT_EVERYONE_PERMISSIONS[key as keyof typeof DEFAULT_EVERYONE_PERMISSIONS]
		),
		joinedAt: serverTimestamp(),
	};

	const batch = writeBatch(db);
	batch.set(memberRef, memberData);

	// Increment member count
	const groupRef = doc(db, "groups", groupId);
	batch.update(groupRef, { memberCount: increment(1) });

	await batch.commit();
}

// Remove member from group
export async function removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
	const memberRef = doc(db, `groups/${groupId}/members`, userId);

	const batch = writeBatch(db);
	batch.delete(memberRef);

	// Decrement member count
	const groupRef = doc(db, "groups", groupId);
	batch.update(groupRef, { memberCount: increment(-1) });

	await batch.commit();
}

// Get group members
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
	const membersRef = collection(db, `groups/${groupId}/members`);
	const membersSnap = await getDocs(membersRef);

	return membersSnap.docs.map((doc) => doc.data() as GroupMember);
}

// Get group roles
export async function getGroupRoles(groupId: string): Promise<Role[]> {
	const rolesRef = collection(db, `groups/${groupId}/roles`);
	const rolesSnap = await getDocs(rolesRef);

	return rolesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Role));
}

// Create role
export async function createRole(
	groupId: string,
	name: string,
	color: string,
	permissions: Partial<typeof ADMIN_PERMISSIONS>
): Promise<string> {
	const roleRef = doc(collection(db, `groups/${groupId}/roles`));

	const roleData = {
		name,
		color,
		position: 50, // Default middle position
		permissions: { ...DEFAULT_EVERYONE_PERMISSIONS, ...permissions },
		createdAt: serverTimestamp(),
	};

	await setDoc(roleRef, roleData);

	return roleRef.id;
}

// Update role
export async function updateRole(
	groupId: string,
	roleId: string,
	updates: Partial<Omit<Role, "id" | "createdAt">>
): Promise<void> {
	const roleRef = doc(db, `groups/${groupId}/roles`, roleId);
	await setDoc(roleRef, updates, { merge: true });
}

// Delete role
export async function deleteRole(groupId: string, roleId: string): Promise<void> {
	const roleRef = doc(db, `groups/${groupId}/roles`, roleId);

	// Remove role from all members
	const membersRef = collection(db, `groups/${groupId}/members`);
	const membersSnap = await getDocs(membersRef);

	const batch = writeBatch(db);

	membersSnap.docs.forEach((memberDoc) => {
		const member = memberDoc.data() as GroupMember;
		if (member.roles.includes(roleId)) {
			const updatedRoles = member.roles.filter((r) => r !== roleId);
			batch.update(memberDoc.ref, { roles: updatedRoles });
		}
	});

	batch.delete(roleRef);

	await batch.commit();
}

// Assign role to member
export async function assignRoleToMember(
	groupId: string,
	userId: string,
	roleId: string
): Promise<void> {
	const memberRef = doc(db, `groups/${groupId}/members`, userId);
	const memberSnap = await getDoc(memberRef);

	if (memberSnap.exists()) {
		const member = memberSnap.data() as GroupMember;
		if (!member.roles.includes(roleId)) {
			const updatedRoles = [...member.roles, roleId];

			// Recompute permissions
			const roles = await getGroupRoles(groupId);
			const memberRoles = roles.filter((r) => updatedRoles.includes(r.id));
			const permissions = computePermissions(memberRoles);

			await setDoc(
				memberRef,
				{
					roles: updatedRoles,
					permissions,
				},
				{ merge: true }
			);
		}
	}
}

// Remove role from member
export async function removeRoleFromMember(
	groupId: string,
	userId: string,
	roleId: string
): Promise<void> {
	const memberRef = doc(db, `groups/${groupId}/members`, userId);
	const memberSnap = await getDoc(memberRef);

	if (memberSnap.exists()) {
		const member = memberSnap.data() as GroupMember;
		const updatedRoles = member.roles.filter((r) => r !== roleId);

		// Recompute permissions
		const roles = await getGroupRoles(groupId);
		const memberRoles = roles.filter((r) => updatedRoles.includes(r.id));
		const permissions = computePermissions(memberRoles);

		await setDoc(
			memberRef,
			{
				roles: updatedRoles,
				permissions,
			},
			{ merge: true }
		);
	}
}
