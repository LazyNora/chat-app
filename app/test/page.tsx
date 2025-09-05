"use client";
import { SignupForm } from "@/components/auth/signup-form";
import { InitialModal } from "@/components/modals/initial-model";
import { UploadButton } from "@/lib/uploadthing";
import React from "react";

const Page = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <UploadButton
        endpoint="serverImage"
        onClientUploadComplete={(res) => {
          // Do something with the response
          console.log("Files: ", res);
          alert("Upload Completed");
        }}
        onUploadError={(error: Error) => {
          // Do something with the error.
          alert(`ERROR! ${error.message}`);
        }}
      />
    </main>
  );
};

export default Page;
