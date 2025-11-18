import { useState, useEffect } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Copy, Download, Plus, Trash, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { createInvite, getGroupInvites, deleteInvite } from "@/services/invites";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { formatDistance } from "date-fns";
import type { Invite } from "@/types";

interface InviteModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	groupId: string;
}

export function InviteModal({ open, onOpenChange, groupId }: InviteModalProps) {
	const [invites, setInvites] = useState<Invite[]>([]);
	const [loading, setLoading] = useState(false);
	const [maxUses, setMaxUses] = useState<string>("unlimited");
	const [expiration, setExpiration] = useState<string>("never");
	const { user } = useAuthStore();

	useEffect(() => {
		if (open) {
			loadInvites();
		}
	}, [open, groupId]);

	const loadInvites = async () => {
		try {
			const invitesData = await getGroupInvites(groupId);
			setInvites(invitesData);
		} catch (error) {
			console.error("Error loading invites:", error);
			toast.error("Failed to load invites");
		}
	};

	const handleCreateInvite = async () => {
		if (!user) return;

		setLoading(true);

		try {
			const maxUsesValue = maxUses === "unlimited" ? undefined : parseInt(maxUses);
			const expirationHours =
				expiration === "never"
					? undefined
					: expiration === "30min"
					? 0.5
					: expiration === "1hr"
					? 1
					: expiration === "1day"
					? 24
					: expiration === "7days"
					? 168
					: undefined;

			const code = await createInvite(groupId, user.uid, maxUsesValue, expirationHours);
			await loadInvites();
			toast.success("Invite created");
		} catch (error) {
			console.error("Error creating invite:", error);
			toast.error("Failed to create invite");
		} finally {
			setLoading(false);
		}
	};

	const handleCopyLink = (code: string) => {
		const link = `${window.location.origin}/invite/${code}`;
		navigator.clipboard.writeText(link);
		toast.success("Invite link copied");
	};

	const handleDownloadQR = (code: string) => {
		const canvas = document.querySelector(`#qr-${code} canvas`);
		if (!canvas) return;

		const url = (canvas as HTMLCanvasElement).toDataURL();
		const link = document.createElement("a");
		link.download = `invite-${code}.png`;
		link.href = url;
		link.click();
	};

	const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);

	const handleDeleteInvite = async (code: string) => {
		try {
			await deleteInvite(groupId, code);
			await loadInvites();
			toast.success("Invite deleted");
		} catch (error) {
			console.error("Error deleting invite:", error);
			toast.error("Failed to delete invite");
		}
	};

	const getInviteLink = (code: string) => {
		return `${window.location.origin}/invite/${code}`;
	};

	const isExpired = (invite: Invite) => {
		if (!invite.expiresAt) return false;
		return invite.expiresAt.toMillis() < Date.now();
	};

	const isMaxUsesReached = (invite: Invite) => {
		if (!invite.maxUses) return false;
		return invite.usedCount >= invite.maxUses;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Server Invites</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Create New Invite */}
					<div className="space-y-4 p-4 border rounded-lg">
						<h3 className="font-semibold">Create Invite</h3>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Max Uses</Label>
								<Select value={maxUses} onValueChange={setMaxUses}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="unlimited">Unlimited</SelectItem>
										<SelectItem value="1">1 use</SelectItem>
										<SelectItem value="5">5 uses</SelectItem>
										<SelectItem value="10">10 uses</SelectItem>
										<SelectItem value="25">25 uses</SelectItem>
										<SelectItem value="50">50 uses</SelectItem>
										<SelectItem value="100">100 uses</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label>Expiration</Label>
								<Select value={expiration} onValueChange={setExpiration}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="never">Never</SelectItem>
										<SelectItem value="30min">30 minutes</SelectItem>
										<SelectItem value="1hr">1 hour</SelectItem>
										<SelectItem value="1day">1 day</SelectItem>
										<SelectItem value="7days">7 days</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<Button onClick={handleCreateInvite} disabled={loading} className="w-full">
							<Plus className="mr-2 h-4 w-4" />
							Create Invite
						</Button>
					</div>

					{/* Active Invites */}
					<div className="space-y-4">
						<h3 className="font-semibold">Active Invites</h3>

						{invites.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								No invites yet. Create one above!
							</div>
						) : (
							<div className="space-y-4">
								{invites.map((invite) => {
									const expired = isExpired(invite);
									const maxReached = isMaxUsesReached(invite);
									const link = getInviteLink(invite.code);

									return (
										<div
											key={invite.code}
											className="p-4 border rounded-lg space-y-4">
											<div className="flex items-start gap-4">
												{/* QR Code */}
												<div className="flex-shrink-0">
													<div id={`qr-${invite.code}`}>
														<QRCodeSVG value={link} size={120} />
													</div>
												</div>

												{/* Invite Details */}
												<div className="flex-1 space-y-2">
													<div className="flex items-center gap-2">
														<code className="px-2 py-1 bg-muted rounded text-sm font-mono">
															{invite.code}
														</code>
														{(expired || maxReached) && (
															<span className="text-xs text-destructive">
																{expired ? "Expired" : "Max uses reached"}
															</span>
														)}
													</div>

													<div className="text-sm space-y-1">
														<p>
															Uses: {invite.usedCount}
															{invite.maxUses ? ` / ${invite.maxUses}` : " / ∞"}
														</p>
														{invite.expiresAt && (
															<p>
																Expires:{" "}
																{formatDistance(
																	invite.expiresAt.toDate(),
																	new Date(),
																	{ addSuffix: true }
																)}
															</p>
														)}
														{invite.createdAt && (
															<p className="text-muted-foreground">
																Created{" "}
																{formatDistance(
																	invite.createdAt.toDate(),
																	new Date(),
																	{ addSuffix: true }
																)}
															</p>
														)}
													</div>

													<div className="flex gap-2">
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleCopyLink(invite.code)}>
															<Copy className="mr-2 h-3 w-3" />
															Copy Link
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleDownloadQR(invite.code)}>
															<Download className="mr-2 h-3 w-3" />
															Download QR
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => window.open(link, "_blank")}>
															<ExternalLink className="mr-2 h-3 w-3" />
															Open
														</Button>
														<Button
															size="sm"
															variant="ghost"
															onClick={() => setShowDeleteDialog(invite.code)}>
															<Trash className="h-3 w-3" />
														</Button>
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</DialogContent>
			{showDeleteDialog && (
				<ConfirmDialog
					open={!!showDeleteDialog}
					onOpenChange={(open) => !open && setShowDeleteDialog(null)}
					title="Delete Invite"
					description="Are you sure you want to delete this invite?"
					confirmText="Delete"
					onConfirm={() => {
						if (showDeleteDialog) {
							handleDeleteInvite(showDeleteDialog);
							setShowDeleteDialog(null);
						}
					}}
					variant="destructive"
				/>
			)}
		</Dialog>
	);
}

