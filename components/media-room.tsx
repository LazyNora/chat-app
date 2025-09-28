"use client";

import {
	LiveKitRoom,
	GridLayout,
	ParticipantTile,
	RoomAudioRenderer,
	ControlBar,
	useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import { authenticateForUserWithToken } from "@/lib/firebase/tokens";
import { Profile } from "@/models/models.client";
import { Loader2 } from "lucide-react";

interface MediaRoomProps {
	chatId: string;
	video: boolean;
	audio: boolean;
}

const MediaRoom = ({ chatId, video, audio }: MediaRoomProps) => {
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [token, setToken] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchToken = useCallback(
		async (username: string) => {
			try {
				const resp = await fetch(
					`/api/livekit?room=${encodeURIComponent(chatId)}&username=${encodeURIComponent(username)}`
				);

				if (!resp.ok) {
					throw new Error(`HTTP error! status: ${resp.status}`);
				}

				const data = await resp.json();

				if (data.error) {
					throw new Error(data.error);
				}

				return data.token;
			} catch (err) {
				console.error("Error fetching token:", err);
				throw err;
			}
		},
		[chatId]
	);

	useEffect(() => {
		let isMounted = true;

		const initializeRoom = async () => {
			if (!user?.uid || !user?.customToken) {
				setIsLoading(false);
				setError("User not authenticated");
				return;
			}

			try {
				setError(null);

				// Authenticate and fetch user profile
				await authenticateForUserWithToken(user.customToken);
				const result = await Profile.findOne<Profile>("userId", "==", user.uid);

				if (!isMounted) return;

				let username = "Unknown User";
				if (result) {
					setProfile(result);
					username = result.name || user.displayName || user.email || "Unknown User";
				} else {
					username = user.displayName || user.email || "Unknown User";
				}

				// Get LiveKit token
				const livekitToken = await fetchToken(username);

				if (!isMounted) return;

				setToken(livekitToken);
			} catch (err) {
				console.error("Error initializing media room:", err);
				if (isMounted) {
					setError(err instanceof Error ? err.message : "Failed to initialize room");
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		initializeRoom();

		return () => {
			isMounted = false;
		};
	}, [user?.uid, user?.customToken, user?.displayName, user?.email, fetchToken]);

	if (isLoading) {
		return (
			<div className="flex flex-col flex-1 justify-center items-center">
				<Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
				<p className="text-xs text-zinc-500 dark:text-zinc-400">Connecting to room...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col flex-1 justify-center items-center">
				<div className="text-red-500 mb-2">Failed to connect</div>
				<p className="text-xs text-zinc-500 dark:text-zinc-400">{error}</p>
			</div>
		);
	}

	if (!token) {
		return (
			<div className="flex flex-col flex-1 justify-center items-center">
				<Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
				<p className="text-xs text-zinc-500 dark:text-zinc-400">Getting access token...</p>
			</div>
		);
	}

	return (
		<LiveKitRoom
			video={video}
			audio={audio}
			token={token}
			serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
			data-lk-theme="default"
			style={{ height: "100vh" }}
			onConnected={() => {
				console.log("Connected to LiveKit room:", chatId);
			}}
			onDisconnected={() => {
				console.log("Disconnected from LiveKit room:", chatId);
			}}
			onError={(error) => {
				console.error("LiveKit room error:", error);
				setError(`Room error: ${error.message}`);
			}}>
			<MyVideoConference />
			<RoomAudioRenderer />
			<ControlBar variation="verbose" />
		</LiveKitRoom>
	);
};

function MyVideoConference() {
	const tracks = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.ScreenShare, withPlaceholder: false },
		],
		{ onlySubscribed: false }
	);

	return (
		<GridLayout
			tracks={tracks}
			style={{
				height: "calc(100vh - var(--lk-control-bar-height))",
			}}>
			<ParticipantTile />
		</GridLayout>
	);
}

export default MediaRoom;
