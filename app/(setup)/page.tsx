import { authConfig } from "@/config/server-config";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { initialProfile } from "@/actions/user-actions";
import { InitialModal } from "@/components/modals/initial-model";
import { redirect } from "next/navigation";
import { getServerIdIncludeCurrentUser } from "@/actions/servers";

export default async function Home() {
  const tokens = await getTokens(await cookies(), authConfig);

  if (!tokens) {
    throw new Error("Cannot get counter of unauthenticated user");
  }

  const profile = await initialProfile();
  const serverId = await getServerIdIncludeCurrentUser(profile.userId);
  if (profile) {
    return redirect(`/servers/${serverId}`);
  }

  // Show user info for logged in user
  return <InitialModal />;
}
