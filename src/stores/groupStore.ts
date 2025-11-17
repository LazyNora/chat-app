import { create } from "zustand";
import type { Group, Channel, GroupMember, Role } from "@/types";

interface GroupState {
	selectedGroupId: string | null;
	selectedChannelId: string | null;
	groups: Group[];
	channels: Channel[];
	members: GroupMember[];
	roles: Role[];
	setSelectedGroup: (groupId: string | null) => void;
	setSelectedChannel: (channelId: string | null) => void;
	setGroups: (groups: Group[]) => void;
	setChannels: (channels: Channel[]) => void;
	setMembers: (members: GroupMember[]) => void;
	setRoles: (roles: Role[]) => void;
	addGroup: (group: Group) => void;
	removeGroup: (groupId: string) => void;
	updateGroup: (groupId: string, updates: Partial<Group>) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
	selectedGroupId: null,
	selectedChannelId: null,
	groups: [],
	channels: [],
	members: [],
	roles: [],
	setSelectedGroup: (groupId) => set({ selectedGroupId: groupId, selectedChannelId: null }),
	setSelectedChannel: (channelId) => set({ selectedChannelId: channelId }),
	setGroups: (groups) => set({ groups }),
	setChannels: (channels) => set({ channels }),
	setMembers: (members) => set({ members }),
	setRoles: (roles) => set({ roles }),
	addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),
	removeGroup: (groupId) =>
		set((state) => ({
			groups: state.groups.filter((g) => g.id !== groupId),
			selectedGroupId: state.selectedGroupId === groupId ? null : state.selectedGroupId,
		})),
	updateGroup: (groupId, updates) =>
		set((state) => ({
			groups: state.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
		})),
}));
