import { getApp, getApps, initializeApp, initializeServerApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { FirestoreOrmRepository } from "@arbel/firebase-orm";
import { getAuth, inMemoryPersistence, setPersistence } from "firebase/auth";
import { clientConfig } from "@/config/client-config";

export const getFirebaseApp = () => {
	if (getApps().length) {
		return getApp();
	}

	return initializeApp(clientConfig);
};

export function getFirebaseAuth() {
	const auth = getAuth(getFirebaseApp());

	// App relies only on server token. We make sure Firebase does not store credentials in the browser.
	// See: https://github.com/awinogrodzki/next-firebase-auth-edge/issues/143
	setPersistence(auth, inMemoryPersistence);

	return auth;
}

export function getFirestoreDB() {
	const db = getFirestore(getFirebaseApp());

	if (typeof window !== "undefined") {
		FirestoreOrmRepository.initGlobalConnection(db);
	}

	return db;
}

export async function getServerFirebase(authIdToken?: string) {
	const app = initializeServerApp(clientConfig, { authIdToken });
	const auth = getAuth(app);

	await auth.authStateReady();

	const db = getFirestore(app);

	return { app, auth, db };
}
