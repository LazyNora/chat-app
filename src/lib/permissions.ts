import type { RolePermissions } from "@/types";

// Default permissions for @everyone role
export const DEFAULT_EVERYONE_PERMISSIONS: RolePermissions = {
	manageGroup: false,
	manageRoles: false,
	manageChannels: false,
	kickMembers: false,
	banMembers: false,
	viewChannels: true,
	sendMessages: true,
	sendMediaFiles: true,
	mentionEveryone: false,
	manageMessages: false,
	readMessageHistory: true,
	voiceConnect: true,
	voiceSpeak: true,
	voiceMuteMembers: false,
	videoCall: true,
	screenShare: true,
};

// Admin/Owner permissions (all enabled)
export const ADMIN_PERMISSIONS: RolePermissions = {
	manageGroup: true,
	manageRoles: true,
	manageChannels: true,
	kickMembers: true,
	banMembers: true,
	viewChannels: true,
	sendMessages: true,
	sendMediaFiles: true,
	mentionEveryone: true,
	manageMessages: true,
	readMessageHistory: true,
	voiceConnect: true,
	voiceSpeak: true,
	voiceMuteMembers: true,
	videoCall: true,
	screenShare: true,
};

// Moderator permissions
export const MODERATOR_PERMISSIONS: RolePermissions = {
	manageGroup: false,
	manageRoles: false,
	manageChannels: false,
	kickMembers: true,
	banMembers: false,
	viewChannels: true,
	sendMessages: true,
	sendMediaFiles: true,
	mentionEveryone: true,
	manageMessages: true,
	readMessageHistory: true,
	voiceConnect: true,
	voiceSpeak: true,
	voiceMuteMembers: true,
	videoCall: true,
	screenShare: true,
};

// Compute user permissions from roles
export function computePermissions(
	roles: Array<{ permissions: RolePermissions; position: number }>
): string[] {
	if (roles.length === 0) return [];

	// Sort roles by position (higher position = more priority)
	const sortedRoles = [...roles].sort((a, b) => b.position - a.position);

	// Start with no permissions
	const computedPermissions: Record<string, boolean> = {};

	// Apply permissions from each role (higher position roles override lower ones)
	sortedRoles.forEach((role) => {
		Object.entries(role.permissions).forEach(([key, value]) => {
			if (computedPermissions[key] === undefined || role.position > 0) {
				computedPermissions[key] = value;
			}
		});
	});

	// Return array of permission names that are true
	return (
		Object.entries(computedPermissions)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.filter(([_, value]) => value)
			.map(([key]) => key)
	);
}

// Check if user has a specific permission
export function hasPermission(permissions: string[], permission: string): boolean {
	return permissions.includes(permission);
}

// Check if user has any of the specified permissions
export function hasAnyPermission(permissions: string[], requiredPermissions: string[]): boolean {
	return requiredPermissions.some((perm) => permissions.includes(perm));
}

// Check if user has all of the specified permissions
export function hasAllPermissions(permissions: string[], requiredPermissions: string[]): boolean {
	return requiredPermissions.every((perm) => permissions.includes(perm));
}

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<keyof RolePermissions, string> = {
	manageGroup: "Manage server settings and information",
	manageRoles: "Create, edit, and delete roles",
	manageChannels: "Create, edit, and delete channels",
	kickMembers: "Remove members from the server",
	banMembers: "Ban members from the server",
	viewChannels: "View text and voice channels",
	sendMessages: "Send messages in text channels",
	sendMediaFiles: "Upload files and media",
	mentionEveryone: "Mention @everyone in messages",
	manageMessages: "Delete and pin messages from others",
	readMessageHistory: "Read previous messages",
	voiceConnect: "Connect to voice channels",
	voiceSpeak: "Speak in voice channels",
	voiceMuteMembers: "Mute members in voice channels",
	videoCall: "Use video in voice channels",
	screenShare: "Share screen in voice channels",
};
