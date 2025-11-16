import { auth } from './firebase';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Get auth token for API requests
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

// Send push notification
export async function sendPushNotification(
  recipientIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/api/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ recipientIds, title, body, data }),
  });

  if (!response.ok) {
    throw new Error('Failed to send notification');
  }
}

// Register FCM token
export async function registerFCMToken(token: string): Promise<void> {
  const authToken = await getAuthToken();

  const response = await fetch(`${API_URL}/api/notifications/register-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error('Failed to register token');
  }
}

// Check content moderation
export async function moderateContent(
  content: string,
  groupId?: string,
  channelId?: string,
  messageId?: string
): Promise<{ flagged: boolean; categories: Record<string, boolean> }> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/api/moderation/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content, groupId, channelId, messageId }),
  });

  if (!response.ok) {
    throw new Error('Failed to moderate content');
  }

  return response.json();
}

// Get flagged messages
export async function getFlaggedMessages(
  groupId: string
): Promise<any[]> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/api/moderation/flagged/${groupId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get flagged messages');
  }

  const data = await response.json();
  return data.flaggedMessages;
}

