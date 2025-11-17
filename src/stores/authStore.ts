import { create } from "zustand";
import { type User as FirebaseUser } from "firebase/auth";
import { type User } from "@/types";

interface AuthState {
	user: FirebaseUser | null;
	userProfile: User | null;
	loading: boolean;
	setUser: (user: FirebaseUser | null) => void;
	setUserProfile: (profile: User | null) => void;
	setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	userProfile: null,
	loading: true,
	setUser: (user) => set({ user }),
	setUserProfile: (profile) => set({ userProfile: profile }),
	setLoading: (loading) => set({ loading }),
}));
