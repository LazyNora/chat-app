// LiveKit service for voice/video calls
import { Room } from "livekit-client";
import { auth } from "./firebase";

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "";

// Connect to LiveKit room
export async function connectToRoom(
	roomName: string, // Room name (embedded in token, kept for API consistency)
	token: string
): Promise<Room> {
	const room = new Room();

	// Connect to room with token
	// Note: roomName is included in the JWT token from backend
	await room.connect(LIVEKIT_URL, token, {
		autoSubscribe: true,
	});

	return room;
}

// Get LiveKit access token from backend
export async function getLiveKitToken(
	roomName: string,
	participantName: string,
	userId: string
): Promise<string> {
	const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

	const user = auth.currentUser;
	if (!user) throw new Error("Not authenticated");
	const token = await user.getIdToken();

	try {
		const response = await fetch(`${API_URL}/api/livekit/token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ roomName, participantName, userId }),
		});

		if (!response.ok) {
			throw new Error("Failed to get LiveKit token");
		}

		const data = await response.json();
		return data.token;
	} catch (error) {
		console.error("Error getting LiveKit token:", error);
		// Fallback: return placeholder for development
		return "livekit-token-placeholder";
	}
}

// Enable/disable microphone
export async function toggleMicrophone(room: Room): Promise<boolean> {
	const localParticipant = room.localParticipant;
	const enabled = localParticipant.isMicrophoneEnabled;

	await localParticipant.setMicrophoneEnabled(!enabled);

	return !enabled;
}

// Enable/disable camera
export async function toggleCamera(room: Room): Promise<boolean> {
	const localParticipant = room.localParticipant;
	const enabled = localParticipant.isCameraEnabled;

	await localParticipant.setCameraEnabled(!enabled);

	return !enabled;
}

// Start screen share
export async function startScreenShare(room: Room): Promise<void> {
	await room.localParticipant.setScreenShareEnabled(true);
}

// Stop screen share
export async function stopScreenShare(room: Room): Promise<void> {
	await room.localParticipant.setScreenShareEnabled(false);
}

// Disconnect from room
export async function disconnectFromRoom(room: Room): Promise<void> {
	await room.disconnect();
}
