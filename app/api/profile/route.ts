import { authConfig } from "@/config/server-config";
import { Profile } from "@/models/models.server";
import { getTokens } from "next-firebase-auth-edge";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const tokens = await getTokens(request.cookies, authConfig);

	if (!tokens) {
		throw new Error("User is not authenticated");
	}

	const profile = await Profile.findOne<Profile>("userId", "==", tokens.decodedToken.uid);

	if (profile) {
		return NextResponse.json({ profile });
	}

	const newProfile = new Profile();
	newProfile.userId = tokens.decodedToken.uid;
	newProfile.name = tokens.decodedToken.name || "";
	newProfile.email = tokens.decodedToken.email || "";
	newProfile.imageUrl = tokens.decodedToken.picture || "";
	newProfile.createdAt = new Date().toISOString();
	newProfile.updatedAt = new Date().toISOString();

	await newProfile.save(tokens.decodedToken.uid);

	return NextResponse.json({ profile: newProfile });
}
