import { initialProfile } from "@/actions/user-actions";
import { Server } from "@/models/models.server";
import React from "react";
import { NavigationAction } from "./navigation-action";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { NavigationItem } from "./navigation-item";
import { ThemeToggle } from "../theme/theme-toggle";
import { NavUser } from "./nav-user";
import { redirect } from "next/navigation";

const NavigationSidebar = async () => {
  const profile = await initialProfile();
  if (!profile) {
    return redirect("/login");
  }
  const members = await profile.loadMembers();
  const servers = await Promise.all(
    members.map(async (member) => {
      const server = new Server();
      await server.load(member.serverId);
      return server;
    })
  );
  return (
    <div
      className="space-y-4 flex flex-col items-center 
      h-full text-primary w-full dark:bg-[#1E1F22] bg-[#E3E5E8] py-3"
    >
      <NavigationAction />
      <Separator className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto" />
      <ScrollArea className="flex-1 w-full overflow-hidden">
        {servers.map((server) => (
          <div key={server.getId()} className="mb-4">
            <NavigationItem
              id={server.getId()}
              name={server.name}
              imageUrl={server.imageUrl}
            />
          </div>
        ))}
      </ScrollArea>
      <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
        <ThemeToggle />
        <NavUser
          name={profile.name}
          email={profile.email}
          avatar={profile.imageUrl || ""}
        />
      </div>
    </div>
  );
};

export default NavigationSidebar;
