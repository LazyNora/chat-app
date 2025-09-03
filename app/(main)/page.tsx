"use client";

import { deleteSession } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useFirebaseAuth";
import { signOut } from "@/lib/firebase/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
	const { userData, loading } = useAuth();
	const router = useRouter();

	const handleLogout = async () => {
		await signOut();
		await deleteSession();
	};

	if (loading) {
		return <div>Loading...</div>;
	}

	if (!userData) {
		// While redirecting, show nothing
		return null;
	}

	// Show user info for logged in user
	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Welcome!</h1>
			<div className="bg-muted rounded p-4">
				<div>
					<strong>UID:</strong> {userData.uid}
				</div>
				<div>
					<strong>Email:</strong> {userData.email}
				</div>
				<div>
					<strong>Name:</strong> {userData.name}
				</div>
				<div>
					<strong>Profile Picture:</strong>{" "}
					<Image src={userData.profilePic} alt="Profile Picture" width={100} height={100} />
				</div>
			</div>
			<Button onClick={handleLogout}>Logout</Button>
		</div>
	);
}
