import { loginAction } from "@/actions/login";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default async function LoginPage() {
	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<LoginForm loginAction={loginAction} />
				<div className="text-center">
					<ThemeToggle />
				</div>
			</div>
		</div>
	);
}
