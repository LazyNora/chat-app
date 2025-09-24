import { Member, MemberRole } from "@/types/types";
import React from "react";
import { UserAvatar } from "../user-avatar";
import { ActionTooltip } from "../action-tooltip";
import Image from "next/image";
import { Edit, FileIcon, Trash } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import qs from "query-string";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useModal } from "@/hooks/use-modal-store";
import { useParams, useRouter } from "next/navigation";
interface ChatItemProps {
  id: string;
  content: string;
  member: Member;
  timestamp: string;
  fileUrl: string | undefined;
  deleted: boolean;
  currentMember: Member;
  isUpdated: boolean;
  socketUrl: string;
  socketQuery: Record<string, string>;
}
const roleIconMap = {
  [MemberRole.GUEST]: "👤",
  [MemberRole.ADMIN]: "👑",
  [MemberRole.MODERATOR]: "🛡️",
};
const formSchema = z.object({
  content: z.string().min(1).max(500),
});

const ChatItem = ({
  id,
  content,
  member,
  timestamp,
  fileUrl,
  deleted,
  currentMember,
  isUpdated,
  socketUrl,
  socketQuery,
}: ChatItemProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const { onOpen } = useModal();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: content,
    },
  });
  const isLoading = form.formState.isLoading;
  useEffect(() => {
    form.reset({
      content: content,
    });
  }, [content, form]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsEditing(false);
        form.reset();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [form]);

  const fileType = fileUrl?.split(".").pop();
  const isAdmin = currentMember.role === MemberRole.ADMIN;
  const isModerator = currentMember.role === MemberRole.MODERATOR;
  const isOwner = currentMember.profileId === member.profileId;
  const canDeleteMessage = !deleted && (isAdmin || isOwner || isModerator);

  // Kiểm tra fileUrl có hợp lệ không
  const hasValidFileUrl =
    fileUrl &&
    fileUrl !== "null" &&
    fileUrl !== "undefined" &&
    fileUrl.trim() !== "";
  const canEditMessage = !deleted && isOwner && !hasValidFileUrl;
  const isPDF = hasValidFileUrl && fileType === "pdf";
  const isImage = hasValidFileUrl && !isPDF;
  const params = useParams();
  const router = useRouter();

  const onMemberClick = async (userId: string) => {
    if (userId === currentMember.profileId) {
      return;
    }
    router.push(`/servers/${params?.serverId}/conversations/${userId}`);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });
      const request = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const data = await request.json();
      if (request.ok) {
        toast.success(data.message);
        router.refresh();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("Failed to send message", error);
    } finally {
      form.reset();
      setIsEditing(false);
    }
  };
  return (
    <div className="relative group flex items-center p-4 transition w-full">
      <div className="group flex gap-x-2 items-center w-full rounded-md hover:bg-black/5 p-2">
        <div
          className="cursor-pointer hover:drop-shadow-md transition"
          onClick={() => onMemberClick(member.profile?.id || "")}
        >
          <UserAvatar
            src={member.profile?.imageUrl}
            fallBack={member.profile?.name}
          />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-x-2">
            <div className="flex items-center">
              <p
                className="font-semibold text-sm hover:underline cursor-pointer"
                onClick={() => onMemberClick(member.profile?.id || "")}
              >
                {member.profile?.name}
              </p>
              <ActionTooltip label={member.role} align="start">
                <span className="ml-1">{roleIconMap[member.role]}</span>
              </ActionTooltip>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timestamp}
            </span>
          </div>
          {/* Hiển thị image nếu có fileUrl hợp lệ và không phải PDF */}
          {isImage && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48"
            >
              <Image
                src={fileUrl}
                alt="Image"
                layout="fill"
                objectFit="cover"
              />
            </a>
          )}

          {/* Hiển thị PDF nếu có fileUrl hợp lệ và là PDF */}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
              <FileIcon className="h-8 w-8 fill-indigo-200 stroke-indigo-400" />
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
              >
                PDF file
              </a>
            </div>
          )}

          {/* Hiển thị content text nếu không có fileUrl hợp lệ và không đang edit */}
          {!hasValidFileUrl && !isEditing && (
            <p
              className={cn(
                "text-sm text-zinc-600 dark:text-zinc-300",
                deleted && "italic text-zinc-500 dark:text-zinc-400 mt-1"
              )}
            >
              {content}
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                  (edited)
                </span>
              )}
            </p>
          )}

          {/* Hiển thị form edit nếu đang edit và không có fileUrl */}
          {!hasValidFileUrl && isEditing && (
            <Form {...form}>
              <form
                className="flex items-center w-full gap-x-2 pt-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            {...field}
                            disabled={isLoading}
                            placeholder="Edited message..."
                            className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus:ring-0 focus-visible:ring-0 text-zinc-600 dark:text-zinc-200"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {" "}
                        Press escape to cancel, enter to save
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size={"sm"}
                  variant={"default"}
                  disabled={isLoading}
                >
                  Save
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
      {canDeleteMessage && (
        <div className="absolute hidden group-hover:flex items-center gap-x-2 p-1 top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm">
          {canEditMessage && (
            <ActionTooltip label="Edit" align="center">
              <Edit
                onClick={() => setIsEditing(true)}
                className="cursor-pointer h-4 w-4 ml-auto text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
              />
            </ActionTooltip>
          )}
          <ActionTooltip label="Delete" align="center">
            <Trash
              onClick={() =>
                onOpen("deleteMessage", {
                  apiUrl: `${socketUrl}/${id}`,
                  query: socketQuery,
                })
              }
              className="cursor-pointer h-4 w-4 ml-auto text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            />
          </ActionTooltip>
        </div>
      )}
    </div>
  );
};

export default ChatItem;
