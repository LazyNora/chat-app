import { initialProfile } from "@/actions/user-actions";
import { Member, Server } from "@/models/models.server";
import React from "react";

const NavigationSidebar = async () => {
  const profile = await initialProfile();
  const member = Member.find<Member>("profileId", "==", profile.userId);
  const serversId = (await member).map((m) => m.serverId);
  console.log(serversId);
  const servers = await Promise.all(
    serversId.map((id) => Server.findOne<Server>("id", "==", id))  
  );
  console.log(servers); // [null, null]

  return <div>NavigationSidebar</div>;
};

export default NavigationSidebar;
