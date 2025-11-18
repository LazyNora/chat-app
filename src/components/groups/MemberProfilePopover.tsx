import { useState, useEffect } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, UserPlus, Settings } from "lucide-react";
import { getUserProfile } from "@/services/auth";
import { usePresenceStore } from "@/stores/presenceStore";
import type { GroupMember, Role } from "@/types";
import { formatDistance } from "date-fns";

interface MemberProfilePopoverProps {
	member: GroupMember;
	groupId: string;
	roles: Role[];
	children: React.ReactNode;
	onSendDM?: () => void;
	onManageRoles?: () => void;
}

export function MemberProfilePopover({
	member,
	groupId,
	roles,
	children,
	onSendDM,
	onManageRoles,
}: MemberProfilePopoverProps) {
	const [userProfile, setUserProfile] = useState<any>(null);
	const { getOnlineStatus } = usePresenceStore();
	const onlineStatus = getOnlineStatus(member.userId);
	const memberRoles = roles.filter((r) => member.roles.includes(r.id));

	useEffect(() => {
		const loadProfile = async () => {
			try {
				const profile = await getUserProfile(member.userId);
				setUserProfile(profile);
			} catch (error) {
				console.error("Error loading user profile:", error);
			}
		};
		loadProfile();
	}, [member.userId]);

	const statusColor = {
		online: "bg-green-500",
		idle: "bg-yellow-500",
		dnd: "bg-red-500",
		invisible: "bg-gray-500",
	}[onlineStatus?.status || userProfile?.statusType || "invisible"];

	const joinedDate = member.joinedAt?.toDate
		? formatDistance(member.joinedAt.toDate(), new Date(), { addSuffix: true })
		: "Recently";

	return (
		<Popover>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent className="w-80 p-0" align="start">
				<div className="p-4 space-y-4">
					{/* Header */}
					<div className="flex items-start gap-3">
						<div className="relative">
							<Avatar className="h-16 w-16">
								<AvatarImage src={member.photoURL || undefined} />
								<AvatarFallback>
									{member.displayName.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div
								className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background ${statusColor}`}
							/>
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold truncate">{member.displayName}</h3>
							{userProfile?.customStatus && (
								<p className="text-sm text-muted-foreground truncate">
									{userProfile.customStatusEmoji && (
										<span>{userProfile.customStatusEmoji} </span>
									)}
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

					{/* Roles */}
					{memberRoles.length > 0 && (
						<div className="space-y-2">
							<h4 className="text-xs font-semibold text-muted-foreground uppercase">
								Roles
							</h4>
							<div className="flex flex-wrap gap-1">
								{memberRoles.map((role) => (
									<Badge
										key={role.id}
										variant="outline"
										className="text-xs"
										style={{ borderColor: role.color, color: role.color }}>
										{role.name}
									</Badge>
								))}
							</div>
						</div>
					)}

					<Separator />

					{/* Info */}
					<div className="space-y-1 text-sm">
						<div>
							<span className="text-muted-foreground">Member since</span>
							<p className="font-medium">{joinedDate}</p>
						</div>
					</div>

					<Separator />

					{/* Actions */}
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							className="flex-1"
							onClick={onSendDM}>
							<MessageSquare className="h-4 w-4 mr-2" />
							Message
						</Button>
						{onManageRoles && (
							<Button
								variant="outline"
								size="sm"
								className="flex-1"
								onClick={onManageRoles}>
								<Settings className="h-4 w-4 mr-2" />
								Roles
							</Button>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

