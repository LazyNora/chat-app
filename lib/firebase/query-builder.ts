import { getFirestoreDB } from "./firebase";
import {
	collection,
	query,
	where,
	orderBy,
	limit,
	startAfter,
	getDocs,
	QueryConstraint,
	WhereFilterOp,
	DocumentData,
	QueryDocumentSnapshot,
} from "firebase/firestore";
import { BaseModel } from "./base-model.client";

export class QueryBuilder<T extends BaseModel> {
	private constraints: QueryConstraint[] = [];
	private ModelClass: new () => T;
	private collectionName: string;

	constructor(ModelClass: new () => T, collectionName: string) {
		this.ModelClass = ModelClass;
		this.collectionName = collectionName;
	}

	where(field: string, operator: WhereFilterOp, value: any): QueryBuilder<T> {
		this.constraints.push(where(field, operator, value));
		return this;
	}

	orderBy(field: string, direction: "asc" | "desc" = "asc"): QueryBuilder<T> {
		this.constraints.push(orderBy(field, direction));
		return this;
	}

	limitTo(n: number): QueryBuilder<T> {
		this.constraints.push(limit(n));
		return this;
	}

	offset(docSnapshot: QueryDocumentSnapshot<DocumentData>): QueryBuilder<T> {
		this.constraints.push(startAfter(docSnapshot));
		return this;
	}

	async execute(): Promise<T[]> {
		const db = getFirestoreDB();
		const q = query(collection(db, this.collectionName), ...this.constraints);
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((doc) => {
			const instance = new this.ModelClass();
			return Object.assign(instance, { id: doc.id, ...doc.data() });
		});
	}

	async getFirst(): Promise<T | null> {
		const results = await this.limitTo(1).execute();
		return results[0] || null;
	}
}
