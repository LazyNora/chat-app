/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WhereFilterOp } from "firebase-admin/firestore";
import { getFirestore } from "firebase-admin/firestore";
import type { DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "./firebase-admin";

// Default instance
const db = getFirestore(getFirebaseAdminApp());

export interface ModelConstructor<T extends BaseModel = BaseModel> {
  new (): T;
  collectionName: string;
  getCollectionName(): string;
  query(): QueryBuilder<T>;
  find(field: string, operator: WhereFilterOp, value: any): Promise<T[]>;
  find(conditions: Record<string, any>): Promise<T[]>;
  findOne(
    field: string,
    operator: WhereFilterOp,
    value: any
  ): Promise<T | null>;
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
    const collectionRef = db.collection(
      (this.constructor as typeof BaseModel).collectionName
    );
    const data = this.toFirestoreJSON();

    if (id || this.id) {
      const docId = id || this.id;
      await collectionRef.doc(docId).set(data);
      this.id = docId;
    } else {
      const docRef = collectionRef.doc();
      this.id = docRef.id;
      await docRef.set(data);
    }
  }

  // Load a document by ID
  async load(id: string): Promise<void> {
    const docSnap = await db
      .collection((this.constructor as typeof BaseModel).collectionName)
      .doc(id)
      .get();

    if (docSnap.exists) {
      this.fromFirestoreJSON({ id: docSnap.id, ...docSnap.data() });
    } else {
      throw new Error("Document not found");
    }
  }

  // Delete the document
  async destroy(): Promise<void> {
    if (!this.id) throw new Error("Cannot delete document without ID");

    await db
      .collection((this.constructor as typeof BaseModel).collectionName)
      .doc(this.id)
      .delete();
  }

  // Convert model to JSON for Firestore
  protected toFirestoreJSON(): DocumentData {
    const json: DocumentData = {};
    for (const [key, value] of Object.entries(this)) {
      if (
        key !== "id" &&
        typeof value !== "function" &&
        !Array.isArray(value) &&
        value !== undefined
      ) {
        json[key] = value;
      }
    }
    return json;
  }

  /**
   * Converts the model instance to a plain object, recursively handling nested BaseModel instances and arrays.
   */
  toPlainObject(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === "function") continue;
      if (value instanceof BaseModel) {
        result[key] = value.toPlainObject();
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          item instanceof BaseModel ? item.toPlainObject() : item
        );
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  // Load JSON data into model
  protected fromFirestoreJSON(data: DocumentData): void {
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

    if (
      typeof fieldOrConditions === "string" &&
      operator !== undefined &&
      value !== undefined
    ) {
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
      typeof fieldOrConditions === "string" &&
      operator !== undefined &&
      value !== undefined
        ? await this.find(fieldOrConditions, operator, value)
        : await this.find(fieldOrConditions as Record<string, any>);
    return results.length > 0 ? (results[0] as T) : null;
  }

  // Get all documents
  static async getAll<T extends BaseModel>(
    this: ModelConstructor<T>
  ): Promise<T[]> {
    const snapshot = await db.collection(this.getCollectionName()).get();

    return snapshot.docs.map((doc) => {
      const instance = new this();
      (instance as any).fromFirestoreJSON({ id: doc.id, ...doc.data() });
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
    return db.collection(this.getCollectionName()).onSnapshot((snapshot) => {
      const models = snapshot.docs.map((doc) => {
        const instance = new this();
        instance.fromFirestoreJSON({ id: doc.id, ...doc.data() });
        return instance;
      });
      callback(models);
    });
  }

  on(callback: () => void): () => void {
    if (!this.id) throw new Error("Cannot listen to document without ID");

    return db
      .collection((this.constructor as typeof BaseModel).collectionName)
      .doc(this.id)
      .onSnapshot((snapshot) => {
        if (snapshot.exists) {
          this.fromFirestoreJSON({ id: snapshot.id, ...snapshot.data() });
          callback();
        }
      });
  }
}

class QueryBuilder<T extends BaseModel> {
  private query: FirebaseFirestore.Query;

  constructor(private ModelClass: new () => T) {
    this.query = db.collection((this.ModelClass as any).collectionName);
  }

  where(field: string, operator: WhereFilterOp, value: any): QueryBuilder<T> {
    this.query = this.query.where(field, operator, value);
    return this;
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc"): QueryBuilder<T> {
    this.query = this.query.orderBy(field, direction);
    return this;
  }

  limit(limitCount: number): QueryBuilder<T> {
    this.query = this.query.limit(limitCount);
    return this;
  }

  startAfter(value: any): QueryBuilder<T> {
    this.query = this.query.startAfter(value);
    return this;
  }

  offset(value: number): QueryBuilder<T> {
    this.query = this.query.offset(value);
    return this;
  }
  
  async get(): Promise<T[]> {
    const querySnapshot = await this.query.get();

    return querySnapshot.docs.map((doc) => {
      const instance = new this.ModelClass();
      (instance as any).fromFirestoreJSON({ id: doc.id, ...doc.data() });
      return instance;
    });
  }
}
