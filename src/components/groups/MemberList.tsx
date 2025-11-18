import { useState, useEffect } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberCard } from "./MemberCard";
import { getGroupMembers, getGroupRoles } from "@/services/groups";
import type { GroupMember, Role } from "@/types";
import { useAuthStore } from "@/stores/authStore";

interface MemberListProps {
	groupId: string;
}

export function MemberList({ groupId }: MemberListProps) {
	const [members, setMembers] = useState<GroupMember[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedRole, setSelectedRole] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const { user } = useAuthStore();

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

	const filteredMembers = members.filter((member) => {
		const matchesSearch =
			member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			searchQuery === "";

		const matchesRole =
			selectedRole === null ||
			member.roles.includes(selectedRole) ||
			(selectedRole === "all" && true);

		return matchesSearch && matchesRole;
	});

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-muted-foreground">Loading members...</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* Search and Filters */}
			<div className="p-4 space-y-2 border-b">
				<div className="relative">
					<Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search members..."
						className="pl-8"
					/>
				</div>

				<Tabs value={selectedRole || "all"} onValueChange={setSelectedRole}>
					<TabsList className="w-full">
						<TabsTrigger value="all" className="flex-1">
							All ({members.length})
						</TabsTrigger>
						{roles.map((role) => {
							const count = members.filter((m) => m.roles.includes(role.id)).length;
							return (
								<TabsTrigger key={role.id} value={role.id} className="flex-1">
									{role.name} ({count})
								</TabsTrigger>
							);
						})}
					</TabsList>
				</Tabs>
			</div>

			{/* Member List */}
			<ScrollArea className="flex-1">
				<div className="p-2 space-y-1">
					{filteredMembers.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full p-8 text-center">
							<Users className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">No members found</p>
						</div>
					) : (
						filteredMembers.map((member) => (
							<MemberCard
								key={member.userId}
								member={member}
								groupId={groupId}
								roles={roles}
								isSelf={user?.uid === member.userId}
								onUpdate={loadMembers}
							/>
						))
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

