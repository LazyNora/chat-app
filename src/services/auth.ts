import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	signOut as firebaseSignOut,
	updateProfile,
	type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import { type User, type UserSettings } from "@/types";

const googleProvider = new GoogleAuthProvider();

// Default user settings
const defaultSettings: UserSettings = {
	notifications: {
		allMessages: false,
		mentions: true,
		directMessages: true,
		soundEnabled: true,
	},
	privacy: {
		showOnlineStatus: true,
		allowDMs: "everyone",
	},
	appearance: {
		theme: "system",
	},
};

// Create user profile in Firestore
export async function createUserProfile(firebaseUser: FirebaseUser): Promise<User> {
	const userRef = doc(db, "users", firebaseUser.uid);

	const userProfile: Omit<User, "createdAt" | "updatedAt"> & {
		createdAt: ReturnType<typeof serverTimestamp>;
		updatedAt: ReturnType<typeof serverTimestamp>;
	} = {
		uid: firebaseUser.uid,
		email: firebaseUser.email!,
		displayName: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
		photoURL: firebaseUser.photoURL,
		customStatus: null,
		customStatusEmoji: null,
		statusType: "online",
		fcmTokens: [],
		settings: defaultSettings,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	};

	await setDoc(userRef, userProfile);

	// Return with Timestamp type
	return {
		...userProfile,
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	};
}

// Get user profile from Firestore
export async function getUserProfile(userId: string): Promise<User | null> {
	const userRef = doc(db, "users", userId);
	const userSnap = await getDoc(userRef);

	if (userSnap.exists()) {
		return userSnap.data() as User;
	}

	return null;
}

// Sign up with email and password
export async function signUpWithEmail(
	email: string,
	password: string,
	displayName: string
): Promise<{ user: FirebaseUser; profile: User }> {
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);
	const { user } = userCredential;

	// Update display name
	await updateProfile(user, { displayName });

	// Create user profile in Firestore
	const profile = await createUserProfile(user);

	return { user, profile };
}

// Sign in with email and password
export async function signInWithEmail(
	email: string,
	password: string
): Promise<{ user: FirebaseUser; profile: User }> {
	const userCredential = await signInWithEmailAndPassword(auth, email, password);
	const { user } = userCredential;

	let profile = await getUserProfile(user.uid);

	// Create profile if it doesn't exist (for backward compatibility)
	if (!profile) {
		profile = await createUserProfile(user);
	}

	return { user, profile };
}

// Sign in with Google
export async function signInWithGoogle(): Promise<{ user: FirebaseUser; profile: User }> {
	const userCredential = await signInWithPopup(auth, googleProvider);
	const { user } = userCredential;

	let profile = await getUserProfile(user.uid);

	// Create profile if it doesn't exist (new user)
	if (!profile) {
		profile = await createUserProfile(user);
	}

	return { user, profile };
}

// Sign out
export async function signOut(): Promise<void> {
	await firebaseSignOut(auth);
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
	const userRef = doc(db, "users", userId);
	await setDoc(
		userRef,
		{
			...updates,
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	);
}

// Update user status
export async function updateUserStatus(
	userId: string,
	status: "online" | "idle" | "dnd" | "invisible"
): Promise<void> {
	const userRef = doc(db, "users", userId);
	await setDoc(
		userRef,
		{
			statusType: status,
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	);
}

// Update custom status
export async function updateCustomStatus(
	userId: string,
	customStatus: string | null,
	customStatusEmoji: string | null
): Promise<void> {
	const userRef = doc(db, "users", userId);
	await setDoc(
		userRef,
		{
			customStatus,
			customStatusEmoji,
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	);
}

// Upload profile picture
export async function uploadProfilePicture(userId: string, file: File): Promise<string> {
	const timestamp = Date.now();
	const fileName = `profile_${timestamp}_${file.name}`;
	const filePath = `users/${userId}/profile/${fileName}`;
	const fileRef = ref(storage, filePath);

	await uploadBytes(fileRef, file);
	const downloadURL = await getDownloadURL(fileRef);

	// Update user profile
	const userRef = doc(db, "users", userId);
	await setDoc(
		userRef,
		{
			photoURL: downloadURL,
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	);

	// Update Firebase Auth profile
	const firebaseUser = auth.currentUser;
	if (firebaseUser) {
		await updateProfile(firebaseUser, { photoURL: downloadURL });
	}

	return downloadURL;
}

// Update user settings
export async function updateUserSettings(
	userId: string,
	settings: Partial<UserSettings>
): Promise<void> {
	const userRef = doc(db, "users", userId);
	await setDoc(
		userRef,
		{
			settings,
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	);
}
