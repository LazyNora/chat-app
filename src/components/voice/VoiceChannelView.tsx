import { useState, useEffect } from "react";
import { Volume2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LiveKitRoom, VideoConference, ConnectionStateToast } from "@livekit/components-react";
import "@livekit/components-styles";
import { getLiveKitToken } from "@/services/livekit";
import { useAuthStore } from "@/stores/authStore";
import type { Channel } from "@/types";
import { toast } from "sonner";

interface VoiceChannelViewProps {
	channel: Channel;
	groupId?: string;
}

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "";

export function VoiceChannelView({ channel }: VoiceChannelViewProps) {
	const { user, userProfile } = useAuthStore();
	const [token, setToken] = useState<string | undefined>(undefined);
	const [error, setError] = useState<Error | null>(null);
	const [isConnecting, setIsConnecting] = useState(false);

	// Fetch LiveKit token when component mounts or room name changes
	useEffect(() => {
		const fetchToken = async () => {
			if (!channel.liveKitRoomName || !user || !userProfile) {
				return;
			}

			setIsConnecting(true);
			setError(null);

			try {
				const livekitToken = await getLiveKitToken(
					channel.liveKitRoomName,
					userProfile.displayName,
					user.uid
				);
				setToken(livekitToken);
			} catch (err) {
				const error = err instanceof Error ? err : new Error("Failed to get LiveKit token");
				setError(error);
				console.error("Error fetching LiveKit token:", err);
				toast.error(error.message);
			} finally {
				setIsConnecting(false);
			}
		};

		fetchToken();
	}, [channel.liveKitRoomName, user, userProfile]);

	const handleConnected = () => {
		toast.success("Connected to voice channel");
	};

	const handleDisconnected = () => {
		toast.success("Disconnected from voice channel");
		setToken(undefined); // Clear token on disconnect
	};

	const handleError = (error: Error) => {
		setError(error);
		console.error("LiveKit error:", error);
		toast.error(error.message || "Connection error");
	};

	if (!channel.liveKitRoomName) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
				<Alert variant="destructive" className="max-w-md">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>Voice channel is not properly configured</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (error && !token) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
				<Alert variant="destructive" className="max-w-md">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						{error.message || "Failed to connect to voice channel"}
					</AlertDescription>
				</Alert>
				<Button
					onClick={() => {
						setError(null);
						setToken(undefined);
					}}
					variant="outline">
					Retry Connection
				</Button>
			</div>
		);
	}

	if (isConnecting || !token) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center gap-4">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="text-muted-foreground">Connecting to voice channel...</p>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col h-full">
			{/* Header */}
			<div className="p-6 border-b">
				<div className="flex items-center gap-3">
					<div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
						<Volume2 className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h2 className="text-xl font-semibold">{channel.name}</h2>
						{channel.description && (
							<p className="text-sm text-muted-foreground">{channel.description}</p>
						)}
					</div>
				</div>
			</div>

			{/* LiveKit Room with VideoConference */}
			<LiveKitRoom
				token={token}
				serverUrl={LIVEKIT_URL}
				connect={true}
				onConnected={handleConnected}
				onDisconnected={handleDisconnected}
				onError={handleError}
				className="flex-1 flex flex-col min-h-0"
				data-lk-theme="default"
				style={{ height: "100vh" }}>
				<ConnectionStateToast />
				<VideoConference />
			</LiveKitRoom>
		</div>
	);
}
