import { auth } from "@/lib/firebase/firebase";
import { Profile } from "@/models/models";

export async function initialProfile() {
	const user = auth.currentUser;
	if (!user) {
		return { profile: null };
	}

	const profile = await Profile.findOne("userId", "==", user.uid);
	if (profile) {
		return {
			profile,
		};
	}

	const newProfile = new Profile();
	newProfile.userId = user.uid;
	newProfile.name = user.displayName || "";
	newProfile.email = user.email || "";
	newProfile.imageUrl = user.photoURL || "";
	newProfile.createdAt = new Date().toISOString();
	newProfile.updatedAt = new Date().toISOString();

	await newProfile.save(user.uid);

	return {
		profile: newProfile,
	};
}
