import { useEffect, useState, useMemo } from "react";
import {
	collection,
	doc,
	onSnapshot,
	query,
	Query,
	DocumentReference,
	QueryConstraint,
	orderBy as firestoreOrderBy,
} from "firebase/firestore";
import { db } from "@/services/firebase";

// Hook to listen to a Firestore document
export function useDocument<T>(
	path: string | null,
	id: string | null
): { data: T | null; loading: boolean; error: Error | null } {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!path || !id) {
			setTimeout(() => {
				setLoading(false);
			}, 0);
			return;
		}

		const docRef = doc(db, path, id);

		const unsubscribe = onSnapshot(
			docRef,
			(snapshot) => {
				if (snapshot.exists()) {
					setData({ id: snapshot.id, ...snapshot.data() } as T);
				} else {
					setData(null);
				}
				setLoading(false);
				setError(null);
			},
			(err) => {
				console.error("Error fetching document:", err);
				setError(err);
				setLoading(false);
			}
		);

		return () => unsubscribe();
	}, [path, id]);

	return { data, loading, error };
}

// Hook to listen to a Firestore collection
export function useCollection<T>(
	path: string | null,
	...constraints: QueryConstraint[]
): { data: T[]; loading: boolean; error: Error | null } {
	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	// Serialize constraints to avoid re-triggering effect on every render
	const constraintsKey = useMemo(
		() => JSON.stringify(constraints.map((c) => c.type)),
		[constraints]
	);

	useEffect(() => {
		if (!path) {
			setData([]);
			setLoading(false);
			return;
		}

		const collectionRef = collection(db, path);
		const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const items = snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as T[];
				setData(items);
				setLoading(false);
				setError(null);
			},
			(err) => {
				console.error("Error fetching collection:", err);
				setError(err);
				setLoading(false);
			}
		);

		return () => unsubscribe();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [path, constraintsKey]);

	return { data, loading, error };
}

// Hook to listen to group channels
export function useGroupChannels(groupId: string | null) {
	const orderByConstraint = useMemo(() => firestoreOrderBy("position", "asc"), []);
	return useCollection<any>(
		groupId ? `groups/${groupId}/channels` : null,
		orderByConstraint
	);
}

// Hook to listen to group members
export function useGroupMembers(groupId: string | null) {
	return useCollection<any>(groupId ? `groups/${groupId}/members` : null);
}

// Hook to listen to group roles
export function useGroupRoles(groupId: string | null) {
	const orderByConstraint = useMemo(() => firestoreOrderBy("position", "desc"), []);
	return useCollection<any>(
		groupId ? `groups/${groupId}/roles` : null,
		orderByConstraint
	);
}
