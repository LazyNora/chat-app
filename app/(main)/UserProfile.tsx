"use client";

import { useAuth } from "@/lib/firebase/AuthContext";
import { useLoadingCallback } from "react-loading-hook";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/firebase";
import { signOut } from "firebase/auth";
import { checkEmailVerification, logout } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";

export default function UserProfile() {
	const router = useRouter();
	const { user } = useAuth();
	const [hasLoggedOut, setHasLoggedOut] = useState(false);
	const [handleLogout, isLogoutLoading] = useLoadingCallback(async () => {
		const auth = getFirebaseAuth();
		await signOut(auth);
		await logout();

		router.refresh();
		setHasLoggedOut(true);
	});

	const [handleReCheck, isReCheckLoading] = useLoadingCallback(async () => {
		await checkEmailVerification();
		router.refresh();
	});

	if (!user) {
		return null;
	}

	return (
		<div>
			{user.photoURL && (
				<img src={user.photoURL} alt="User Avatar" className="w-24 h-24 rounded-full mb-4" />
			)}
			<p className="mb-2 font-bold">Name: {user.displayName || "N/A"}</p>
			<p className="mb-2">User ID: {user.uid}</p>
			<p className="mb-2">Email: {user.email}</p>
			<p className="mb-4">Email Verified: {user.emailVerified ? "Yes" : "No"}</p>
			{!user.emailVerified && (
				<Button onClick={handleReCheck} disabled={isReCheckLoading}>
					{isReCheckLoading ? "Checking..." : "Re-check Email Verification"}
				</Button>
			)}
			<Button className="ml-2" onClick={handleLogout} disabled={isLogoutLoading || hasLoggedOut}>
				{isLogoutLoading ? "Logging out..." : hasLoggedOut ? "Logged out" : "Logout"}
			</Button>
		</div>
	);
}
