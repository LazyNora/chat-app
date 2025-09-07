import { db } from "@/lib/firebase/firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	return NextResponse.json({ message: "test" }, { status: 201 });
}
