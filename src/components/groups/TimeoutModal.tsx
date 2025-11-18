import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { GroupMember } from "@/types";
import { timeoutMember } from "@/services/groups";
import { toast } from "sonner";

interface TimeoutModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	member: GroupMember;
	groupId: string;
	onSuccess?: () => void;
}

export function TimeoutModal({
	open,
	onOpenChange,
	member,
	groupId,
	onSuccess,
}: TimeoutModalProps) {
	const [duration, setDuration] = useState<string>("10min");
	const [reason, setReason] = useState("");
	const [loading, setLoading] = useState(false);

	const durationOptions = [
		{ value: "10min", label: "10 minutes", ms: 10 * 60 * 1000 },
		{ value: "1hr", label: "1 hour", ms: 60 * 60 * 1000 },
		{ value: "1day", label: "1 day", ms: 24 * 60 * 60 * 1000 },
		{ value: "1week", label: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
	];

	const handleTimeout = async () => {
		const selectedOption = durationOptions.find((opt) => opt.value === duration);
		if (!selectedOption) return;

		setLoading(true);

		try {
			await timeoutMember(groupId, member.userId, selectedOption.ms, reason || undefined);
			toast.success(`${member.displayName} has been timed out for ${selectedOption.label}`);
			onOpenChange(false);
			setReason("");
			onSuccess?.();
		} catch (error) {
			console.error("Error timing out member:", error);
			toast.error("Failed to timeout member");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Timeout {member.displayName}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<Label>Duration</Label>
						<Select value={duration} onValueChange={setDuration}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{durationOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label>Reason (optional)</Label>
						<Textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Why is this member being timed out?"
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleTimeout} disabled={loading}>
						Timeout Member
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

