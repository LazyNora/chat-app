"use client";

import { useState } from "react";
import { redirect, useRouter } from "next/navigation";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronRight, Link, Server, ArrowLeft } from "lucide-react";
import { FileUpload } from "../file-upload";
import { useModal } from "@/hooks/use-modal-store";
import { useOrigin } from "@/hooks/use-origin";

const formSchema = z.object({
  serverName: z.string().min(1, { message: "Server name is required" }),
  imageUrl: z.string().optional(),
});

const inviteFormSchema = z.object({
  inviteLink: z
    .string()
    .min(1, { message: "Invite link is required" })
    .max(255, { message: "Invite link is too long" })
    .regex(/^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/, {
      message:
        "Invite link contains invalid characters. Only ASCII characters are allowed.",
    }),
});

export const CreateServerModal = () => {
  const { isOpen, onClose, type } = useModal();
  const isModalOpen = isOpen && type === "createServer";
  const [formType, setFormType] = useState<"selection" | "create" | "invite">(
    "selection"
  );
  const origin = useOrigin();
  const inviteUrl = `${origin}/invite/123-456-abc`;

  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serverName: "",
      imageUrl: "",
    },
  });

  const inviteForm = useForm({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      inviteLink: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch("/api/servers/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Server created successfully");
        router.refresh();
        form.reset();
        onClose();
      } else {
        toast.error(data.messages || data.message || "Error creating server");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const onInviteSubmit = async (values: z.infer<typeof inviteFormSchema>) => {
    const inviteCode = values.inviteLink.split("/").pop();
    const invitePath = `/invite/${inviteCode}`;

    onClose();
    form.reset();
    redirect(invitePath);
  };

  const handleClose = () => {
    onClose();
    setFormType("selection");
    form.reset();
    inviteForm.reset();
  };
  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6 relative">
          {formType !== "selection" && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 left-4 p-2"
              onClick={() => setFormType("selection")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <DialogTitle className="text-2xl text-center font-bold">
            {formType === "selection"
              ? "Create or Join a Server"
              : formType === "create"
              ? "Customize your server"
              : "Join a Server"}
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            {formType === "selection"
              ? "Choose how you want to get started"
              : formType === "create"
              ? "Give your server a personality with a name and an image. You can always change it later."
              : "Enter an invite link to join an existing server."}
          </DialogDescription>
        </DialogHeader>

        {/* Selection view */}
        {formType === "selection" && (
          <div className="px-6 pb-6">
            <div
              className="flex items-center justify-between gap-4 py-4 px-8 hover:bg-gray-100 cursor-pointer rounded-lg mb-2"
              onClick={() => setFormType("create")}
            >
              {/* Left column with avatar/icon */}
              <div className="flex flex-col items-center">
                <Server />
              </div>

              <span>Create server</span>

              {/* Right column with arrow */}
              <div className="flex flex-col items-center">
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>

            <div
              className="flex items-center justify-between py-4 px-8 hover:bg-gray-100 cursor-pointer rounded-lg"
              onClick={() => setFormType("invite")}
            >
              {/* Left column with avatar/icon */}
              <div className="flex flex-col items-center">
                <Link />
              </div>

              <span>Join with invite link</span>

              {/* Right column with arrow */}
              <div className="flex flex-col items-center">
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>
        )}

        {/* Render form based on formType */}
        {formType === "create" && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
              suppressHydrationWarning
            >
              <div className="space-y-8 px-6">
                <div className="flex justify-center items-center text-center">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FileUpload
                            endpoint="serverImage"
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="serverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                        Server name
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          className="bg-zinc-300/50 border-0 focus:visible:ring-0 text-black focus-visible:ring-offset-0"
                          placeholder="Enter server name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="bg-gray-100 px-6 py-4">
                <Button type="submit" variant="default" disabled={isLoading}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {formType === "invite" && (
          <Form {...inviteForm}>
            <form
              onSubmit={inviteForm.handleSubmit(onInviteSubmit)}
              className="space-y-8"
              suppressHydrationWarning
            >
              <div className="space-y-8 px-6">
                <FormField
                  control={inviteForm.control}
                  name="inviteLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                        Invite Link
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={inviteForm.formState.isSubmitting}
                          className="bg-zinc-300/50 border-0 focus:visible:ring-0 text-black focus-visible:ring-offset-0"
                          placeholder={inviteUrl}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="bg-gray-100 px-6 py-4">
                <Button
                  type="submit"
                  variant="default"
                  disabled={inviteForm.formState.isSubmitting}
                >
                  Join Server
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
