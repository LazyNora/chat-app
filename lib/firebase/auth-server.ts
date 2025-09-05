import "server-only";

import { cookies } from "next/headers";
import { initializeServerApp, initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

// Returns an authenticated client SDK instance for use in Server Side Rendering
// and Static Site Generation
export async function getAuthenticatedAppForUser() {
  try {
    const authIdToken = (await cookies()).get("__session")?.value;

    if (!authIdToken) {
      return { firebaseServerApp: null, currentUser: null };
    }

    const firebaseServerApp = initializeServerApp(initializeApp(), {
      authIdToken,
    });

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    return { firebaseServerApp, currentUser: auth.currentUser };
  } catch (error) {
    console.error("Error in getAuthenticatedAppForUser:", error);
    return { firebaseServerApp: null, currentUser: null };
  }
}
