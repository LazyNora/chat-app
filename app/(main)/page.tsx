import { authConfig } from "@/config/server-config";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import UserProfile from "./UserProfile";

export default async function Home() {
	const tokens = await getTokens(await cookies(), authConfig);

	if (!tokens) {
		throw new Error("Cannot get counter of unauthenticated user");
	}

	// Show user info for logged in user
	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Welcome!</h1>
			<UserProfile />
		</div>
	);
}
