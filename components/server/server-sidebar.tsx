import { initialProfile } from "@/actions/user-actions";
import { Server } from "@/models/models.server";
import type { Server as ServerType } from "@/types/type.d.ts";
import { redirect } from "next/navigation";
import React from "react";
import ServerHeader from "./server-header";

export const ServerSidebar = async ({ serverId }: { serverId: string }) => {
	const profile = await initialProfile();
	if (!profile) {
		return redirect("/login");
	}
	const server = new Server();
	await server.load(serverId);
	await server.loadMembers();
	await server.loadChannels();
	if (!server) {
		return redirect("/");
	}

	const roleMember = server.members?.find((m) => m.profileId === profile.getId())?.role;
	return (
		<div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
			<ServerHeader server={server.toPlainObject() as ServerType} role={roleMember} />
		</div>
	);
};
