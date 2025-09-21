"use server";

import { authConfig } from "@/config/server-config";
import { Profile } from "@/models/models.server";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { NextApiRequest } from "next";
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";

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

// Version for Pages Router API routes
export async function getProfileFromRequest(req: NextApiRequest) {
  try {
    // Tạo một mock cookies object để tương thích với getTokens
    const cookieStore = {
      get: (name: string) => {
        const value = req.cookies[name];
        return value ? { name, value } : undefined;
      },
      getAll: () => {
        return Object.entries(req.cookies).map(([name, value]) => ({
          name,
          value: value || "",
        }));
      },
      has: (name: string) => name in req.cookies,
      set: () => {}, // Không cần implement cho read-only operation
      delete: () => {}, // Không cần implement cho read-only operation
    };

    const tokens = await getTokens(
      cookieStore as unknown as RequestCookies,
      authConfig
    );

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
  } catch (error) {
    console.error("Error getting profile from request:", error);
    return null;
  }
}
