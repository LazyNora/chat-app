import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { MemberProfilePopover } from "./MemberProfilePopover";
import { getGroupMembers, getGroupRoles } from "@/services/groups";
import { usePresenceStore } from "@/stores/presenceStore";
import { useAuthStore } from "@/stores/authStore";
import type { GroupMember, Role } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MemberSidebarProps {
	groupId: string;
}

export function MemberSidebar({ groupId }: MemberSidebarProps) {
	const [members, setMembers] = useState<GroupMember[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const { user } = useAuthStore();
	const { getOnlineStatus } = usePresenceStore();

	useEffect(() => {
		loadMembers();
	}, [groupId]);

	const loadMembers = async () => {
		try {
			setLoading(true);
			const [membersData, rolesData] = await Promise.all([
				getGroupMembers(groupId),
				getGroupRoles(groupId),
			]);
			setMembers(membersData);
			setRoles(rolesData);
		} catch (error) {
			console.error("Error loading members:", error);
		} finally {
			setLoading(false);
		}
	};

	// Group members by role
	const membersByRole = roles.reduce(
		(acc, role) => {
			acc[role.id] = members.filter((m) => m.roles.includes(role.id));
			return acc;
		},
		{} as Record<string, GroupMember[]>
	);

	const membersWithoutRoles = members.filter((m) => m.roles.length === 0);

	// Filter members by search query
	const filterMembers = (memberList: GroupMember[]) => {
		if (!searchQuery) return memberList;
		return memberList.filter((m) =>
			m.displayName.toLowerCase().includes(searchQuery.toLowerCase())
		);
	};

	// Sort members: online first, then by name
	const sortMembers = (memberList: GroupMember[]) => {
		return [...memberList].sort((a, b) => {
			const aStatus = getOnlineStatus(a.userId);
			const bStatus = getOnlineStatus(b.userId);
			const aOnline = aStatus?.status === "online" ? 1 : 0;
			const bOnline = bStatus?.status === "online" ? 1 : 0;
			if (aOnline !== bOnline) return bOnline - aOnline;
			return a.displayName.localeCompare(b.displayName);
		});
	};

	if (loading) {
		return (
			<div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-4">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<Button variant="outline" onClick={loadMembers}>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full h-full bg-muted/30 flex flex-col">
			{/* Search */}
			<div className="p-2 border-b">
				<div className="relative">
					<Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search"
						className="pl-8 h-8"
					/>
				</div>
			</div>

			{/* Members List */}
			<ScrollArea className="flex-1">
				<div className="p-2">
					<Accordion type="multiple" className="w-full" defaultValue={roles.map((r) => r.id)}>
						{roles.map((role) => {
							const roleMembers = filterMembers(membersByRole[role.id] || []);
							if (roleMembers.length === 0 && searchQuery) return null;

							return (
								<AccordionItem key={role.id} value={role.id} className="border-none">
									<AccordionTrigger className="py-2 text-xs font-semibold text-muted-foreground hover:no-underline">
										<div className="flex items-center gap-2">
											<div
												className="w-3 h-3 rounded-full"
												style={{ backgroundColor: role.color }}
											/>
											{role.name} — {roleMembers.length}
										</div>
									</AccordionTrigger>
									<AccordionContent className="pb-2">
										<div className="space-y-0.5">
											{sortMembers(roleMembers).map((member) => {
												const onlineStatus = getOnlineStatus(member.userId);
												const isOnline = onlineStatus?.status === "online";
												const isSelf = user?.uid === member.userId;

												return (
													<MemberProfilePopover
														key={member.userId}
														member={member}
														groupId={groupId}
														roles={roles}>
														<button
															className={cn(
																"w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors text-left group",
																isSelf && "bg-muted/30"
															)}>
															<div className="relative">
																<Avatar className="h-8 w-8">
																	<AvatarImage src={member.photoURL || undefined} />
																	<AvatarFallback>
																		{member.displayName.charAt(0).toUpperCase()}
																	</AvatarFallback>
																</Avatar>
																{isOnline && (
																	<div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
																)}
															</div>
															<span className="flex-1 truncate text-sm">{member.displayName}</span>
														</button>
													</MemberProfilePopover>
												);
											})}
										</div>
									</AccordionContent>
								</AccordionItem>
							);
						})}

						{/* Members without roles */}
						{filterMembers(membersWithoutRoles).length > 0 && (
							<AccordionItem value="no-role" className="border-none">
								<AccordionTrigger className="py-2 text-xs font-semibold text-muted-foreground hover:no-underline">
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
										Members — {filterMembers(membersWithoutRoles).length}
									</div>
								</AccordionTrigger>
								<AccordionContent className="pb-2">
									<div className="space-y-0.5">
										{sortMembers(filterMembers(membersWithoutRoles)).map((member) => {
											const onlineStatus = getOnlineStatus(member.userId);
											const isOnline = onlineStatus?.status === "online";
											const isSelf = user?.uid === member.userId;

											return (
												<MemberProfilePopover
													key={member.userId}
													member={member}
													groupId={groupId}
													roles={roles}>
													<button
														className={cn(
															"w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors text-left group",
															isSelf && "bg-muted/30"
														)}>
														<div className="relative">
															<Avatar className="h-8 w-8">
																<AvatarImage src={member.photoURL || undefined} />
																<AvatarFallback>
																	{member.displayName.charAt(0).toUpperCase()}
																</AvatarFallback>
															</Avatar>
															{isOnline && (
																<div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
															)}
														</div>
														<span className="flex-1 truncate text-sm">{member.displayName}</span>
													</button>
												</MemberProfilePopover>
											);
										})}
									</div>
								</AccordionContent>
							</AccordionItem>
						)}
					</Accordion>
				</div>
			</ScrollArea>
		</div>
	);
}

