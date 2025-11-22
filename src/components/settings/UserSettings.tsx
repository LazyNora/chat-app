import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
	updateUserProfile,
	uploadProfilePicture,
	updateUserSettings,
	updateCustomStatus,
	updateUserStatus,
} from "@/services/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Save, Loader2, ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { UserSettings } from "@/types";
import { updateUserStatus as updatePusherStatus } from "@/services/pusher";
import { GroupList } from "@/components/groups/GroupList";
import { UserProfile } from "@/components/user/UserProfile";

export function UserSettings() {
	const { user, userProfile, setUserProfile } = useAuthStore();
	const { setTheme } = useTheme();
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Profile state
	const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
	const [customStatus, setCustomStatus] = useState(userProfile?.customStatus || "");
	const [customStatusEmoji, setCustomStatusEmoji] = useState(userProfile?.customStatusEmoji || "");
	const [statusType, setStatusType] = useState<"online" | "idle" | "dnd" | "invisible">(
		userProfile?.statusType || "online"
	);
	const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || null);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);

	// Settings state
	const [settings, setSettings] = useState<UserSettings>(
		userProfile?.settings || {
			notifications: {
				allMessages: false,
				mentions: true,
				directMessages: true,
				soundEnabled: true,
			},
			privacy: {
				showOnlineStatus: true,
				allowDMs: "everyone",
			},
			appearance: {
				theme: "system",
			},
		}
	);

	const [loading, setLoading] = useState(false);

	// Update local state when userProfile changes
	useEffect(() => {
		if (userProfile) {
			setDisplayName(userProfile.displayName);
			setCustomStatus(userProfile.customStatus || "");
			setCustomStatusEmoji(userProfile.customStatusEmoji || "");
			setStatusType(userProfile.statusType);
			setPhotoURL(userProfile.photoURL);
			setSettings(
				userProfile.settings || {
					notifications: {
						allMessages: false,
						mentions: true,
						directMessages: true,
						soundEnabled: true,
					},
					privacy: { showOnlineStatus: true, allowDMs: "everyone" },
					appearance: { theme: "system" },
				}
			);
		}
	}, [userProfile]);

	// Handle profile picture upload
	const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file || !user) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image size must be less than 5MB");
			return;
		}

		setUploadingPhoto(true);
		try {
			const url = await uploadProfilePicture(user.uid, file);
			setPhotoURL(url);
			if (setUserProfile && userProfile) {
				setUserProfile({ ...userProfile, photoURL: url });
			}
			toast.success("Profile picture updated");
		} catch (error: any) {
			console.error("Error uploading photo:", error);
			toast.error(error.message || "Failed to upload profile picture");
		} finally {
			setUploadingPhoto(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	// Handle save profile
	const handleSaveProfile = async () => {
		if (!user) return;

		setLoading(true);
		try {
			await updateUserProfile(user.uid, { displayName });
			await updateCustomStatus(user.uid, customStatus || null, customStatusEmoji || null);
			await updateUserStatus(user.uid, statusType);

			if (setUserProfile && userProfile) {
				setUserProfile({
					...userProfile,
					displayName,
					customStatus: customStatus || null,
					customStatusEmoji: customStatusEmoji || null,
					statusType,
				});
			}

			// Update Pusher status
			updatePusherStatus(user.uid, statusType);

			toast.success("Profile updated successfully");
		} catch (error: any) {
			console.error("Error saving profile:", error);
			toast.error(error.message || "Failed to save profile");
		} finally {
			setLoading(false);
		}
	};

	// Handle save settings
	const handleSaveSettings = async () => {
		if (!user) return;

		setLoading(true);
		try {
			await updateUserSettings(user.uid, settings);

			if (setUserProfile && userProfile) {
				setUserProfile({ ...userProfile, settings });
			}

			toast.success("Settings saved successfully");
		} catch (error: any) {
			console.error("Error saving settings:", error);
			toast.error(error.message || "Failed to save settings");
		} finally {
			setLoading(false);
		}
	};

	// Handle theme change
	const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
		setTheme(newTheme);
		setSettings({ ...settings, appearance: { ...settings.appearance, theme: newTheme } });
	};

	if (!user || !userProfile) {
		return (
			<div className="container max-w-4xl mx-auto p-6">
				<p className="text-muted-foreground">Please sign in to view settings</p>
			</div>
		);
	}

	return (
		<div className="h-screen flex bg-background">
			<GroupList />

			<div className="flex-1 flex flex-col">
				<div className="container max-w-4xl mx-auto p-6 space-y-6 flex-1 overflow-auto">
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<h1 className="text-3xl font-bold">User Settings</h1>
					</div>

					<Tabs defaultValue="profile" className="space-y-6">
						<TabsList>
							<TabsTrigger value="profile">Profile</TabsTrigger>
							<TabsTrigger value="notifications">Notifications</TabsTrigger>
							<TabsTrigger value="privacy">Privacy</TabsTrigger>
							<TabsTrigger value="appearance">Appearance</TabsTrigger>
						</TabsList>

						{/* Profile Tab */}
						<TabsContent value="profile" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>My Account</CardTitle>
									<CardDescription>Update your profile information and status</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* Profile Picture */}
									<div className="flex items-center gap-6">
										<div className="relative">
											<Avatar className="h-24 w-24">
												<AvatarImage src={photoURL || undefined} referrerPolicy="no-referrer" />
												<AvatarFallback className="text-2xl">
													{displayName.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											{uploadingPhoto && (
												<div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
													<Loader2 className="h-6 w-6 animate-spin" />
												</div>
											)}
										</div>
										<div className="space-y-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => fileInputRef.current?.click()}
												disabled={uploadingPhoto}>
												<Camera className="h-4 w-4 mr-2" />
												{photoURL ? "Change" : "Upload"} Photo
											</Button>
											<p className="text-sm text-muted-foreground">
												JPG, PNG or GIF. Max size of 5MB
											</p>
											<input
												ref={fileInputRef}
												type="file"
												accept="image/*"
												onChange={handlePhotoUpload}
												className="hidden"
											/>
										</div>
									</div>

									{/* Display Name */}
									<div className="space-y-2">
										<Label htmlFor="displayName">Display Name</Label>
										<Input
											id="displayName"
											value={displayName}
											onChange={(e) => setDisplayName(e.target.value)}
											placeholder="Enter your display name"
										/>
									</div>

									{/* Email (Read-only) */}
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input id="email" value={user.email || ""} disabled />
										<p className="text-sm text-muted-foreground">Your email cannot be changed</p>
									</div>

									{/* Status Type */}
									<div className="space-y-2">
										<Label htmlFor="statusType">Status</Label>
										<Select value={statusType} onValueChange={(value: any) => setStatusType(value)}>
											<SelectTrigger id="statusType">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="online">Online</SelectItem>
												<SelectItem value="idle">Idle</SelectItem>
												<SelectItem value="dnd">Do Not Disturb</SelectItem>
												<SelectItem value="invisible">Invisible</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Custom Status */}
									<div className="space-y-2">
										<Label htmlFor="customStatus">Custom Status</Label>
										<div className="flex gap-2">
											<Input
												id="customStatusEmoji"
												value={customStatusEmoji}
												onChange={(e) => setCustomStatusEmoji(e.target.value)}
												placeholder="🎮"
												className="w-20"
												maxLength={2}
											/>
											<Input
												id="customStatus"
												value={customStatus}
												onChange={(e) => setCustomStatus(e.target.value)}
												placeholder="Playing games"
												maxLength={100}
											/>
										</div>
									</div>

									<Button onClick={handleSaveProfile} disabled={loading}>
										{loading ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="h-4 w-4 mr-2" />
												Save Changes
											</>
										)}
									</Button>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Notifications Tab */}
						<TabsContent value="notifications" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Notifications</CardTitle>
									<CardDescription>Configure notification preferences</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor="allMessages">All Messages</Label>
											<p className="text-sm text-muted-foreground">Get notified for all messages</p>
										</div>
										<Switch
											id="allMessages"
											checked={settings.notifications.allMessages}
											onCheckedChange={(checked) =>
												setSettings({
													...settings,
													notifications: { ...settings.notifications, allMessages: checked },
												})
											}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor="mentions">Mentions</Label>
											<p className="text-sm text-muted-foreground">
												Get notified when you're mentioned
											</p>
										</div>
										<Switch
											id="mentions"
											checked={settings.notifications.mentions}
											onCheckedChange={(checked) =>
												setSettings({
													...settings,
													notifications: { ...settings.notifications, mentions: checked },
												})
											}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor="directMessages">Direct Messages</Label>
											<p className="text-sm text-muted-foreground">
												Get notified for direct messages
											</p>
										</div>
										<Switch
											id="directMessages"
											checked={settings.notifications.directMessages}
											onCheckedChange={(checked) =>
												setSettings({
													...settings,
													notifications: { ...settings.notifications, directMessages: checked },
												})
											}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor="soundEnabled">Sound</Label>
											<p className="text-sm text-muted-foreground">Enable notification sounds</p>
										</div>
										<Switch
											id="soundEnabled"
											checked={settings.notifications.soundEnabled}
											onCheckedChange={(checked) =>
												setSettings({
													...settings,
													notifications: { ...settings.notifications, soundEnabled: checked },
												})
											}
										/>
									</div>

									<Button onClick={handleSaveSettings} disabled={loading}>
										{loading ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="h-4 w-4 mr-2" />
												Save Changes
											</>
										)}
									</Button>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Privacy Tab */}
						<TabsContent value="privacy" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Privacy & Safety</CardTitle>
									<CardDescription>Manage your privacy settings</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor="showOnlineStatus">Show Online Status</Label>
											<p className="text-sm text-muted-foreground">
												Allow others to see your online status
											</p>
										</div>
										<Switch
											id="showOnlineStatus"
											checked={settings.privacy.showOnlineStatus}
											onCheckedChange={(checked) =>
												setSettings({
													...settings,
													privacy: { ...settings.privacy, showOnlineStatus: checked },
												})
											}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="allowDMs">Who Can DM You</Label>
										<Select
											value={settings.privacy.allowDMs}
											onValueChange={(value: "everyone" | "friends" | "none") =>
												setSettings({
													...settings,
													privacy: { ...settings.privacy, allowDMs: value },
												})
											}>
											<SelectTrigger id="allowDMs">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="everyone">Everyone</SelectItem>
												<SelectItem value="friends">Friends Only</SelectItem>
												<SelectItem value="none">Nobody</SelectItem>
											</SelectContent>
										</Select>
										<p className="text-sm text-muted-foreground">
											Control who can send you direct messages
										</p>
									</div>

									<Button onClick={handleSaveSettings} disabled={loading}>
										{loading ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="h-4 w-4 mr-2" />
												Save Changes
											</>
										)}
									</Button>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Appearance Tab */}
						<TabsContent value="appearance" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Appearance</CardTitle>
									<CardDescription>Customize the app appearance</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="space-y-2">
										<Label htmlFor="theme">Theme</Label>
										<Select
											value={settings.appearance.theme}
											onValueChange={(value: "light" | "dark" | "system") => {
												handleThemeChange(value);
											}}>
											<SelectTrigger id="theme">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="light">Light</SelectItem>
												<SelectItem value="dark">Dark</SelectItem>
												<SelectItem value="system">System</SelectItem>
											</SelectContent>
										</Select>
										<p className="text-sm text-muted-foreground">
											Choose your preferred color scheme
										</p>
									</div>

									<Button onClick={handleSaveSettings} disabled={loading}>
										{loading ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="h-4 w-4 mr-2" />
												Save Changes
											</>
										)}
									</Button>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>

				{/* Sticky User Profile at bottom */}
				<div className="border-t bg-muted/30">
					<UserProfile />
				</div>
			</div>
		</div>
	);
}
