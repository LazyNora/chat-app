import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { GroupList } from "@/components/groups/GroupList";
import { CategoryManager } from "@/components/channels/CategoryManager";
import { MemberSidebar } from "@/components/groups/MemberSidebar";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { PinnedMessageBanner } from "@/components/chat/PinnedMessageBanner";
import { PinnedMessagesPanel } from "@/components/chat/PinnedMessagesPanel";
import { ThreadPanel } from "@/components/chat/ThreadPanel";
import { ChannelSettingsModal } from "@/components/channels/ChannelSettingsModal";
import { InviteModal } from "@/components/groups/InviteModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchModal } from "@/components/search/SearchModal";
import { KeyboardShortcutsModal } from "@/components/shortcuts/KeyboardShortcutsModal";
import { CreateThreadModal } from "@/components/chat/CreateThreadModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useLayoutStorage } from "@/hooks/useLayoutStorage";
import { useGroupStore } from "@/stores/groupStore";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useAuthStore } from "@/stores/authStore";
import { getPinnedMessages } from "@/services/messages";
import { getChannel, getGroupChannels } from "@/services/channels";
import { getGroup } from "@/services/groups";
import type { Channel, Message, Group } from "@/types";
import { Button } from "@/components/ui/button";
import { Hash, Settings, UserPlus, Search, HelpCircle, Users, Plus, FolderPlus, Mic } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { createChannel } from "@/services/channels";
import { createCategory } from "@/services/categories";
import { usePermissions } from "@/hooks/usePermissions";

