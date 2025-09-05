import { getAuthenticatedAppForUser } from "@/lib/firebase/auth-server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

const handleAuth = async () => {
  try {
    console.log("UploadThing authentication starting...");
    const { currentUser } = await getAuthenticatedAppForUser();
    console.log(
      "Current user:",
      currentUser ? `UID: ${currentUser.uid}` : "No user found"
    );

    if (!currentUser) {
      console.error("No authenticated user found");
      throw new Error("Unauthorized");
    }

    console.log("Authentication successful for user:", currentUser.uid);
    return { userId: currentUser.uid };
  } catch (error) {
    console.error("Authentication error in UploadThing middleware:", error);
    throw new Error("Unauthorized");
  }
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  serverImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  messageFile: f(["image", "pdf"])
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
