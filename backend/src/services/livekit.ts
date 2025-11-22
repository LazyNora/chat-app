import { AccessToken } from "livekit-server-sdk";

// LiveKit configuration from environment variables
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";

export interface TokenOptions {
	roomName: string;
	participantName: string;
	userId: string;
	canPublish?: boolean;
	canSubscribe?: boolean;
	canPublishData?: boolean;
}

/**
 * Generate a LiveKit access token for a participant
 * @param options Token generation options
 * @returns JWT token string
 */
export async function generateLiveKitToken(options: TokenOptions): Promise<string> {
	if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
		throw new Error("LiveKit API key and secret must be configured");
	}

	const {
		roomName,
		participantName,
		userId,
		canPublish = true,
		canSubscribe = true,
		canPublishData = true,
	} = options;

	// Create access token
	const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
		identity: userId,
		name: participantName,
	});

	// Grant permissions
	at.addGrant({
		room: roomName,
		roomJoin: true,
		canPublish,
		canSubscribe,
		canPublishData,
	});

	// Token expires in 6 hours (default is 6 hours)
	// Generate and return JWT token
	return await at.toJwt();
}

/**
 * Validate LiveKit webhook signature
 * @param authHeader Authorization header from webhook request
 * @param url Request URL
 * @param body Request body as string
 * @returns true if signature is valid
 */
export function validateWebhookSignature(authHeader: string, url: string, body: string): boolean {
	// LiveKit webhook signature validation
	// This is a simplified version - in production, implement proper HMAC validation
	// See: https://docs.livekit.io/guides/webhooks/
	return true; // Placeholder - implement proper validation
}
