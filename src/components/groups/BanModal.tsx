import { useState } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/components/ui/dialog";
import type { GroupMember } from "@/types";
import { banMember } from "@/services/groups";
import { toast } from "sonner";

interface BanModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	member: GroupMember;
	groupId: string;
	onSuccess?: () => void;
}

export function BanModal({
	open,
	onOpenChange,
	member,
	groupId,
	onSuccess,
}: BanModalProps) {
	const [reason, setReason] = useState("");
	const [deleteMessages, setDeleteMessages] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleBan = async () => {
		setLoading(true);

		try {
			await banMember(groupId, member.userId, reason || undefined, deleteMessages);
			toast.success(`${member.displayName} has been banned`);
			onOpenChange(false);
			setReason("");
			setDeleteMessages(false);
			onSuccess?.();
		} catch (error) {
			console.error("Error banning member:", error);
			toast.error("Failed to ban member");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Ban className="h-5 w-5 text-destructive" />
						Ban {member.displayName}
					</DialogTitle>
					<DialogDescription>
						This will permanently remove {member.displayName} from the group. They
						won't be able to rejoin unless unbanned.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<Label>Reason (optional)</Label>
						<Textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Why is this member being banned?"
							rows={3}
						/>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="deleteMessages"
							checked={deleteMessages}
							onCheckedChange={(checked) => setDeleteMessages(checked === true)}
						/>
						<Label
							htmlFor="deleteMessages"
							className="text-sm font-normal cursor-pointer">
							Delete their messages from the last 24 hours
						</Label>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={handleBan} disabled={loading}>
						Ban Member
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

