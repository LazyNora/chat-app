import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useGroupMembers } from "./useFirestore";
import type { GroupMember } from "@/types";

export function usePermissions(groupId: string | null) {
	const { user } = useAuthStore();
	const { data: members } = useGroupMembers(groupId);

	const userPermissions = useMemo(() => {
		if (!user || !groupId || !members || members.length === 0) {
			return [];
		}

		const member = members.find((m: GroupMember) => m.userId === user.uid);
		return member?.permissions || [];
	}, [user, groupId, members]);

	const hasPermission = useCallback(
		(permission: string): boolean => {
			return userPermissions.includes(permission);
		},
		[userPermissions]
	);

	const hasAnyPermission = useCallback(
		(permissions: string[]): boolean => {
			return permissions.some((p) => userPermissions.includes(p));
		},
		[userPermissions]
	);

	const hasAllPermissions = useCallback(
		(permissions: string[]): boolean => {
			return permissions.every((p) => userPermissions.includes(p));
		},
		[userPermissions]
	);

	const isOwner = useMemo(() => {
		if (!user || !members || members.length === 0) return false;

		// Check if user has all admin permissions (a simple owner check)
		return hasPermission("manageGroup") && hasPermission("manageRoles");
	}, [user, members, hasPermission]);

	return {
		permissions: userPermissions,
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
		isOwner,
	};
}
