import { UserCredential } from "firebase/auth";

export async function login(token: string) {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
	};

	await fetch("/api/login", {
		method: "GET",
		headers,
	});
}

export async function loginWithCredential(credential: UserCredential) {
	const idToken = await credential.user.getIdToken();

	await login(idToken);
}

export async function logout() {
	const headers: Record<string, string> = {};

	await fetch("/api/logout", {
		method: "GET",
		headers,
	});
}

export async function checkEmailVerification() {
	const headers: Record<string, string> = {};

	await fetch("/api/check-email-verification", {
		method: "GET",
		headers,
	});
}
