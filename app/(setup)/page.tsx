import { initialProfile } from "@/actions/user-actions";
import { InitialModal } from "@/components/modals/initial-modal";
import { redirect } from "next/navigation";
import { getServerIdIncludeCurrentUser } from "@/actions/servers";

export default async function Home() {
  const profile = await initialProfile();
  if (!profile) {
    return redirect("/login");
  }
  const serverId = await getServerIdIncludeCurrentUser(profile.userId);

  if (profile && serverId !== null) {
    return redirect(`/servers/${serverId}`);
  }

  return <InitialModal />;
}