export function GroupPage() {
	const { groupId } = useParams<{ groupId: string }>();
	const { user } = useAuthStore();
	const {
		selectedChannelId,
		setSelectedChannel: setSelectedChannelId,
		setSelectedGroupId,
		channels,
		setChannels,
	} = useGroupStore();
	const [showPinnedPanel, setShowPinnedPanel] = useState(false);
	const [showThreadPanel, setShowThreadPanel] = useState(false);
	const [showChannelSettings, setShowChannelSettings] = useState(false);
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [showSearchModal, setShowSearchModal] = useState(false);
	const [showShortcutsModal, setShowShortcutsModal] = useState(false);
	const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
	const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
	const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
	const [replyingTo, setReplyingTo] = useState<Message | null>(null);
	const [showCreateThreadModal, setShowCreateThreadModal] = useState(false);
	const [threadMessage, setThreadMessage] = useState<Message | null>(null);
	const [group, setGroup] = useState<Group | null>(null);
	const [loading, setLoading] = useState(true);
	const [showThreadFullView, setShowThreadFullView] = useState(false);
	const { config: layoutConfig, updateConfig: updateLayoutConfig } = useLayoutStorage();
	const { hasPermission } = usePermissions(groupId || null);
	const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
	const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [newChannelName, setNewChannelName] = useState("");
	const [newChannelType, setNewChannelType] = useState<"text" | "voice">("text");

	// Get unread counts for channels
	const unreadCounts = useUnreadCounts(groupId || null, channels);

	// Load group and channels
	useEffect(() => {
		if (!groupId) return;

		const loadGroupData = async () => {
			try {
				setLoading(true);
				const [groupData, channelsData] = await Promise.all([
					getGroup(groupId),
					getGroupChannels(groupId),
				]);
				setGroup(groupData);
				setChannels(channelsData);
			} catch (error) {
				console.error("Error loading group:", error);
				toast.error("Failed to load group");
			} finally {
				setLoading(false);
			}
		};

		loadGroupData();
	}, [groupId, setChannels]);

	const handleCreateCategory = async () => {
		if (!groupId || !newCategoryName.trim()) return;

		try {
			await createCategory(groupId, newCategoryName.trim());
			setNewCategoryName("");
			setShowCreateCategoryDialog(false);
			toast.success("Category created");
			// Reload channels to show new category
			const channelsData = await getGroupChannels(groupId);
			setChannels(channelsData);
		} catch (error) {
			console.error("Error creating category:", error);
			toast.error("Failed to create category");
		}
	};

	const handleCreateChannel = async () => {
		if (!groupId || !newChannelName.trim()) return;

		try {
			await createChannel(groupId, newChannelName.trim(), newChannelType);
			setNewChannelName("");
			setShowCreateChannelDialog(false);
			toast.success(`Channel #${newChannelName.trim()} created`);
			// Reload channels to show new channel
			const channelsData = await getGroupChannels(groupId);
			setChannels(channelsData);
		} catch (error) {
			console.error("Error creating channel:", error);
			toast.error("Failed to create channel");
		}
	};

	const loadChannelAndPins = async () => {
		if (!groupId || !selectedChannelId) return;

		try {
			const [channel, pins] = await Promise.all([
				getChannel(groupId, selectedChannelId),
				getPinnedMessages(groupId, selectedChannelId),
			]);
			setSelectedChannel(channel);
			setPinnedMessages(pins);
		} catch (error) {
			console.error("Error loading channel:", error);
		}
	};

	// Keyboard shortcuts
	useKeyboardShortcuts([
		{
			key: "k",
			ctrlKey: true,
			callback: () => setShowSearchModal(true),
		},
		{
			key: "/",
			ctrlKey: true,
			callback: () => setShowShortcutsModal(true),
		},
		{
			key: "Escape",
			callback: () => {
				setShowPinnedPanel(false);
				setShowThreadPanel(false);
				setShowChannelSettings(false);
				setReplyingTo(null);
			},
		},
	]);

	const handleJumpToMessage = async (
		targetGroupId: string,
		targetChannelId: string
	) => {
		if (targetGroupId !== groupId) {
			toast.error("Message is in a different group");
			return;
		}

		setSelectedChannelId(targetChannelId);
		// TODO: Scroll to message in MessageList
		toast.success("Jumped to message");
	};

	useEffect(() => {
		if (groupId) {
			setSelectedGroupId(groupId);
		}
	}, [groupId, setSelectedGroupId]);

	useEffect(() => {
		if (selectedChannelId && groupId) {
			loadChannelAndPins();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedChannelId, groupId]);

	if (!user) {
		return <Navigate to="/auth" replace />;
	}

	if (!groupId) {
		return <Navigate to="/" replace />;
	}

	if (loading) {
		return (
			<div className="h-screen flex bg-background">
				<GroupList />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (!group) {
		return (
			<div className="h-screen flex bg-background">
				<GroupList />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted-foreground">Group not found</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen flex bg-background relative">
			{/* Left: Group List (always visible) */}
			<GroupList />

			<ResizablePanelGroup direction="horizontal" className="flex-1">
				{/* Middle: Channels Sidebar */}
				<ResizablePanel
					id="channels-sidebar"
					defaultSize={layoutConfig.channelsSidebarWidth}
					minSize={180}
					maxSize={300}
					onResize={(size) => updateLayoutConfig({ channelsSidebarWidth: size })}>
					<div className="w-full border-r bg-muted/30 flex flex-col h-full">
				{/* Group Header */}
				<ContextMenu>
					<ContextMenuTrigger asChild>
						<div className="h-12 border-b flex items-center justify-between px-4 bg-muted/50 cursor-context-menu">
							<div className="flex items-center gap-2 flex-1 min-w-0">
								{group.iconURL ? (
									<Avatar className="h-6 w-6">
										<AvatarImage src={group.iconURL} />
										<AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
									</Avatar>
								) : (
									<div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
										<span className="text-xs font-semibold text-primary-foreground">
											{group.name.charAt(0).toUpperCase()}
										</span>
									</div>
								)}
								<span className="font-semibold truncate text-sm">{group.name}</span>
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6"
								onClick={() => setShowInviteModal(true)}>
								<UserPlus className="h-4 w-4" />
							</Button>
						</div>
					</ContextMenuTrigger>
					<ContextMenuContent>
						{hasPermission("manageChannels") && (
							<>
								<ContextMenuItem onClick={() => setShowCreateCategoryDialog(true)}>
									<FolderPlus className="mr-2 h-4 w-4" />
									Create Category
								</ContextMenuItem>
								<ContextMenuItem onClick={() => setShowCreateChannelDialog(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Create Channel
								</ContextMenuItem>
								<ContextMenuSeparator />
							</>
						)}
						{hasPermission("manageGroup") && (
							<ContextMenuItem onClick={() => setShowInviteModal(true)}>
								<UserPlus className="mr-2 h-4 w-4" />
								Invite People
							</ContextMenuItem>
						)}
					</ContextMenuContent>
				</ContextMenu>

				{/* Channels List */}
				<div className="flex-1 overflow-y-auto">
					<CategoryManager
						groupId={groupId}
						unreadCounts={unreadCounts}
						onChannelClick={(channel) => setSelectedChannelId(channel.id)}
						onChannelEdit={(channel) => {
							setSelectedChannel(channel);
							setShowChannelSettings(true);
						}}
						onChannelSettings={(channel) => {
							setSelectedChannel(channel);
							setShowChannelSettings(true);
						}}
					/>
				</div>
				</div>
				</ResizablePanel>

				<ResizableHandle />

				{/* Main Content Area */}
				<ResizablePanel
					id="main-content"
					defaultSize={showThreadPanel || showPinnedPanel ? 50 : 100}
					minSize={40}>
					<div className="flex-1 flex flex-col h-full">
				{/* Top Bar */}
				<div className="h-12 border-b flex items-center justify-between px-4 bg-muted/30">
					<div className="flex items-center gap-2">
						{selectedChannel ? (
							<>
								<Hash className="h-5 w-5 text-muted-foreground" />
								<span className="font-semibold">{selectedChannel.name}</span>
								{selectedChannel.description && (
									<span className="text-sm text-muted-foreground">
										• {selectedChannel.description}
									</span>
								)}
							</>
						) : (
							<span className="text-muted-foreground">Select a channel</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						{selectedChannel && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setShowChannelSettings(true)}>
								<Settings className="h-5 w-5" />
							</Button>
						)}
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setShowSearchModal(true)}>
							<Search className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setShowShortcutsModal(true)}>
							<HelpCircle className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => updateLayoutConfig({ memberSidebarVisible: !layoutConfig.memberSidebarVisible })}>
							<Users className="h-5 w-5" />
						</Button>
					</div>
				</div>

				{/* Pinned Message Banner */}
				{selectedChannelId && groupId && (
					<PinnedMessageBanner
						groupId={groupId}
						channelId={selectedChannelId}
						onOpenPanel={() => setShowPinnedPanel(true)}
					/>
				)}

				{/* Message Area with Resizable Panels */}
				<ResizablePanelGroup direction="horizontal" className="flex-1">
					{/* Main Chat Area */}
					<ResizablePanel
						id="chat-area"
						defaultSize={showThreadPanel || showPinnedPanel ? 60 : 100}
						minSize={30}
						className="flex-1">
						<div className="flex-1 flex flex-col h-full">
							{selectedChannelId && groupId ? (
								<>
									<MessageList
										groupId={groupId}
										channelId={selectedChannelId}
										onReply={(message) => setReplyingTo(message)}
										onCreateThread={(message) => {
											setThreadMessage(message);
											setShowCreateThreadModal(true);
										}}
										onOpenThread={(threadId) => {
											setSelectedThreadId(threadId);
											setShowThreadPanel(true);
										}}
									/>
									{/* Create Thread Handler */}
									{threadMessage && (
										<CreateThreadModal
											open={showCreateThreadModal}
											onOpenChange={setShowCreateThreadModal}
											message={threadMessage}
											groupId={groupId}
											channelId={selectedChannelId}
											onThreadCreated={(threadId) => {
												setSelectedThreadId(threadId);
												setShowThreadPanel(true);
												setThreadMessage(null);
											}}
										/>
									)}
									<MessageInput
										groupId={groupId}
										channelId={selectedChannelId}
										replyingTo={replyingTo}
										onCancelReply={() => setReplyingTo(null)}
									/>
								</>
							) : (
								<div className="h-full flex items-center justify-center">
									<div className="text-center space-y-4 max-w-md">
										<h2 className="text-2xl font-semibold">Welcome!</h2>
										<p className="text-muted-foreground">
											Select a channel from the sidebar to start chatting
										</p>
									</div>
								</div>
							)}
						</div>
					</ResizablePanel>

					{/* Thread Panel */}
					{showThreadPanel && selectedThreadId && selectedChannelId && groupId && (
						<>
							<ResizableHandle />
							<ResizablePanel
								id="thread-panel"
								defaultSize={400}
								minSize={300}
								maxSize={600}
								onResize={(size) => updateLayoutConfig({ threadPanelWidth: size })}>
								<ThreadPanel
									groupId={groupId}
									channelId={selectedChannelId}
									threadId={selectedThreadId}
									onClose={() => {
										setShowThreadPanel(false);
										setSelectedThreadId(null);
									}}
									onFullView={() => setShowThreadFullView(true)}
								/>
							</ResizablePanel>
						</>
					)}

					{/* Pinned Messages Panel */}
					{showPinnedPanel && selectedChannelId && groupId && (
						<>
							<ResizableHandle />
							<ResizablePanel
								id="pinned-panel"
								defaultSize={400}
								minSize={300}
								maxSize={600}
								onResize={(size) => updateLayoutConfig({ pinnedPanelWidth: size })}>
								<PinnedMessagesPanel
									groupId={groupId}
									channelId={selectedChannelId}
									onClose={() => setShowPinnedPanel(false)}
									onJumpToMessage={() => {
										// TODO: Implement jump to message
										toast.info("Jump to message feature coming soon");
									}}
								/>
							</ResizablePanel>
						</>
					)}
				</ResizablePanelGroup>
				</div>
				</ResizablePanel>

				{/* Right Sidebar: Members (toggleable, not resizable) */}
				{groupId && layoutConfig.memberSidebarVisible && (
					<>
						<div className="w-60 border-l bg-muted/30">
							<MemberSidebar groupId={groupId} />
						</div>
					</>
				)}
			</ResizablePanelGroup>

			{/* Modals */}
			{selectedChannel && (
				<ChannelSettingsModal
					open={showChannelSettings}
					onOpenChange={setShowChannelSettings}
					channel={selectedChannel}
					groupId={groupId}
					onDelete={() => {
						setSelectedChannelId(null);
						setSelectedChannel(null);
					}}
				/>
			)}

			<InviteModal
				open={showInviteModal}
				onOpenChange={setShowInviteModal}
				groupId={groupId}
			/>

			{/* Create Category Dialog */}
			<Dialog open={showCreateCategoryDialog} onOpenChange={setShowCreateCategoryDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Category</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Category Name</Label>
							<Input
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
								placeholder="Category name"
								onKeyDown={(e) => {
									if (e.key === "Enter") handleCreateCategory();
									if (e.key === "Escape") setShowCreateCategoryDialog(false);
								}}
								autoFocus
							/>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setShowCreateCategoryDialog(false)} className="flex-1">
								Cancel
							</Button>
							<Button onClick={handleCreateCategory} className="flex-1" disabled={!newCategoryName.trim()}>
								Create
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Create Channel Dialog */}
			<Dialog open={showCreateChannelDialog} onOpenChange={setShowCreateChannelDialog}>
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
									if (e.key === "Escape") setShowCreateChannelDialog(false);
								}}
								autoFocus
							/>
						</div>
						<div>
							<Label>Channel Type</Label>
							<select
								value={newChannelType}
								onChange={(e) => setNewChannelType(e.target.value as "text" | "voice")}
								className="w-full p-2 border rounded">
								<option value="text">Text Channel</option>
								<option value="voice">Voice Channel</option>
							</select>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setShowCreateChannelDialog(false)} className="flex-1">
								Cancel
							</Button>
							<Button onClick={handleCreateChannel} className="flex-1" disabled={!newChannelName.trim()}>
								Create
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<SearchModal
				open={showSearchModal}
				onOpenChange={setShowSearchModal}
				onJumpToMessage={handleJumpToMessage}
			/>

			<KeyboardShortcutsModal
				open={showShortcutsModal}
				onOpenChange={setShowShortcutsModal}
			/>

			{/* Sticky User Profile Overlay (Bottom Left) */}
			{user && (
				<div className="absolute bottom-0 left-0 w-[calc(64px+240px)] bg-muted/95 border-t border-r flex items-center justify-between px-2 py-1.5 z-50">
					<div className="flex items-center gap-2 flex-1 min-w-0">
						<Avatar className="h-8 w-8">
							<AvatarImage src={user.photoURL || undefined} />
							<AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium truncate">{user.displayName || "User"}</p>
							<p className="text-xs text-muted-foreground truncate">Online</p>
						</div>
					</div>
					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<Mic className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<Settings className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

