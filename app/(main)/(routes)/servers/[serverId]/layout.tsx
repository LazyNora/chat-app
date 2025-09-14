import { initialProfile } from "@/actions/user-actions";
import { ServerSidebar } from "@/components/server/server-sidebar";
import { Server } from "@/models/models.client";
import { redirect } from "next/navigation";
import React from "react";
interface PageProps {
  params: Promise<{
    serverId: string;
  }>;
}
const ServerLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: PageProps["params"];
}) => {
  const { serverId } = await params;

  const profile = await initialProfile();
  if (!profile) {
    return redirect("/login");
  }
  const server = new Server();
  await server.load(serverId);
  if (!server) {
    return redirect("/");
  }

  const member = await server.loadMembers();
  if (!member || member.length === 0) {
    return redirect("/");
  }
  const isMember = member.find((m) => m.profileId === profile.getId());
  if (!isMember) {
    return redirect("/");
  }

  return (
    <div className="h-full">
      <div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0">
        <ServerSidebar serverId={serverId} />
      </div>
      <main className="h-full md:pl-60">{children}</main>
    </div>
  );
};

export default ServerLayout;
