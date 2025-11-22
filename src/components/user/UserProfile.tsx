import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { signOut } from "@/services/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function UserProfile() {
	const { user, userProfile } = useAuthStore();
	const { getOnlineStatus } = usePresenceStore();
	const navigate = useNavigate();

	const onlineStatus = useMemo(() => {
		if (!userProfile || !user) return null;
		const status = getOnlineStatus(user.uid);
		if (status) return status;
		// Return fallback status without lastSeen (it's not used in the UI)
		return { status: userProfile.statusType || "online", lastSeen: 0 };
	}, [userProfile, user, getOnlineStatus]);

	const statusColor = useMemo(() => {
		const status = onlineStatus?.status || userProfile?.statusType || "online";
		const colorMap: Record<string, string> = {
			online: "bg-green-500",
			idle: "bg-yellow-500",
			dnd: "bg-red-500",
			invisible: "bg-gray-500",
		};
		return colorMap[status] || "bg-gray-500";
	}, [onlineStatus?.status, userProfile?.statusType]);

	const handleLogout = async () => {
		try {
			await signOut();
			toast.success("Signed out successfully");
			navigate("/auth");
		} catch (error: any) {
			toast.error(error.message || "Failed to sign out");
		}
	};

	if (!user || !userProfile) {
		return null;
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button className="w-full p-2 hover:bg-muted/50 rounded transition-colors">
					<div className="flex items-center gap-3 px-2">
						<div className="relative">
							<Avatar className="h-8 w-8">
								<AvatarImage src={userProfile.photoURL || undefined} referrerPolicy="no-referrer" />
								<AvatarFallback>{userProfile.displayName.charAt(0).toUpperCase()}</AvatarFallback>
							</Avatar>
							<div
								className={cn(
									"absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background",
									statusColor
								)}
							/>
						</div>
						<div className="flex-1 min-w-0 text-left">
							<div className="text-sm font-semibold truncate">{userProfile.displayName}</div>
							{userProfile.customStatus && (
								<div className="text-xs text-muted-foreground truncate">
									{userProfile.customStatusEmoji} {userProfile.customStatus}
								</div>
							)}
						</div>
					</div>
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0" align="start" side="top">
				<div className="p-4 space-y-4">
					{/* Header */}
					<div className="flex items-start gap-3">
						<div className="relative">
							<Avatar className="h-16 w-16">
								<AvatarImage src={userProfile.photoURL || undefined} referrerPolicy="no-referrer" />
								<AvatarFallback>{userProfile.displayName.charAt(0).toUpperCase()}</AvatarFallback>
							</Avatar>
							<div
								className={cn(
									"absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background",
									statusColor
								)}
							/>
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold truncate">{userProfile.displayName}</h3>
							{userProfile.customStatus && (
								<p className="text-sm text-muted-foreground truncate">
									{userProfile.customStatusEmoji && <span>{userProfile.customStatusEmoji} </span>}
									{userProfile.customStatus}
								</p>
							)}
							<p className="text-xs text-muted-foreground mt-1">
								{onlineStatus?.status === "online"
									? "Online"
									: onlineStatus?.status === "idle"
									? "Idle"
									: onlineStatus?.status === "dnd"
									? "Do Not Disturb"
									: "Offline"}
							</p>
						</div>
					</div>

					<Separator />

					{/* Actions */}
					<div className="space-y-1">
						<Button
							variant="ghost"
							className="w-full justify-start"
							onClick={() => navigate("/settings")}>
							<Settings className="h-4 w-4 mr-2" />
							User Settings
						</Button>
						<Separator />
						<Button
							variant="ghost"
							className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
							onClick={handleLogout}>
							<LogOut className="h-4 w-4 mr-2" />
							Log Out
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
