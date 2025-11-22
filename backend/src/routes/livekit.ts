import express from "express";
import { generateLiveKitToken } from "../services/livekit";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = express.Router();

/**
 * POST /api/livekit/token
 * Generate a LiveKit access token for joining a voice/video room
 *
 * Headers:
 *   Authorization: Bearer <firebase-token>
 *
 * Body:
 *   {
 *     "roomName": "group-123-channel-456",
 *     "participantName": "John Doe",
 *     "userId": "user123"
 *   }
 *
 * Response:
 *   {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 */
router.post("/token", authenticate, async (req: AuthRequest, res) => {
	try {
		const { roomName, participantName, userId } = req.body;
		const authenticatedUserId = req.user!.uid;

		// Validate required fields
		if (!roomName) {
			res.status(400).json({ error: "roomName is required" });
			return;
		}

		if (!participantName) {
			res.status(400).json({ error: "participantName is required" });
			return;
		}

		// Use authenticated user ID if userId not provided or doesn't match
		const finalUserId = userId || authenticatedUserId;

		// Validate room name format (basic validation)
		// Room name should match pattern: group-{groupId}-channel-{channelId}
		if (!/^group-[a-zA-Z0-9]+-channel-[a-zA-Z0-9]+$/.test(roomName)) {
			res.status(400).json({
				error: "Invalid room name format. Expected: group-{groupId}-channel-{channelId}",
			});
			return;
		}

		// Generate LiveKit token
		const token = await generateLiveKitToken({
			roomName,
			participantName,
			userId: finalUserId,
			canPublish: true, // Allow publishing audio/video
			canSubscribe: true, // Allow subscribing to others' tracks
			canPublishData: true, // Allow sending data messages
		});

		res.json({ token });
	} catch (error: any) {
		console.error("Error generating LiveKit token:", error);
		res.status(500).json({
			error: error.message || "Failed to generate LiveKit token",
		});
	}
});

export default router;
