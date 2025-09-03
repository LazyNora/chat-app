"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { type User } from "firebase/auth";
import { onAuthStateChanged } from "@/lib/firebase/auth";
import { getUserDataByID } from "@/actions/user-actions";
import axios from "axios";
import { db } from "@/lib/firebase/firebase";
import { FirestoreOrmRepository } from "@arbel/firebase-orm";

interface UserData {
	id: string;
	uid: string;
	email: string;
	name: string;
	profilePic: string;
}

interface AuthUserContextType {
	userData: UserData | null;
	loading: boolean;
}

const authUserContext = createContext<AuthUserContextType>({
	userData: null,
	loading: true,
});

export default function useFirebaseAuth() {
	const [userUid, setUserUid] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

	const authStateChanged = async (authUser: User | null) => {
		if (!authUser) {
			setLoading(false);
			return;
		}

		setLoading(true);

		await fetch("/api/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				uid: authUser.uid,
				name: authUser.displayName || "",
				email: authUser.email,
				profilePic: authUser.photoURL || "",
			}),
		});

		setUserUid(authUser.uid);
		setLoading(false);
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(authStateChanged);
		return () => unsubscribe();
	}, []);

	return { userUid, loading };
}

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
	const auth = useFirebaseAuth();
	const [userData, setUserData] = useState<UserData | null>(null);

	// Get user data from Firestore
	useEffect(() => {
		const fetchUserData = async () => {
			if (auth.userUid) {
				const userData = await getUserDataByID(auth.userUid);
				setUserData(userData.data || null);
			}
		};

		fetchUserData();
	}, [auth.userUid]);

	return (
		<authUserContext.Provider value={{ userData, loading: auth.loading }}>
			{children}
		</authUserContext.Provider>
	);
}

export const useAuth = () => useContext(authUserContext);
