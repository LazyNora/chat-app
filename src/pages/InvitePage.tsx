import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { findInviteByCode, useInvite } from "@/services/invites";
import { getGroup } from "@/services/groups";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Group, Invite } from "@/types";

export function InvitePage() {
	const { code } = useParams<{ code: string }>();
	const navigate = useNavigate();
	const { user, userProfile } = useAuthStore();
	const [loading, setLoading] = useState(true);
	const [joining, setJoining] = useState(false);
	const [invite, setInvite] = useState<{ groupId: string; invite: Invite } | null>(null);
	const [group, setGroup] = useState<Group | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!code) {
			setError("Invalid invite code");
			setLoading(false);
			return;
		}

		const loadInvite = async () => {
			try {
				setLoading(true);
				const inviteData = await findInviteByCode(code);
				if (!inviteData) {
					setError("Invite not found or has expired");
					setLoading(false);
					return;
				}

				setInvite(inviteData);
				const groupData = await getGroup(inviteData.groupId);
				setGroup(groupData);
			} catch (err: any) {
				console.error("Error loading invite:", err);
				setError(err.message || "Failed to load invite");
			} finally {
				setLoading(false);
			}
		};

		loadInvite();
	}, [code]);

	const handleJoin = async () => {
		if (!user || !userProfile || !invite) return;

		setJoining(true);
		try {
			const result = await useInvite(
				invite.groupId,
				invite.invite.code,
				user.uid,
				userProfile.displayName,
				userProfile.photoURL
			);

			if (result.success) {
				toast.success("Successfully joined the group!");
				navigate(`/groups/${invite.groupId}`);
			} else {
				toast.error(result.error || "Failed to join group");
			}
		} catch (err: any) {
			console.error("Error joining group:", err);
			toast.error(err.message || "Failed to join group");
		} finally {
			setJoining(false);
		}
	};

	if (!user) {
		return (
			<div className="h-screen flex items-center justify-center">
				<Dialog open={true}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Sign In Required</DialogTitle>
						</DialogHeader>
						<p className="text-sm text-muted-foreground">
							Please sign in to accept this invite.
						</p>
						<DialogFooter>
							<Button onClick={() => navigate("/auth")}>Sign In</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !invite || !group) {
		return (
			<div className="h-screen flex items-center justify-center">
				<Dialog open={true}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Invalid Invite</DialogTitle>
						</DialogHeader>
						<p className="text-sm text-muted-foreground">{error || "Invite not found"}</p>
						<DialogFooter>
							<Button onClick={() => navigate("/")}>Go Home</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		);
	}

	return (
		<div className="h-screen flex items-center justify-center bg-background">
			<Dialog open={true} onOpenChange={() => navigate("/")}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>You've been invited to join a group!</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="flex items-center gap-4">
							{group.iconURL ? (
								<Avatar className="h-16 w-16">
									<AvatarImage src={group.iconURL} />
									<AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
								</Avatar>
							) : (
								<div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
									<span className="text-2xl font-semibold text-primary-foreground">
										{group.name.charAt(0).toUpperCase()}
									</span>
								</div>
							)}
							<div>
								<h3 className="font-semibold text-lg">{group.name}</h3>
								{group.description && (
									<p className="text-sm text-muted-foreground">{group.description}</p>
								)}
								<p className="text-xs text-muted-foreground mt-1">
									{group.memberCount} {group.memberCount === 1 ? "member" : "members"}
								</p>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => navigate("/")}>
							Cancel
						</Button>
						<Button onClick={handleJoin} disabled={joining}>
							{joining ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Joining...
								</>
							) : (
								"Accept Invite"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

