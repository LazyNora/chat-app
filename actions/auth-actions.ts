"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createSession(uid: string) {
	(await cookies()).set("__session", uid, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60 * 24,
		path: "/",
	});
}

export async function deleteSession() {
	(await cookies()).delete("__session");
	redirect("/login");
}
