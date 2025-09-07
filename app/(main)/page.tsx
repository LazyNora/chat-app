"use client";

import { deleteSession } from "@/actions/auth-actions";
import { initialProfile } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/firebase/auth";
import { Profile } from "@/models/models";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
	const [userProfile, setUserProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const router = useRouter();

	const handleLogout = async () => {
		await signOut();
		await deleteSession();
	};

	useEffect(() => {
		const fetchUserProfile = async () => {
			const { profile } = await initialProfile();
			setUserProfile(profile);
			console.log(profile);
			setLoading(false);
		};

		fetchUserProfile();
	}, []);

	if (loading) {
		// While loading, show nothing or a loading indicator
		return <div>Loading...</div>;
	}

	if (!userProfile) {
		// While redirecting, show nothing
		return <div>Redirecting...</div>;
	}

	// Show user info for logged in user
	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Welcome!</h1>
			<div className="bg-muted rounded p-4">
				<div>
					<strong>UID:</strong> {userProfile.userId}
				</div>
				<div>
					<strong>Email:</strong> {userProfile.email}
				</div>
				<div>
					<strong>Name:</strong> {userProfile.name}
				</div>
				<div>
					<strong>Profile Picture:</strong>{" "}
					{userProfile.imageUrl ? (
						<Image src={userProfile.imageUrl} alt="Profile Picture" width={100} height={100} />
					) : null}
				</div>
			</div>
			<Button onClick={handleLogout}>Logout</Button>
		</div>
	);
}
