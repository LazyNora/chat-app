import React from "react";
interface PageProps {
  params: Promise<{
    serverId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  const { serverId } = await params;
  return <div>Page: {serverId}</div>;
};

export default Page;
