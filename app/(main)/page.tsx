import { authConfig } from "@/config/server-config";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import UserProfile from "./UserProfile";
import { initialProfile } from "@/actions/user-actions";

export default async function Home() {
	const tokens = await getTokens(await cookies(), authConfig);

	if (!tokens) {
		throw new Error("Cannot get counter of unauthenticated user");
	}

	const profile = await initialProfile();

	// Show user info for logged in user
	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Welcome!</h1>
			<UserProfile />
			{profile && (
				<div className="mt-4 p-4 border rounded bg-muted">
					<h2 className="text-lg font-bold mb-2">Profile Information (Server Action)</h2>
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
