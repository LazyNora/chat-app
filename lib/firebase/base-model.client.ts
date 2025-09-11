import { getFirestoreDB } from "./firebase";
import type { WhereFilterOp, Firestore } from "firebase/firestore";
import {
	collection,
	doc,
	getDoc,
	getDocs,
	setDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	limit,
	startAfter,
	onSnapshot,
	QueryConstraint,
	DocumentData,
	QueryDocumentSnapshot,
} from "firebase/firestore";

// Default instance
const db: Firestore = getFirestoreDB();

export interface ModelConstructor<T extends BaseModel = BaseModel> {
	new (): T;
	collectionName: string;
	getCollectionName(): string;
	query(): QueryBuilder<T>;
	find(field: string, operator: WhereFilterOp, value: any): Promise<T[]>;
	find(conditions: Record<string, any>): Promise<T[]>;
	findOne(field: string, operator: WhereFilterOp, value: any): Promise<T | null>;
	findOne(conditions: Record<string, any>): Promise<T | null>;
}

export class BaseModel {
	protected static collectionName: string = "";

	static getCollectionName(): string {
		return this.collectionName;
	}
	protected id: string = "";

	// Get the document ID
	getId(): string {
		return this.id;
	}

	// Set the document ID
	setId(id: string): void {
		this.id = id;
	}

	// Save the document with optional custom ID
	async save(id?: string): Promise<void> {
		const collectionRef = collection(db, (this.constructor as typeof BaseModel).collectionName);
		const data = this.toJSON();

		if (id || this.id) {
			const docId = id || this.id;
			await setDoc(doc(collectionRef, docId), data);
			this.id = docId;
		} else {
			const docRef = doc(collectionRef);
			this.id = docRef.id;
			await setDoc(docRef, data);
		}
	}

