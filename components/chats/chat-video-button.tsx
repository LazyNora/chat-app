"use client";
import React from "react";
import qs from "query-string";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ActionTooltip } from "../action-tooltip";
import { Video, VideoOff } from "lucide-react";
import { Button } from "../ui/button";

const ChatVideoButton = () => {
  const pathName = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVideo = searchParams?.get("video");
  const Icon = isVideo ? VideoOff : Video;
  const tooltipLabel = isVideo ? "Stop Video Call" : "Start Video Call";
  const onClick = () => {
    const url = qs.stringifyUrl(
      {
        url: pathName || "",
        query: { video: isVideo ? undefined : "true" },
      },
      { skipNull: true }
    );
    router.push(url);
  };
  return (
    <ActionTooltip side="bottom" label={tooltipLabel} align="center">
      <Button onClick={onClick} variant="ghost" size="icon">
        <Icon className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
      </Button>
    </ActionTooltip>
  );
};

export default ChatVideoButton;
