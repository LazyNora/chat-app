import { signInWithCustomToken } from "firebase/auth";
import { getValidCustomToken } from "next-firebase-auth-edge/lib/next/client";
import { getFirebaseAuth } from "./firebase";

const auth = getFirebaseAuth();

export async function authenticateForUserWithToken(serverCustomToken: string) {
	// We use `getValidCustomToken` to fetch fresh `customToken` using /api/refresh-token endpoint if original custom token has expired.
	// This ensures custom token is valid, even in long-running client sessions
	const customToken = await getValidCustomToken({
		serverCustomToken,
		refreshTokenUrl: "/api/refresh-token",
	});

	if (!customToken) {
		throw new Error("Invalid custom token");
	}

	const { user: firebaseUser } = await signInWithCustomToken(auth, customToken);

	return firebaseUser;
}
