import { initialProfile } from "@/actions/user-actions";
import { redirect } from "next/navigation";
import React from "react";

const Page = async () => {
  const profile = await initialProfile();
  if (!profile) {
    return redirect("/login");
  }
  const res = await fetch(
    "http://localhost:3000/api/messages/?channelId=nWUYBBZvLptKGIT8V0yy&cursor=2"
  );
  const data = await res.json();
  console.log("Data:", data);
  return <div>Page</div>;
};

export default Page;
