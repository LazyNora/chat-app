import { auth } from "@/lib/firebase/firebase";
import {
	type User,
	signInWithEmailAndPassword as _signInWithEmailAndPassword,
	createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
	onAuthStateChanged as _onAuthStateChanged,
	GoogleAuthProvider,
	signInWithPopup,
} from "firebase/auth";

export function onAuthStateChanged(callback: (authUser: User | null) => void) {
	return _onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
	const provider = new GoogleAuthProvider();

	try {
		const result = await signInWithPopup(auth, provider);

		if (!result || !result.user) {
			throw new Error("Google sign in failed");
		}

		return result.user;
	} catch (error) {
		console.error("Error signing in with Google:", error);
	}
}

export async function signInWithEmailAndPassword(email: string, password: string) {
	try {
		const result = await _signInWithEmailAndPassword(auth, email, password);
		return result.user;
	} catch (error) {
		console.error("Error signing in with email and password:", error);
	}
}

export async function createUserWithEmailAndPassword(email: string, password: string) {
	try {
		const result = await _createUserWithEmailAndPassword(auth, email, password);
		return result.user;
	} catch (error) {
		console.error("Error creating user with email and password:", error);
	}
}

export async function signOut() {
	try {
		await auth.signOut();
	} catch (error) {
		console.error("Error signing out:", error);
	}
}
