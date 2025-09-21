"use client";
import { Member, Message } from "@/types/types";
import React, { Fragment } from "react";
import ChatWelcome from "./chat-welcome";
import { useChatQuery } from "@/hooks/use-chat-quey";
import { Loader2, ServerCrash } from "lucide-react";
interface ChatMessagesProps {
  name: string;
  member: Member;
  chatId: string;
  apiUrl: string;
  socketUrl: string;
  socketQuery: Record<string, string>;
  paramKey: "channelId" | "conversationId";
  paramValue: string;
  type: "conversation" | "channel";
}
const ChatMessages = ({
  name,
  member,
  chatId,
  apiUrl,
  socketUrl,
  socketQuery,
  paramKey,
  paramValue,
  type,
}: ChatMessagesProps) => {
  const queryKey = `chat:${chatId}`;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({ queryKey, apiUrl, paramKey, paramValue });

  if (status === "pending") {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <Loader2 className="animate-spin my-4 h-6 w-6 text-zinc-500" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <ServerCrash className=" my-4 h-6 w-6 text-zinc-500" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Something went wrong
        </p>
      </div>
    );
  }

  return (
    <div className=" flex flex-col py-4 overflow-y-auto">
      <div className="flex-1" />
      <ChatWelcome name={name} type={type} />
      <div className="flex flex-col-reverse mt-auto">
        {/* {data?.pages.map((group, i) => (
          <Fragment key={i}>
            {group.items.map((message: Message) => (
              //   <ChatMessage key={message.id} message={message} />
              <div key={message.id}>{message.content}</div>
            ))}
          </Fragment>
        ))} */}
      </div>
    </div>
  );
};

export default ChatMessages;
