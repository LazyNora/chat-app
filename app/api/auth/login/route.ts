import { db } from "@/lib/firebase/firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const newRequest = await request.json();
		const q = query(collection(db, "users"), where("uid", "==", newRequest.uid));
		const user = await getDocs(q);
		const userData = user.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}))[0];

		if (userData) {
			return NextResponse.json({ message: "Login successful" }, { status: 201 });
		} else {
			const userCollection = collection(db, "users");
			await addDoc(userCollection, newRequest);
			return NextResponse.json({ message: "User created successfully" }, { status: 201 });
		}
	} catch (error: any) {
		console.error("Error during login:", error);
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
}
