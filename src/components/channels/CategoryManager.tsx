import { useState, useEffect } from "react";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ChannelCategoryComponent } from "./ChannelCategory";
import { getGroupCategories, createCategory, reorderCategories } from "@/services/categories";
import { getGroupChannels } from "@/services/channels";
import type { ChannelCategory, Channel } from "@/types";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { ChannelItem } from "./ChannelItem";

interface CategoryManagerProps {
	groupId: string;
	unreadCounts?: Record<string, number>;
	onChannelClick?: (channel: Channel) => void;
	onChannelEdit?: (channel: Channel) => void;
	onChannelSettings?: (channel: Channel) => void;
	onChannelPermissions?: (channel: Channel) => void;
	onChannelToggleMute?: (channel: Channel) => void;
}

export function CategoryManager({
	groupId,
	unreadCounts = {},
	onChannelClick,
	onChannelEdit,
	onChannelSettings,
	onChannelPermissions,
	onChannelToggleMute,
}: CategoryManagerProps) {
	const [categories, setCategories] = useState<ChannelCategory[]>([]);
	const [channels, setChannels] = useState<Channel[]>([]);
	const [loading, setLoading] = useState(true);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const { hasPermission } = usePermissions(groupId);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	useEffect(() => {
		loadData();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [groupId]);

	const loadData = async () => {
		try {
			setLoading(true);
			const [categoriesData, channelsData] = await Promise.all([
				getGroupCategories(groupId),
				getGroupChannels(groupId),
			]);
			setCategories(categoriesData);
			setChannels(channelsData);
		} catch (error) {
			console.error("Error loading categories:", error);
			toast.error("Failed to load categories");
		} finally {
			setLoading(false);
		}
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		const oldIndex = categories.findIndex((c) => c.id === active.id);
		const newIndex = categories.findIndex((c) => c.id === over.id);

		if (oldIndex === -1 || newIndex === -1) return;

		const newCategories = [...categories];
		const [movedCategory] = newCategories.splice(oldIndex, 1);
		newCategories.splice(newIndex, 0, movedCategory);

		// Update positions
		const updates = newCategories.map((cat, index) => ({
			id: cat.id,
			position: index,
		}));

		try {
			await reorderCategories(groupId, updates);
			setCategories(newCategories);
		} catch (error) {
			console.error("Error reordering categories:", error);
			toast.error("Failed to reorder categories");
			loadData(); // Reload on error
		}
	};

	const handleCreateCategory = async () => {
		if (!newCategoryName.trim()) return;

		try {
			await createCategory(groupId, newCategoryName.trim());
			setNewCategoryName("");
			setShowCreateDialog(false);
			await loadData();
			toast.success("Category created");
		} catch (error) {
			console.error("Error creating category:", error);
			toast.error("Failed to create category");
		}
	};

	const canManageChannels = hasPermission("manageChannels");
	const uncategorizedChannels = channels.filter((ch) => !ch.categoryId);

	if (loading) {
		return (
			<div className="p-4 flex flex-col items-center justify-center gap-4">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<Button variant="outline" size="sm" onClick={() => window.location.reload()}>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-1">
			{canManageChannels && (
				<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
					<DialogTrigger asChild>
						<Button variant="ghost" size="sm" className="w-full justify-start text-xs">
							<Plus className="h-3 w-3 mr-1" />
							Create Category
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create Category</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<label className="text-sm font-medium">Category Name</label>
								<Input
									value={newCategoryName}
									onChange={(e) => setNewCategoryName(e.target.value)}
									placeholder="Category name"
									onKeyDown={(e) => {
										if (e.key === "Enter") handleCreateCategory();
									}}
								/>
							</div>
							<Button onClick={handleCreateCategory} className="w-full">
								Create
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}>
				<SortableContext
					items={categories.map((c) => c.id)}
					strategy={verticalListSortingStrategy}>
					{categories.map((category) => (
						<ChannelCategoryComponent
							key={category.id}
							category={category}
							groupId={groupId}
							channels={channels}
							unreadCounts={unreadCounts}
							onChannelClick={onChannelClick}
							onChannelEdit={onChannelEdit}
							onChannelSettings={onChannelSettings}
							onChannelPermissions={onChannelPermissions}
							onChannelToggleMute={onChannelToggleMute}
						/>
					))}
				</SortableContext>
			</DndContext>

			{uncategorizedChannels.length > 0 && (
				<div className="space-y-0.5">
					{uncategorizedChannels.map((channel) => (
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
			)}
		</div>
	);
}

