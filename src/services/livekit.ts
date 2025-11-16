// LiveKit service for voice/video calls
import { Room, RoomEvent, Track } from 'livekit-client';

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || '';

// Connect to LiveKit room
export async function connectToRoom(
  roomName: string,
  token: string
): Promise<Room> {
  const room = new Room();

  await room.connect(LIVEKIT_URL, token);

  return room;
}

// Get LiveKit access token from backend
export async function getLiveKitToken(
  roomName: string,
  participantName: string
): Promise<string> {
  // In production, this would call your backend to generate a JWT token
  // For now, return placeholder
  return 'livekit-token-placeholder';
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