	// Load a document by ID
	async load(id: string): Promise<void> {
		const docRef = doc(db, (this.constructor as typeof BaseModel).collectionName, id);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			this.fromJSON({ id: docSnap.id, ...docSnap.data() });
		} else {
			throw new Error("Document not found");
		}
	}

	// Delete the document
	async destroy(): Promise<void> {
		if (!this.id) throw new Error("Cannot delete document without ID");

		const docRef = doc(db, (this.constructor as typeof BaseModel).collectionName, this.id);
		await deleteDoc(docRef);
	}

	// Convert model to JSON for Firestore
	protected toJSON(): DocumentData {
		const json: DocumentData = {};
		for (const [key, value] of Object.entries(this)) {
			if (key !== "id" && typeof value !== "function" && !Array.isArray(value)) {
				json[key] = value;
			}
		}
		return json;
	}

	// Load JSON data into model
	protected fromJSON(data: DocumentData): void {
		Object.assign(this, data);
	}

	// Load a relationship model
	protected async loadRelation<T extends BaseModel>(
		ModelClass: ModelConstructor<T>,
		foreignId: string
	): Promise<T | undefined> {
		if (!foreignId) return undefined;
		try {
			const result = await ModelClass.findOne({ id: foreignId });
			return result ?? undefined;
		} catch (error) {
			return undefined;
		}
	}

	// Load many-to-many or one-to-many relationships
	protected async loadRelatedModels<T extends BaseModel>(
		ModelClass: ModelConstructor<T>,
		conditions: Record<string, any>
	): Promise<T[]> {
		return await ModelClass.find(conditions);
	}

	// Static methods for querying
	static async find<T extends BaseModel>(
		this: ModelConstructor<T>,
		field: string,
		operator: WhereFilterOp,
		value: any
	): Promise<T[]>;
	static async find<T extends BaseModel>(
		this: ModelConstructor<T>,
		conditions: Record<string, any>
	): Promise<T[]>;
	static async find<T extends BaseModel>(
		this: ModelConstructor<T>,
		fieldOrConditions: string | Record<string, any>,
		operator?: WhereFilterOp,
		value?: any
	): Promise<T[]> {
		const queryBuilder = this.query();

		if (typeof fieldOrConditions === "string" && operator !== undefined && value !== undefined) {
			// Single condition with operator
			queryBuilder.where(fieldOrConditions, operator, value);
		} else if (typeof fieldOrConditions === "object") {
			// Multiple conditions with default "==" operator
			Object.entries(fieldOrConditions).forEach(([field, value]) => {
				queryBuilder.where(field, "==", value);
			});
		}

		const results = await queryBuilder.get();
		return results.map((doc) => Object.assign(new this(), doc)) as T[];
	}

	static async findOne<T extends BaseModel>(
		this: ModelConstructor<T>,
		field: string,
		operator: WhereFilterOp,
		value: any
	): Promise<T | null>;
	static async findOne<T extends BaseModel>(
		this: ModelConstructor<T>,
		conditions: Record<string, any>
	): Promise<T | null>;
	static async findOne<T extends BaseModel>(
		this: ModelConstructor<T>,
		fieldOrConditions: string | Record<string, any>,
		operator?: WhereFilterOp,
		value?: any
	): Promise<T | null> {
		const results =
			typeof fieldOrConditions === "string" && operator !== undefined && value !== undefined
				? await this.find(fieldOrConditions, operator, value)
				: await this.find(fieldOrConditions as Record<string, any>);
		return results.length > 0 ? (results[0] as T) : null;
	}

	// Get all documents
	static async getAll<T extends BaseModel>(this: ModelConstructor<T>): Promise<T[]> {
		const collectionRef = collection(db, this.getCollectionName());
		const querySnapshot = await getDocs(collectionRef);

		return querySnapshot.docs.map((doc) => {
			const instance = new this();
			(instance as any).fromJSON({ id: doc.id, ...doc.data() });
			return instance;
		});
	}

	static query<T extends BaseModel>(this: ModelConstructor<T>) {
		return new QueryBuilder<T>(this);
	}

	static onList<T extends BaseModel>(
		this: ModelConstructor<T>,
		callback: (models: T[]) => void
	): () => void {
		const collectionRef = collection(db, this.getCollectionName());

		return onSnapshot(collectionRef, (snapshot) => {
			const models = snapshot.docs.map((doc) => {
				const instance = new this();
				instance.fromJSON({ id: doc.id, ...doc.data() });
				return instance;
			});
			callback(models);
		});
	}

	on(callback: () => void): () => void {
		if (!this.id) throw new Error("Cannot listen to document without ID");

		const docRef = doc(db, (this.constructor as typeof BaseModel).collectionName, this.id);
		return onSnapshot(docRef, (snapshot) => {
			if (snapshot.exists()) {
				this.fromJSON({ id: snapshot.id, ...snapshot.data() });
				callback();
			}
		});
	}
}

class QueryBuilder<T extends BaseModel> {
	private constraints: QueryConstraint[] = [];

	constructor(private ModelClass: new () => T) {}

	where(field: string, operator: WhereFilterOp, value: any): QueryBuilder<T> {
		this.constraints.push(where(field, operator, value));
		return this;
	}

	orderBy(field: string, direction: "asc" | "desc" = "asc"): QueryBuilder<T> {
		this.constraints.push(orderBy(field, direction));
		return this;
	}

	limit(limitCount: number): QueryBuilder<T> {
		this.constraints.push(limit(limitCount));
		return this;
	}

	startAfter(value: any): QueryBuilder<T> {
		this.constraints.push(startAfter(value));
		return this;
	}

	async get(): Promise<T[]> {
		const collectionRef = collection(db, (this.ModelClass as any).collectionName);
		const q = query(collectionRef, ...this.constraints);
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((doc) => {
			const instance = new this.ModelClass();
			(instance as any).fromJSON({ id: doc.id, ...doc.data() });
			return instance;
		});
	}
}
