"use client";

import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import qs from "query-string";
import { FileUpload } from "../file-upload";
import { useModal } from "@/hooks/use-modal-store";

const formSchema = z.object({
  fileUrl: z.string().min(1, { message: "Attachment is required" }),
});

export const MessageFileModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "messageFile";
  const { apiUrl, query } = data;
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fileUrl: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl || "",
        query: query,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, content: values.fileUrl }),
      });
      const data = await response.json();
      if (response.ok) {
        router.refresh();
        // form.reset();
        handleClose();
      } else {
        toast.error(data.messages || data.message || "Error creating server");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className=" p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6 relative">
          <DialogTitle className="text-2xl text-center font-bold">
            Add an attachment
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            You can attach an image or a file to your message.
          </DialogDescription>
        </DialogHeader>

        {/* Render form based on formType */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
            suppressHydrationWarning
          >
            <div className="space-y-6 px-6">
              <div className="flex justify-center items-center text-center">
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          endpoint="messageFile"
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="px-6 py-2">
              <Button type="submit" variant="default" disabled={isLoading}>
                Send
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
