"use server";

import { authConfig } from "@/config/server-config";
import { Profile } from "@/models/models.server";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";

export async function initialProfile() {
  const tokens = await getTokens(await cookies(), authConfig);

  if (!tokens) {
    return null;
  }

  const profile = await Profile.findOne<Profile>(
    "userId",
    "==",
    tokens.decodedToken.uid
  );

  if (profile) {
    return profile;
  }

  const newProfile = new Profile();
  newProfile.userId = tokens.decodedToken.uid;
  newProfile.name = tokens.decodedToken.name || "";
  newProfile.email = tokens.decodedToken.email || "";
  newProfile.imageUrl = tokens.decodedToken.picture || "";
  newProfile.createdAt = new Date().toISOString();
  newProfile.updatedAt = new Date().toISOString();

  await newProfile.save(tokens.decodedToken.uid);

  return newProfile;
}
