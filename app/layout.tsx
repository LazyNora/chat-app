import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/lib/firebase/AuthProvider";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/config/server-config";
import { toUser } from "@/lib/user";
import { Metadata as UserMetadata } from "@/lib/firebase/AuthContext";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing/core";
import { ModalProvider } from "@/components/providers/modal-provider";
import { Toaster } from "@/components/ui/sonner";
import SocketProvider from "@/components/providers/socket-provider";
import QueryProvider from "@/components/providers/query-provider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat App",
  description: "Chat application built with Next.js and Firebase",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tokens = await getTokens<UserMetadata>(await cookies(), authConfig);
  const user = tokens ? toUser(tokens) : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <AuthProvider user={user}>
            <SocketProvider>
              <ModalProvider />
              <QueryProvider>{children}</QueryProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="top-center" expand={false} richColors />
      </body>
    </html>
  );
}
