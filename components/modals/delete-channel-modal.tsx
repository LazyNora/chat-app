"use client";

import { useModal } from "@/hooks/use-modal-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import qs from "query-string";
export const DeleteChannelModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();
  const { server, channel } = data;

  const [isLoading, setLoading] = useState(false);

  const isModalOpen = isOpen && type === "deleteChannel";

  const onConfirm = async () => {
    try {
      const url = qs.stringifyUrl({
        url: `/api/channels/${channel?.id}`,
        query: { serverId: server?.id },
      });
      setLoading(true);
      const response = await fetch(url, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        router.refresh();
        // router.push(`/servers/${server?.id}`);
        onClose();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className=" p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Delete Channel
          </DialogTitle>
          <DialogDescription className="text-center mt-4 text-sm">
            Are you sure you want to delete{" "}
            <strong className="font-semibold text-indigo-500">
              #{channel?.name}
            </strong>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="px-6 py-4">
          <div className="flex items-center justify-end w-full gap-2">
            <Button disabled={isLoading} onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={isLoading}
              onClick={onConfirm}
              variant="destructive"
            >
              Confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
