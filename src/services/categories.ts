import {
	collection,
	doc,
	setDoc,
	getDoc,
	getDocs,
	query,
	orderBy,
	deleteDoc,
	serverTimestamp,
	writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ChannelCategory } from "@/types";

// Create a category
export async function createCategory(
	groupId: string,
	name: string
): Promise<string> {
	const categoryRef = doc(collection(db, `groups/${groupId}/categories`));
	const categoryId = categoryRef.id;

	// Get current category count for position
	const categoriesRef = collection(db, `groups/${groupId}/categories`);
	const categoriesSnap = await getDocs(categoriesRef);
	const position = categoriesSnap.size;

	const categoryData: Omit<ChannelCategory, "id" | "createdAt"> & {
		createdAt: ReturnType<typeof serverTimestamp>;
	} = {
		name,
		position,
		collapsed: false,
		createdAt: serverTimestamp(),
	};

	await setDoc(categoryRef, categoryData);

	return categoryId;
}

// Get all categories for a group
export async function getGroupCategories(groupId: string): Promise<ChannelCategory[]> {
	const categoriesRef = collection(db, `groups/${groupId}/categories`);
	const q = query(categoriesRef, orderBy("position", "asc"));
	const categoriesSnap = await getDocs(q);

	return categoriesSnap.docs.map((doc) => ({
		id: doc.id,
		...doc.data(),
	})) as ChannelCategory[];
}

// Update category
export async function updateCategory(
	groupId: string,
	categoryId: string,
	updates: Partial<Omit<ChannelCategory, "id" | "createdAt">>
): Promise<void> {
	const categoryRef = doc(db, `groups/${groupId}/categories`, categoryId);
	await setDoc(categoryRef, updates, { merge: true });
}

// Delete category
export async function deleteCategory(groupId: string, categoryId: string): Promise<void> {
	const categoryRef = doc(db, `groups/${groupId}/categories`, categoryId);
	await deleteDoc(categoryRef);

	// Note: Channels in this category will have categoryId set to null
	// You might want to handle this in a cloud function
}

// Reorder categories
export async function reorderCategories(
	groupId: string,
	categoryUpdates: Array<{ id: string; position: number }>
): Promise<void> {
	const batch = writeBatch(db);

	categoryUpdates.forEach(({ id, position }) => {
		const categoryRef = doc(db, `groups/${groupId}/categories`, id);
		batch.update(categoryRef, { position });
	});

	await batch.commit();
}

// Toggle category collapse
export async function toggleCategoryCollapse(
	groupId: string,
	categoryId: string,
	collapsed: boolean
): Promise<void> {
	const categoryRef = doc(db, `groups/${groupId}/categories`, categoryId);
	await setDoc(categoryRef, { collapsed }, { merge: true });
}

