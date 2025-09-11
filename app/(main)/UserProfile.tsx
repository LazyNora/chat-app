"use client";

import { useAuth } from "@/lib/firebase/AuthContext";
import { useLoadingCallback } from "react-loading-hook";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getFirebaseAuth } from "@/lib/firebase/firebase";
import { signOut } from "firebase/auth";
import { checkEmailVerification, logout } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Profile } from "@/models/models.client";
import { authenticateForUserWithToken } from "@/lib/firebase/tokens";

export default function UserProfile() {
	const router = useRouter();
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [profile2, setProfile2] = useState<Profile | null>(null);
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

	const [handleFetchProfile, isFetchProfileLoading] = useLoadingCallback(async () => {
		const response = await fetch("/api/profile", { method: "GET" });

		if (response.ok) {
			const data = await response.json();
			setProfile2(data.profile);
		} else {
			console.error("Failed to fetch profile:", response.statusText);
		}
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
			<div className="mt-4 p-4 border rounded bg-muted">
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
			{profile && (
				<div className="mt-4 p-4 border rounded bg-muted">
					<h2 className="text-lg font-bold mb-2">Profile Information (Firestore Client)</h2>
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
			<Button className="mt-4" onClick={handleFetchProfile} disabled={isFetchProfileLoading}>
				{isFetchProfileLoading ? "Fetching Profile..." : "Fetch Profile from API"}
			</Button>
			{profile2 && (
				<div className="mt-4 p-4 border rounded bg-muted">
					<h2 className="text-lg font-bold mb-2">Profile Information (API)</h2>
					<p className="mb-1">Name: {profile2.name}</p>
					<p className="mb-1">Email: {profile2.email}</p>
					{profile2.imageUrl && (
						<img
							src={profile2.imageUrl}
							alt="Profile Image"
							className="mt-2 w-24 h-24 rounded-full"
						/>
					)}
					<p className="mb-1">Created At: {profile2.createdAt}</p>
					<p className="mb-1">Updated At: {profile2.updatedAt}</p>
				</div>
			)}
		</div>
	);
}
