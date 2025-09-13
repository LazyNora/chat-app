import { authConfig } from "@/config/server-config";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";

import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

const handleAuth = async () => {
  const tokens = await getTokens(await cookies(), authConfig);

  if (!tokens) {
    throw new Error("Cannot get counter of unauthenticated user");
  }
  return { userId: tokens.decodedToken.uid };
};

export const ourFileRouter = {
  serverImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  messageFile: f(["image", "pdf"])
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
