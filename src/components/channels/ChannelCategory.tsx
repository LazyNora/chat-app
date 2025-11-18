import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Settings, Trash } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ChannelCategory, Channel } from "@/types";
import { updateCategory, deleteCategory, toggleCategoryCollapse } from "@/services/categories";
import { createChannel } from "@/services/channels";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { ChannelItem } from "./ChannelItem";

interface ChannelCategoryProps {
	category: ChannelCategory;
	groupId: string;
	channels: Channel[];
	unreadCounts?: Record<string, number>;
	onChannelClick?: (channel: Channel) => void;
	onChannelEdit?: (channel: Channel) => void;
	onChannelSettings?: (channel: Channel) => void;
	onChannelPermissions?: (channel: Channel) => void;
	onChannelToggleMute?: (channel: Channel) => void;
}

export function ChannelCategoryComponent({
	category,
	groupId,
	channels,
	unreadCounts = {},
	onChannelClick,
	onChannelEdit,
	onChannelSettings,
	onChannelPermissions,
	onChannelToggleMute,
}: ChannelCategoryProps) {
	const [newChannelName, setNewChannelName] = useState("");
	const [newChannelType, setNewChannelType] = useState<"text" | "voice">("text");
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(category.name);
	const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false);
	const { hasPermission } = usePermissions(groupId);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: category.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const canManageChannels = hasPermission("manageChannels");
	const categoryChannels = channels.filter((ch) => ch.categoryId === category.id);

	const handleToggleCollapse = async () => {
		try {
			await toggleCategoryCollapse(groupId, category.id, !category.collapsed);
		} catch (error) {
			console.error("Error toggling category:", error);
			toast.error("Failed to toggle category");
		}
	};

	const handleCreateChannel = async () => {
		if (!newChannelName.trim()) return;

		try {
			await createChannel(groupId, newChannelName.trim(), newChannelType, undefined, category.id);
			setNewChannelName("");
			setShowCreateChannelDialog(false);
			toast.success(`#${newChannelName.trim()} created`);
		} catch (error) {
			console.error("Error creating channel:", error);
			toast.error("Failed to create channel");
		}
	};

	const handleUpdateCategory = async () => {
		if (!editName.trim()) return;

		try {
			await updateCategory(groupId, category.id, { name: editName.trim() });
			setIsEditing(false);
			toast.success("Category updated");
		} catch (error) {
			console.error("Error updating category:", error);
			toast.error("Failed to update category");
		}
	};

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const handleDeleteCategory = async () => {
		try {
			await deleteCategory(groupId, category.id);
			toast.success("Category deleted");
		} catch (error) {
			console.error("Error deleting category:", error);
			toast.error("Failed to delete category");
		}
	};

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<Collapsible open={!category.collapsed} onOpenChange={handleToggleCollapse}>
				<div className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-muted/50 rounded text-xs font-semibold text-muted-foreground uppercase group">
					<CollapsibleTrigger asChild>
						<button className="flex items-center gap-1 flex-1 text-left">
							{category.collapsed ? (
								<ChevronRight className="h-3 w-3" />
							) : (
								<ChevronDown className="h-3 w-3" />
							)}
							{isEditing ? (
								<Input
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									onBlur={handleUpdateCategory}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleUpdateCategory();
										if (e.key === "Escape") {
											setIsEditing(false);
											setEditName(category.name);
										}
									}}
									className="h-5 text-xs font-semibold"
									autoFocus
									onClick={(e) => e.stopPropagation()}
								/>
							) : (
								<span className="flex-1 text-left">{category.name}</span>
							)}
						</button>
					</CollapsibleTrigger>
					{canManageChannels && (
						<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="icon" variant="ghost" className="h-4 w-4">
										<Settings className="h-3 w-3" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem onClick={() => setIsEditing(true)}>
										Edit Category
									</DropdownMenuItem>
									<Dialog open={showCreateChannelDialog} onOpenChange={setShowCreateChannelDialog}>
										<DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
											<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
												<Plus className="mr-2 h-4 w-4" />
												Create Channel
											</DropdownMenuItem>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Create Channel</DialogTitle>
											</DialogHeader>
											<div className="space-y-4">
												<div>
													<Label>Channel Name</Label>
													<Input
														value={newChannelName}
														onChange={(e) => setNewChannelName(e.target.value)}
														placeholder="new-channel"
														onKeyDown={(e) => {
															if (e.key === "Enter") handleCreateChannel();
														}}
													/>
												</div>
												<div>
													<Label>Channel Type</Label>
													<select
														value={newChannelType}
														onChange={(e) =>
															setNewChannelType(e.target.value as "text" | "voice")
														}
														className="w-full p-2 border rounded">
														<option value="text">Text Channel</option>
														<option value="voice">Voice Channel</option>
													</select>
												</div>
												<div className="flex gap-2">
													<Button variant="outline" onClick={() => setShowCreateChannelDialog(false)} className="flex-1">
														Cancel
													</Button>
													<Button onClick={handleCreateChannel} className="flex-1">
														Create
													</Button>
												</div>
											</div>
										</DialogContent>
									</Dialog>
								<DropdownMenuItem
									onClick={() => setShowDeleteDialog(true)}
									className="text-destructive">
									<Trash className="mr-2 h-4 w-4" />
									Delete Category
								</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}
				</div>
				<CollapsibleContent>
					<div className="space-y-0.5 pl-4">
						{categoryChannels.map((channel) => (
							<ChannelItem
								key={channel.id}
								channel={channel}
								groupId={groupId}
								unreadCount={unreadCounts[channel.id] || 0}
								onClick={() => onChannelClick?.(channel)}
								onEdit={() => onChannelEdit?.(channel)}
								onSettings={() => onChannelSettings?.(channel)}
								onPermissions={() => onChannelPermissions?.(channel)}
								onToggleMute={() => onChannelToggleMute?.(channel)}
							/>
						))}
					</div>
				</CollapsibleContent>
			</Collapsible>
			<ConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				title="Delete Category"
				description={`Delete category "${category.name}"? Channels will be moved to uncategorized.`}
				confirmText="Delete"
				cancelText="Cancel"
				onConfirm={handleDeleteCategory}
				variant="destructive"
			/>
		</div>
	);
}

