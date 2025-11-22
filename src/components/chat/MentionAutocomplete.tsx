import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GroupMember } from "@/types";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

interface MentionAutocompleteProps {
	members: GroupMember[];
	searchQuery: string;
	groupId: string;
	selectedIndex: number;
	onSelect: (member: GroupMember | "everyone") => void;
	position: { top: number; left: number };
}

export function MentionAutocomplete({
	members,
	searchQuery,
	groupId,
	selectedIndex,
	onSelect,
	position,
}: MentionAutocompleteProps) {
	const { hasPermission } = usePermissions(groupId);
	const canMentionEveryone = hasPermission("mentionEveryone");

	// Filter members based on search query
	const filteredMembers = members.filter((member) =>
		member.displayName.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Add @everyone option if user has permission and it matches the search
	const showEveryone = canMentionEveryone && "everyone".includes(searchQuery.toLowerCase());
	const items: (GroupMember | "everyone")[] = showEveryone
		? ["everyone", ...filteredMembers]
		: filteredMembers;

	if (items.length === 0) return null;

	return (
		<div
			className="fixed z-100 bg-popover border rounded-md shadow-md w-64 max-h-64"
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
				transform: "translateY(-100%)", // Position above the input
			}}>
			<ScrollArea className="max-h-64">
				<div className="p-1">
					{items.map((item, index) => {
						if (item === "everyone") {
							return (
								<button
									key="everyone"
									onClick={() => onSelect("everyone")}
									className={cn(
										"w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent cursor-pointer",
										index === selectedIndex && "bg-accent"
									)}>
									<div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
										@
									</div>
									<div className="flex-1 text-left">
										<div className="font-medium">everyone</div>
										<div className="text-xs text-muted-foreground">Notify all members</div>
									</div>
								</button>
							);
						}

						return (
							<button
								key={item.userId}
								onClick={() => onSelect(item)}
								className={cn(
									"w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent cursor-pointer",
									index === selectedIndex && "bg-accent"
								)}>
								<Avatar className="h-8 w-8">
									<AvatarImage src={item.photoURL || undefined} />
									<AvatarFallback>{item.displayName.charAt(0).toUpperCase()}</AvatarFallback>
								</Avatar>
								<div className="flex-1 text-left">
									<div className="font-medium">{item.displayName}</div>
								</div>
							</button>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
}
