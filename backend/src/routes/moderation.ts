import express from 'express';
import { moderateContent } from '../services/openai';
import { db } from '../services/firebase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Check message content with OpenAI Moderation API
router.post('/check', authenticate, async (req: AuthRequest, res) => {
  try {
    const { content, groupId, channelId, messageId } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    // Moderate content with OpenAI
    const result = await moderateContent(content);

    // If flagged, update message in Firestore
    if (result.flagged && groupId && channelId && messageId) {
      const messageRef = db
        .collection('groups')
        .doc(groupId)
        .collection('channels')
        .doc(channelId)
        .collection('messages')
        .doc(messageId);

      await messageRef.update({
        moderationStatus: 'flagged',
      });

      // Optionally, notify moderators
      // You could trigger a notification here
    }

    res.json({
      flagged: result.flagged,
      categories: result.categories,
      // Don't send detailed scores to client for security
    });
  } catch (error: any) {
    console.error('Error moderating content:', error);
    res.status(500).json({ error: error.message || 'Failed to moderate content' });
  }
});

// Get flagged messages (for moderators)
router.get('/flagged/:groupId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.uid;

    // Check if user is a moderator/admin in this group
    const memberDoc = await db
      .collection('groups')
      .doc(groupId)
      .collection('members')
      .doc(userId)
      .get();

    if (!memberDoc.exists) {
      res.status(403).json({ error: 'Not a member of this group' });
      return;
    }

    const memberData = memberDoc.data();
    if (!memberData?.permissions?.includes('manageMessages')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    // Get all flagged messages in the group
    const flaggedMessages: any[] = [];
    const channelsSnapshot = await db
      .collection('groups')
      .doc(groupId)
      .collection('channels')
      .get();

    for (const channelDoc of channelsSnapshot.docs) {
      const messagesSnapshot = await db
        .collection('groups')
        .doc(groupId)
        .collection('channels')
        .doc(channelDoc.id)
        .collection('messages')
        .where('moderationStatus', '==', 'flagged')
        .get();

      messagesSnapshot.docs.forEach((doc) => {
        flaggedMessages.push({
          id: doc.id,
          channelId: channelDoc.id,
          ...doc.data(),
        });
      });
    }

    res.json({ flaggedMessages });
  } catch (error: any) {
    console.error('Error fetching flagged messages:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch flagged messages' });
  }
});

export default router;

