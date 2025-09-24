"use client";

import { BadgeCheck, Bell, ChevronsUpDown, CreditCard, LogOut, Sparkles } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLoadingCallback } from "react-loading-hook";
import { getFirebaseAuth } from "@/lib/firebase/firebase";
import { signOut } from "firebase/auth";
import { logout } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
interface NavUserProps {
	name: string;
	email: string;
	avatar: string;
}
export function NavUser({ name, email, avatar }: NavUserProps) {
	const router = useRouter();

	const [handleLogout, isLogoutLoading] = useLoadingCallback(async () => {
		const auth = getFirebaseAuth();
		await signOut(auth);
		await logout();

		router.refresh();
	});

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar className="h-12 w-12 rounded-lg">
					<AvatarImage src={avatar} alt={name} />
					<AvatarFallback className="rounded-lg">{name.charAt(0).toUpperCase()}</AvatarFallback>
				</Avatar>
				{/* <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{name}</span>
          <span className="truncate text-xs">{email}</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4" /> */}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
				// side={isMobile ? "bottom" : "right"}
				side="right"
				align="end"
				sideOffset={4}>
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarImage src={avatar} alt={name} />
							<AvatarFallback className="rounded-lg">{name.charAt(0).toUpperCase()}</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{name}</span>
							<span className="truncate text-xs">{email}</span>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<Sparkles />
						Upgrade to Pro
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<BadgeCheck />
						Account
					</DropdownMenuItem>
					<DropdownMenuItem>
						<CreditCard />
						Billing
					</DropdownMenuItem>
					<DropdownMenuItem>
						<Bell />
						Notifications
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					<Button variant="ghost" onClick={handleLogout} disabled={isLogoutLoading}>
						<LogOut className="text-red-500" />
						Log out
					</Button>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
