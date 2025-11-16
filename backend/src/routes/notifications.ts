import express from 'express';
import { messaging, db } from '../services/firebase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Send push notification for mentions
router.post('/send', authenticate, async (req: AuthRequest, res) => {
  try {
    const { recipientIds, title, body, data } = req.body;

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      res.status(400).json({ error: 'recipientIds array is required' });
      return;
    }

    // Get FCM tokens for recipients
    const tokens: string[] = [];

    for (const userId of recipientIds) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.fcmTokens && Array.isArray(userData.fcmTokens)) {
          tokens.push(...userData.fcmTokens);
        }
      }
    }

    if (tokens.length === 0) {
      res.json({ success: true, message: 'No tokens found for recipients' });
      return;
    }

    // Send multicast message
    const message = {
      notification: {
        title: title || 'New Message',
        body: body || 'You have a new message',
      },
      data: data || {},
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message || 'Failed to send notification' });
  }
});

// Register FCM token
router.post('/register-token', authenticate, async (req: AuthRequest, res) => {
  try {
    const { token } = req.body;
    const userId = req.user!.uid;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    // Add token to user's fcmTokens array
    await db.collection('users').doc(userId).update({
      fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error registering token:', error);
    res.status(500).json({ error: error.message || 'Failed to register token' });
  }
});

// Unregister FCM token
router.post('/unregister-token', authenticate, async (req: AuthRequest, res) => {
  try {
    const { token } = req.body;
    const userId = req.user!.uid;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    // Remove token from user's fcmTokens array
    await db.collection('users').doc(userId).update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error unregistering token:', error);
    res.status(500).json({ error: error.message || 'Failed to unregister token' });
  }
});

export default router;

