"use client";

import { useAuth } from "@/lib/firebase/AuthContext";
import { useLoadingCallback } from "react-loading-hook";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/firebase";
import { signOut } from "firebase/auth";
import { checkEmailVerification, logout } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Profile } from "@/models/models";
import { authenticateForUserWithToken } from "@/lib/firebase/tokens";

export default function UserProfile() {
	const router = useRouter();
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
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

	useEffect(() => {
		const fetchUserProfile = async () => {
			if (user) {
				try {
					console.log("Fetching profile for user:", user.uid);
					await authenticateForUserWithToken(user.customToken!);
					const result = await Profile.findOne<Profile>("userId", "==", user.uid);
					if (result) {
						setProfile(result);
					}
				} catch (error) {
					console.error("Error fetching user profile:", error);
				}
			}
		};
		fetchUserProfile();
	}, [user]);

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
			{profile && (
				<div className="mt-4 p-4 border rounded">
					<h2 className="text-lg font-bold mb-2">Profile Information</h2>
					<p className="mb-1">Name: {profile.name}</p>
					<p className="mb-1">Email: {profile.email}</p>
					{profile.imageUrl && (
						<img
							src={profile.imageUrl}
							alt="Profile Image"
							className="mt-2 w-24 h-24 rounded-full"
						/>
					)}
					<p className="mb-1">Created At: {profile.createdAt}</p>
					<p className="mb-1">Updated At: {profile.updatedAt}</p>
				</div>
			)}
		</div>
	);
}
