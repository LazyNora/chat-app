import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
	getFirestore,
	connectFirestoreEmulator,
	enableIndexedDbPersistence,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
	if (err.code === "failed-precondition") {
		console.warn("Firestore persistence failed: Multiple tabs open");
	} else if (err.code === "unimplemented") {
		console.warn("Firestore persistence not available in this browser");
	}
});

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
	connectAuthEmulator(auth, "http://localhost:9099");
	connectFirestoreEmulator(db, "localhost", 8080);
	connectStorageEmulator(storage, "localhost", 9199);
}
