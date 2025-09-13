"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/firebase";
import { useEffect, useState, useTransition } from "react";
import { useRedirectParam } from "@/lib/useRedirectParam";
import { useRedirectAfterLogin } from "@/lib/useRedirectAfterLogin";
import {
  getRedirectResult,
  signInWithEmailAndPassword,
  UserCredential,
} from "firebase/auth";
import { loginWithCredential } from "@/lib/firebase/auth";
import { useLoadingCallback } from "react-loading-hook";
import {
  getGoogleProvider,
  loginWithProvider,
} from "@/app/(auth)/login/firebase";
import { LoaderIcon } from "lucide-react";
import { appendRedirectParam } from "@/lib/redirect";
import Link from "next/link";

const formSchema = z.object({
  "email-input": z.email({ message: "Please enter a valid email address" }),
  "password-input": z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export function LoginForm({
  loginAction,
}: {
  loginAction: (email: string, password: string) => void;
}) {
  const [hasLogged, setHasLogged] = useState(false);
  const [shouldLoginWithAction, setShouldLoginWithAction] = useState(false);
  let [isPending, startTransition] = useTransition();
  const redirect = useRedirectParam();
  const redirectAfterLogin = useRedirectAfterLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      "email-input": "",
      "password-input": "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { "email-input": email, "password-input": password } = values;
    handleLoginWithEmailAndPassword({ email, password });
  }

  function onReset() {
    form.reset();
    form.clearErrors();
  }

  async function handleLogin(credential: UserCredential) {
    await loginWithCredential(credential);
    redirectAfterLogin();
  }

  const [handleLoginWithEmailAndPassword, isEmailLoading, emailPasswordError] =
    useLoadingCallback(
      async ({ email, password }: { email: string; password: string }) => {
        setHasLogged(false);

        const auth = getFirebaseAuth();

        if (shouldLoginWithAction) {
          startTransition(() => loginAction(email, password));
        } else {
          await handleLogin(
            await signInWithEmailAndPassword(auth, email, password)
          );
          setHasLogged(true);
        }
      }
    );

  const [handleLoginWithGoogle, isGoogleLoading, googleError] =
    useLoadingCallback(async () => {
      setHasLogged(false);

      const auth = getFirebaseAuth();
      await handleLogin(await loginWithProvider(auth, getGoogleProvider(auth)));

      setHasLogged(true);
    });

  async function handleLoginWithRedirect() {
    const auth = getFirebaseAuth();
    const credential = await getRedirectResult(auth);

    if (credential?.user) {
      await handleLogin(credential);

      setHasLogged(true);
    }
  }

  useEffect(() => {
    handleLoginWithRedirect();
  }, []);

  if (hasLogged) {
    return (
      <div className="flex flex-col gap-6">
        <LoaderIcon className="mx-auto animate-spin" />
        {redirect && (
          <div>
            Redirecting to <strong>{redirect}</strong>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button
                disabled={isGoogleLoading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLoginWithGoogle();
                }}
                variant="outline"
                className={cn(
                  "w-full",
                  isGoogleLoading && "cursor-not-allowed"
                )}
              >
                {isGoogleLoading ? (
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    Login with Google
                  </>
                )}
              </Button>
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>
            <form>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href={appendRedirectParam("/forgot-password", redirect)}
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </div>
            </form>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href={appendRedirectParam("/signup", redirect)}
                className="underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
