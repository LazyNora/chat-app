import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MemberContextMenu } from "./MemberContextMenu";
import { TimeoutModal } from "./TimeoutModal";
import { BanModal } from "./BanModal";
import type { GroupMember, Role } from "@/types";
import { formatDistance } from "date-fns";

interface MemberCardProps {
	member: GroupMember;
	groupId: string;
	roles: Role[];
	isSelf: boolean;
	onUpdate?: () => void;
}

export function MemberCard({ member, groupId, roles, isSelf, onUpdate }: MemberCardProps) {
	const [showTimeoutModal, setShowTimeoutModal] = useState(false);
	const [showBanModal, setShowBanModal] = useState(false);
	const [showManageRoles, setShowManageRoles] = useState(false);

	const memberRoles = roles.filter((r) => member.roles.includes(r.id));
	const joinedDate = member.joinedAt?.toDate
		? formatDistance(member.joinedAt.toDate(), new Date(), { addSuffix: true })
		: "Recently";

	return (
		<>
			<MemberContextMenu
				member={member}
				groupId={groupId}
				onViewProfile={() => {
					// TODO: Open profile modal
				}}
				onManageRoles={() => setShowManageRoles(true)}
				onSendDM={() => {
					// TODO: Open DM
				}}>
				<div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer">
					<Avatar className="h-10 w-10">
						<AvatarImage src={member.photoURL || undefined} />
						<AvatarFallback>
							{member.displayName.charAt(0).toUpperCase()}
						</AvatarFallback>
					</Avatar>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<span className="font-medium truncate">{member.displayName}</span>
							{isSelf && (
								<Badge variant="secondary" className="text-xs">
									You
								</Badge>
							)}
						</div>
						<div className="flex items-center gap-1 flex-wrap mt-1">
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
						<p className="text-xs text-muted-foreground mt-1">
							Joined {joinedDate}
						</p>
					</div>
				</div>
			</MemberContextMenu>

			{showTimeoutModal && (
				<TimeoutModal
					open={showTimeoutModal}
					onOpenChange={setShowTimeoutModal}
					member={member}
					groupId={groupId}
					onSuccess={onUpdate}
				/>
			)}

			{showBanModal && (
				<BanModal
					open={showBanModal}
					onOpenChange={setShowBanModal}
					member={member}
					groupId={groupId}
					onSuccess={onUpdate}
				/>
			)}
		</>
	);
}

