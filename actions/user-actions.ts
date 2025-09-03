import { db } from "@/lib/firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function getUserDataByID(uid: string) {
	const q = query(collection(db, "users"), where("uid", "==", uid));
	const user = await getDocs(q);
	const userData = user.docs.map((doc) => ({
		id: doc.id,
		uid: doc.data().uid,
		email: doc.data().email,
		name: doc.data().name,
		profilePic: doc.data().profilePic,
	}))[0];

	return { data: userData };
}
