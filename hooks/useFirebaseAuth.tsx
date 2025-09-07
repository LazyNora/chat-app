"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { type User } from "firebase/auth";
import { onAuthStateChanged } from "@/lib/firebase/auth";
import { Profile } from "@/models/models";
import axios from "axios";
import { db } from "@/lib/firebase/firebase";
import { FirestoreOrmRepository } from "@arbel/firebase-orm";

interface AuthUserContextType {
	userProfile: Profile | null;
	loading: boolean;
}

const authUserContext = createContext<AuthUserContextType>({
	userProfile: null,
	loading: true,
});

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
	const [userProfile, setUserProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

	const initialProfile = async (user: User) => {
		FirestoreOrmRepository.initGlobalConnection(db);
		await FirestoreOrmRepository.ready();

		const profile = await Profile.findOne("userId", "==", user.uid);
		if (profile) {
			return {
				profile,
			};
		}

		const newProfile = new Profile();
		newProfile.userId = user.uid;
		newProfile.name = user.displayName || "";
		newProfile.email = user.email || "";
		newProfile.imageUrl = user.photoURL || "";
		newProfile.createdAt = new Date().toISOString();
		newProfile.updatedAt = new Date().toISOString();

		await newProfile.save(user.uid);

		return {
			profile: newProfile,
		};
	};

	const authStateChanged = async (authUser: User | null) => {
		if (!authUser) {
			setLoading(false);
			return;
		}

		setLoading(true);
		// const result = await initialProfile(authUser);
		// setUserProfile(result.profile);
		console.log(await axios.post("/api/auth/login", { uid: authUser.uid }));
		setLoading(false);
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(authStateChanged);
		return () => unsubscribe();
	}, []);

	return (
		<authUserContext.Provider value={{ userProfile, loading }}>{children}</authUserContext.Provider>
	);
}

export const useAuth = () => useContext(authUserContext);
