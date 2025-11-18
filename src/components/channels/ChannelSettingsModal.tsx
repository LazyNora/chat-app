import { useState, useEffect } from "react";
import { Trash, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Channel, ChannelSettings } from "@/types";
import {
	updateChannel,
	updateChannelSettings,
	deleteChannel,
} from "@/services/channels";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { ConfirmDialog } from "../ui/ConfirmDialog";

interface ChannelSettingsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	channel: Channel | null;
	groupId: string;
	onDelete?: () => void;
}

export function ChannelSettingsModal({
	open,
	onOpenChange,
	channel,
	groupId,
	onDelete,
}: ChannelSettingsModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [cooldown, setCooldown] = useState<number | null>(null);
	const [maxFileSize, setMaxFileSize] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const { hasPermission } = usePermissions(groupId);

	useEffect(() => {
		if (channel) {
			setName(channel.name);
			setDescription(channel.description || "");
			setCooldown(channel.settings.cooldown);
			setMaxFileSize(channel.settings.maxFileSize);
		}
	}, [channel]);

	const canManageChannels = hasPermission("manageChannels");

	const handleSave = async () => {
		if (!channel) return;

		setLoading(true);

		try {
			await updateChannel(groupId, channel.id, {
				name: name.trim(),
				description: description.trim() || null,
			});

			await updateChannelSettings(groupId, channel.id, {
				cooldown,
				maxFileSize,
			});

			toast.success("Channel settings updated");
			onOpenChange(false);
		} catch (error) {
			console.error("Error updating channel:", error);
			toast.error("Failed to update channel settings");
		} finally {
			setLoading(false);
		}
	};

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const handleDelete = async () => {
		if (!channel) return;
		setLoading(true);

		try {
			await deleteChannel(groupId, channel.id);
			toast.success("Channel deleted");
			onOpenChange(false);
			onDelete?.();
		} catch (error) {
			console.error("Error deleting channel:", error);
			toast.error("Failed to delete channel");
		} finally {
			setLoading(false);
		}
	};

	if (!channel) return null;

	const cooldownHours = cooldown ? cooldown / (60 * 60 * 1000) : 0;
	const maxFileSizeMB = maxFileSize ? maxFileSize / (1024 * 1024) : null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Channel Settings - #{channel.name}</DialogTitle>
				</DialogHeader>

				<Tabs defaultValue="overview" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="permissions">Permissions</TabsTrigger>
						<TabsTrigger value="advanced">Advanced</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="space-y-4">
						<div>
							<Label>Channel Name</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="channel-name"
								disabled={!canManageChannels}
							/>
						</div>

						<div>
							<Label>Description</Label>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="What is this channel about?"
								rows={3}
								disabled={!canManageChannels}
							/>
						</div>

						<div>
							<Label>Channel Type</Label>
							<Select value={channel.type} disabled>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="text">Text Channel</SelectItem>
									<SelectItem value="voice">Voice Channel</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground mt-1">
								Channel type cannot be changed after creation
							</p>
						</div>
					</TabsContent>

					<TabsContent value="permissions" className="space-y-4">
						<div className="text-sm text-muted-foreground">
							Channel permission overrides are coming soon. For now, permissions are
							managed at the group level.
						</div>
					</TabsContent>

					<TabsContent value="advanced" className="space-y-4">
						<div>
							<Label>Slowmode Cooldown</Label>
							<div className="space-y-2">
								<Slider
									value={[cooldownHours]}
									onValueChange={([value]) =>
										setCooldown(value > 0 ? value * 60 * 60 * 1000 : null)
									}
									max={6}
									min={0}
									step={0.5}
									disabled={!canManageChannels}
								/>
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>No cooldown</span>
									<span>{cooldownHours.toFixed(1)} hours</span>
									<span>6 hours</span>
								</div>
								<p className="text-xs text-muted-foreground">
									Users must wait between messages in this channel
								</p>
							</div>
						</div>

						<div>
							<Label>Max File Size</Label>
							<Select
								value={maxFileSizeMB?.toString() || "default"}
								onValueChange={(value) =>
									setMaxFileSize(
										value === "default" ? null : parseInt(value) * 1024 * 1024
									)
								}
								disabled={!canManageChannels}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="default">Use group default (50MB)</SelectItem>
									<SelectItem value="10">10 MB</SelectItem>
									<SelectItem value="25">25 MB</SelectItem>
									<SelectItem value="50">50 MB</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground mt-1">
								Maximum file size for uploads in this channel
							</p>
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter className="flex justify-between">
					{canManageChannels && (
						<Button
							variant="destructive"
							onClick={() => setShowDeleteDialog(true)}
							disabled={loading}>
							<Trash className="mr-2 h-4 w-4" />
							Delete Channel
						</Button>
					)}
					<div className="flex gap-2 ml-auto">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						{canManageChannels && (
							<Button onClick={handleSave} disabled={loading}>
								<Save className="mr-2 h-4 w-4" />
								Save Changes
							</Button>
						)}
					</div>
			</DialogFooter>
		</DialogContent>
		<ConfirmDialog
			open={showDeleteDialog}
			onOpenChange={setShowDeleteDialog}
			title="Delete Channel"
			description={`Are you sure you want to delete #${channel.name}? This action cannot be undone.`}
			confirmText="Delete"
			onConfirm={handleDelete}
			variant="destructive"
		/>
	</Dialog>
	);
}

