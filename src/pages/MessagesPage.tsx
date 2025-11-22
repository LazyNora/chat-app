import { useState, useEffect } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { getUserDMConversations, getOrCreateDMConversation } from "@/services/friends";
import { getUserProfile } from "@/services/auth";
import {
	getUserFriends,
	getPendingRequests,
	sendFriendRequest,
	acceptFriendRequest,
	removeFriend,
} from "@/services/friends";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, UserPlus, UserCheck, UserX, Search } from "lucide-react";
import { toast } from "sonner";
import type { DirectMessageConversation, Friendship, User, Message } from "@/types";
import { GroupList } from "@/components/groups/GroupList";
import { UserProfile } from "@/components/user/UserProfile";
import { DMMessageList } from "@/components/chat/DMMessageList";
import { DMMessageInput } from "@/components/chat/DMMessageInput";
import { usePresenceStore } from "@/stores/presenceStore";
import { cn } from "@/lib/utils";

export function MessagesPage() {
	const { conversationId } = useParams<{ conversationId?: string }>();
	const { user, userProfile } = useAuthStore();
	const navigate = useNavigate();
	const { getOnlineStatus } = usePresenceStore();
	const [activeTab, setActiveTab] = useState<"messages" | "friends">("messages");

	// DM state
	const [conversations, setConversations] = useState<DirectMessageConversation[]>([]);
	const [loadingMessages, setLoadingMessages] = useState(true);
	const [selectedConversation, setSelectedConversation] =
		useState<DirectMessageConversation | null>(null);
	const [replyingTo, setReplyingTo] = useState<Message | null>(null);

	// Friends state
	const [friends, setFriends] = useState<Friendship[]>([]);
	const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
	const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
	const [friendProfiles, setFriendProfiles] = useState<Record<string, User>>({});
	const [loadingFriends, setLoadingFriends] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResult, setSearchResult] = useState<User | null>(null);
	const [searching, setSearching] = useState(false);

	// Load DM conversations
	useEffect(() => {
		if (!user) return;

		const loadConversations = async () => {
			setLoadingMessages(true);
			try {
				const convos = await getUserDMConversations(user.uid);
				setConversations(convos);

				// If conversationId is provided, find and set it
				if (conversationId) {
					const found = convos.find((c) => c.id === conversationId);
					if (found) {
						setSelectedConversation(found);
						setActiveTab("messages");
					}
				}
			} catch (error) {
				console.error("Error loading conversations:", error);
				toast.error("Failed to load conversations");
			} finally {
				setLoadingMessages(false);
			}
		};

		loadConversations();
	}, [user, conversationId]);

	// Load friends
	useEffect(() => {
		if (!user || activeTab !== "friends") return;

		const loadData = async () => {
			setLoadingFriends(true);
			try {
				const [friendsList, pendingList] = await Promise.all([
					getUserFriends(user.uid),
					getPendingRequests(user.uid),
				]);

				setFriends(friendsList);
				setPendingSent(pendingList.filter((f) => f.requesterId === user.uid));
				setPendingReceived(pendingList.filter((f) => f.requesterId !== user.uid));

				// Load all friend profiles
				const allFriendIds = new Set<string>();
				friendsList.forEach((f) => {
					const otherId = f.userIds.find((id) => id !== user.uid);
					if (otherId) allFriendIds.add(otherId);
				});
				pendingList.forEach((f) => {
					const otherId = f.userIds.find((id) => id !== user.uid);
					if (otherId) allFriendIds.add(otherId);
				});

				const profilePromises = Array.from(allFriendIds).map(async (friendId) => {
					try {
						const profile = await getUserProfile(friendId);
						return profile ? ([friendId, profile] as const) : null;
					} catch (error) {
						console.error(`Error loading profile for ${friendId}:`, error);
						return null;
					}
				});

				const profiles = await Promise.all(profilePromises);
				const profileMap: Record<string, User> = {};
				profiles.forEach((result) => {
					if (result) {
						profileMap[result[0]] = result[1];
					}
				});
				setFriendProfiles(profileMap);
			} catch (error) {
				console.error("Error loading friends:", error);
				toast.error("Failed to load friends");
			} finally {
				setLoadingFriends(false);
			}
		};

		loadData();
	}, [user, activeTab]);

	if (!user) {
		return <Navigate to="/auth" replace />;
	}

	// Get other participant from conversation
	const getOtherParticipant = (conversation: DirectMessageConversation) => {
		const otherId = conversation.participantIds.find((id) => id !== user.uid);
		return otherId ? conversation.participantData[otherId] : null;
	};

	// Get other user ID from friendship
	const getOtherUserId = (friendship: Friendship): string => {
		return friendship.userIds.find((id) => id !== user?.uid) || "";
	};

	// Friend functions
	const handleSendFriendRequest = async (recipientId: string) => {
		if (!user) return;
		try {
			await sendFriendRequest(user.uid, recipientId);
			toast.success("Friend request sent");
			setSearchResult(null);
			setSearchQuery("");
		} catch (error: any) {
			console.error("Error sending friend request:", error);
			toast.error(error.message || "Failed to send friend request");
		}
	};

	const handleAcceptFriendRequest = async (friendshipId: string) => {
		try {
			await acceptFriendRequest(friendshipId);
			toast.success("Friend request accepted");
			// Reload data
			const [friendsList, pendingList] = await Promise.all([
				getUserFriends(user!.uid),
				getPendingRequests(user!.uid),
			]);
			setFriends(friendsList);
			setPendingReceived(pendingList.filter((f) => f.requesterId !== user!.uid));
		} catch (error: any) {
			console.error("Error accepting friend request:", error);
			toast.error(error.message || "Failed to accept friend request");
		}
	};

	const handleRemoveFriend = async (friendshipId: string) => {
		try {
			await removeFriend(friendshipId);
			toast.success("Friend removed");
			// Reload data
			const [friendsList, pendingList] = await Promise.all([
				getUserFriends(user!.uid),
				getPendingRequests(user!.uid),
			]);
			setFriends(friendsList);
			setPendingSent(pendingList.filter((f) => f.requesterId === user!.uid));
			setPendingReceived(pendingList.filter((f) => f.requesterId !== user!.uid));
		} catch (error: any) {
			console.error("Error removing friend:", error);
			toast.error(error.message || "Failed to remove friend");
		}
	};

	const handleOpenDM = async (friendId: string) => {
		if (!user || !userProfile) return;
		try {
			const friendProfile = await getUserProfile(friendId);
			if (!friendProfile) {
				toast.error("Friend profile not found");
				return;
			}
			const conversationId = await getOrCreateDMConversation(
				user.uid,
				userProfile.displayName,
				userProfile.photoURL,
				friendId,
				friendProfile.displayName,
				friendProfile.photoURL
			);
			setActiveTab("messages");
			navigate(`/messages/${conversationId}`);
		} catch (error: any) {
			console.error("Error opening DM:", error);
			toast.error(error.message || "Failed to open DM");
		}
	};

	const handleSearch = async () => {
		if (!searchQuery.trim() || !user) return;
		setSearching(true);
		setSearchResult(null);
		try {
			toast.info("User search functionality needs backend implementation");
		} catch (error) {
			console.error("Error searching user:", error);
			toast.error("Failed to search user");
		} finally {
			setSearching(false);
		}
	};

	return (
		<div className="h-screen flex bg-background">
			<GroupList />

			<div className="flex-1 flex flex-col">
				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as "messages" | "friends")}
					className="flex-1 flex flex-col min-h-0">
					<div className="p-4 border-b">
						<TabsList>
							<TabsTrigger value="messages">Direct Messages</TabsTrigger>
							<TabsTrigger value="friends">Friends</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="messages" className="flex-1 flex min-h-0">
						{/* Conversations List */}
						<div className="w-[280px] border-r bg-muted/30 flex flex-col">
							<div className="p-4 border-b">
								<h2 className="text-lg font-semibold">Direct Messages</h2>
							</div>

							{loadingMessages ? (
								<div className="flex-1 flex items-center justify-center">
									<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
								</div>
							) : conversations.length === 0 ? (
								<div className="flex-1 flex items-center justify-center p-4">
									<div className="text-center space-y-4">
										<MessageSquare className="h-16 w-16 mx-auto text-muted-foreground" />
										<p className="text-muted-foreground">No direct messages yet</p>
										<p className="text-sm text-muted-foreground">
											Start a conversation from a friend's profile
										</p>
									</div>
								</div>
							) : (
								<ScrollArea className="flex-1">
									<div className="p-2 space-y-1">
										{conversations.map((conversation) => {
											const otherParticipant = getOtherParticipant(conversation);
											if (!otherParticipant) return null;

											return (
												<Card
													key={conversation.id}
													className={cn(
														"p-3 cursor-pointer hover:bg-muted transition-colors",
														selectedConversation?.id === conversation.id && "bg-muted"
													)}
													onClick={() => {
														setSelectedConversation(conversation);
														navigate(`/messages/${conversation.id}`);
													}}>
													<div className="flex items-center gap-3">
														<Avatar className="h-10 w-10">
															<AvatarImage
																src={otherParticipant.photoURL || undefined}
																referrerPolicy="no-referrer"
															/>
															<AvatarFallback>
																{otherParticipant.displayName.charAt(0).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2">
																<span className="font-semibold text-sm truncate">
																	{otherParticipant.displayName}
																</span>
																{conversation.unreadCount[user.uid] > 0 && (
																	<Badge variant="default" className="text-xs">
																		{conversation.unreadCount[user.uid]}
																	</Badge>
																)}
															</div>
															{conversation.lastMessage && (
																<p className="text-xs text-muted-foreground truncate">
																	{conversation.lastMessage}
																</p>
															)}
														</div>
													</div>
												</Card>
											);
										})}
									</div>
								</ScrollArea>
							)}
						</div>

						{/* Chat View */}
						<div className="flex-1 flex flex-col">
							{selectedConversation ? (
								<>
									{/* DM Header */}
									<div className="h-12 border-b flex items-center px-4 bg-muted/30">
										<div className="flex items-center gap-3">
											<Avatar className="h-8 w-8">
												<AvatarImage
													src={getOtherParticipant(selectedConversation)?.photoURL || undefined}
													referrerPolicy="no-referrer"
												/>
												<AvatarFallback>
													{getOtherParticipant(selectedConversation)
														?.displayName.charAt(0)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div>
												<span className="font-semibold text-sm">
													{getOtherParticipant(selectedConversation)?.displayName}
												</span>
												{(() => {
													const otherId = selectedConversation.participantIds.find(
														(id) => id !== user?.uid
													);
													if (!otherId) return null;
													const status = getOnlineStatus(otherId);
													return (
														<p className="text-xs text-muted-foreground">
															{status?.status === "online"
																? "Online"
																: status?.status === "idle"
																? "Idle"
																: status?.status === "dnd"
																? "Do Not Disturb"
																: "Offline"}
														</p>
													);
												})()}
											</div>
										</div>
									</div>

									{/* DM Messages */}
									<DMMessageList
										conversationId={selectedConversation.id}
										replyingTo={replyingTo}
										onCancelReply={() => setReplyingTo(null)}
										onReply={(message) => setReplyingTo(message)}
									/>

									{/* DM Input */}
									<DMMessageInput
										conversationId={selectedConversation.id}
										replyingTo={replyingTo}
										onCancelReply={() => setReplyingTo(null)}
									/>
								</>
							) : (
								<div className="flex-1 flex items-center justify-center">
									<div className="text-center space-y-4">
										<MessageSquare className="h-16 w-16 mx-auto text-muted-foreground" />
										<p className="text-muted-foreground">Select a conversation to start chatting</p>
									</div>
								</div>
							)}
						</div>
					</TabsContent>

					<TabsContent value="friends" className="flex-1 flex flex-col min-h-0 p-6">
						{loadingFriends ? (
							<div className="flex-1 flex items-center justify-center">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						) : (
							<ScrollArea className="flex-1">
								<Tabs defaultValue="friends" className="w-full">
									<TabsList>
										<TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
										<TabsTrigger value="pending">
											Pending ({pendingReceived.length + pendingSent.length})
										</TabsTrigger>
										<TabsTrigger value="add">Add Friend</TabsTrigger>
									</TabsList>

									<TabsContent value="friends" className="mt-4">
										{friends.length === 0 ? (
											<div className="flex items-center justify-center py-12">
												<div className="text-center space-y-4">
													<UserPlus className="h-16 w-16 mx-auto text-muted-foreground" />
													<p className="text-muted-foreground">No friends yet</p>
												</div>
											</div>
										) : (
											<div className="space-y-2">
												{friends.map((friendship) => {
													const friendId = getOtherUserId(friendship);
													const friendProfile = friendProfiles[friendId];
													if (!friendProfile) return null;

													const status = getOnlineStatus(friendId);

													return (
														<Card key={friendship.id} className="p-4">
															<div className="flex items-center justify-between">
																<div className="flex items-center gap-4">
																	<Avatar className="h-12 w-12">
																		<AvatarImage
																			src={friendProfile.photoURL || undefined}
																			referrerPolicy="no-referrer"
																		/>
																		<AvatarFallback>
																			{friendProfile.displayName.charAt(0).toUpperCase()}
																		</AvatarFallback>
																	</Avatar>
																	<div>
																		<div className="flex items-center gap-2">
																			<span className="font-semibold">
																				{friendProfile.displayName}
																			</span>
																			{status && (
																				<Badge
																					variant={
																						status.status === "online"
																							? "default"
																							: status.status === "dnd"
																							? "destructive"
																							: "secondary"
																					}>
																					{status.status}
																				</Badge>
																			)}
																		</div>
																		{friendProfile.customStatus && (
																			<p className="text-sm text-muted-foreground">
																				{friendProfile.customStatusEmoji}{" "}
																				{friendProfile.customStatus}
																			</p>
																		)}
																	</div>
																</div>
																<div className="flex items-center gap-2">
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() => handleOpenDM(friendId)}>
																		Message
																	</Button>
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() => handleRemoveFriend(friendship.id)}>
																		<UserX className="h-4 w-4" />
																	</Button>
																</div>
															</div>
														</Card>
													);
												})}
											</div>
										)}
									</TabsContent>

									<TabsContent value="pending" className="mt-4">
										{pendingReceived.length === 0 && pendingSent.length === 0 ? (
											<div className="flex items-center justify-center py-12">
												<p className="text-muted-foreground">No pending requests</p>
											</div>
										) : (
											<div className="space-y-4">
												{pendingReceived.length > 0 && (
													<div>
														<h3 className="text-sm font-semibold mb-2">Received</h3>
														<div className="space-y-2">
															{pendingReceived.map((friendship) => {
																const friendId = getOtherUserId(friendship);
																const friendProfile = friendProfiles[friendId];
																if (!friendProfile) return null;

																return (
																	<Card key={friendship.id} className="p-4">
																		<div className="flex items-center justify-between">
																			<div className="flex items-center gap-4">
																				<Avatar className="h-12 w-12">
																					<AvatarImage
																						src={friendProfile.photoURL || undefined}
																						referrerPolicy="no-referrer"
																					/>
																					<AvatarFallback>
																						{friendProfile.displayName.charAt(0).toUpperCase()}
																					</AvatarFallback>
																				</Avatar>
																				<div>
																					<span className="font-semibold">
																						{friendProfile.displayName}
																					</span>
																					<p className="text-sm text-muted-foreground">
																						wants to be your friend
																					</p>
																				</div>
																			</div>
																			<div className="flex items-center gap-2">
																				<Button
																					variant="outline"
																					size="sm"
																					onClick={() => handleAcceptFriendRequest(friendship.id)}>
																					<UserCheck className="h-4 w-4 mr-2" />
																					Accept
																				</Button>
																				<Button
																					variant="ghost"
																					size="sm"
																					onClick={() => handleRemoveFriend(friendship.id)}>
																					<UserX className="h-4 w-4" />
																				</Button>
																			</div>
																		</div>
																	</Card>
																);
															})}
														</div>
													</div>
												)}

												{pendingSent.length > 0 && (
													<div>
														<h3 className="text-sm font-semibold mb-2">Sent</h3>
														<div className="space-y-2">
															{pendingSent.map((friendship) => {
																const friendId = getOtherUserId(friendship);
																const friendProfile = friendProfiles[friendId];
																if (!friendProfile) return null;

																return (
																	<Card key={friendship.id} className="p-4">
																		<div className="flex items-center justify-between">
																			<div className="flex items-center gap-4">
																				<Avatar className="h-12 w-12">
																					<AvatarImage
																						src={friendProfile.photoURL || undefined}
																						referrerPolicy="no-referrer"
																					/>
																					<AvatarFallback>
																						{friendProfile.displayName.charAt(0).toUpperCase()}
																					</AvatarFallback>
																				</Avatar>
																				<div>
																					<span className="font-semibold">
																						{friendProfile.displayName}
																					</span>
																					<p className="text-sm text-muted-foreground">Pending</p>
																				</div>
																			</div>
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={() => handleRemoveFriend(friendship.id)}>
																				Cancel
																			</Button>
																		</div>
																	</Card>
																);
															})}
														</div>
													</div>
												)}
											</div>
										)}
									</TabsContent>

									<TabsContent value="add" className="mt-4">
										<Card>
											<CardHeader>
												<CardTitle>Add Friend</CardTitle>
												<CardDescription>
													Search for users by email to add as friends
												</CardDescription>
											</CardHeader>
											<CardContent className="space-y-4">
												<div className="flex gap-2">
													<Input
														placeholder="Enter email address"
														value={searchQuery}
														onChange={(e) => setSearchQuery(e.target.value)}
														onKeyDown={(e) => {
															if (e.key === "Enter") {
																handleSearch();
															}
														}}
													/>
													<Button onClick={handleSearch} disabled={searching}>
														{searching ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															<Search className="h-4 w-4" />
														)}
													</Button>
												</div>

												{searchResult && (
													<Card className="p-4">
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-4">
																<Avatar className="h-12 w-12">
																	<AvatarImage
																		src={searchResult.photoURL || undefined}
																		referrerPolicy="no-referrer"
																	/>
																	<AvatarFallback>
																		{searchResult.displayName.charAt(0).toUpperCase()}
																	</AvatarFallback>
																</Avatar>
																<div>
																	<span className="font-semibold">{searchResult.displayName}</span>
																	<p className="text-sm text-muted-foreground">
																		{searchResult.email}
																	</p>
																</div>
															</div>
															<Button
																size="sm"
																onClick={() => handleSendFriendRequest(searchResult.uid)}>
																<UserPlus className="h-4 w-4 mr-2" />
																Add Friend
															</Button>
														</div>
													</Card>
												)}
											</CardContent>
										</Card>
									</TabsContent>
								</Tabs>
							</ScrollArea>
						)}
					</TabsContent>
				</Tabs>

				{/* Sticky User Profile at bottom */}
				<div className="border-t bg-muted/30">
					<UserProfile />
				</div>
			</div>
		</div>
	);
}
