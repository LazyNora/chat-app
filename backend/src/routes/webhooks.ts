import express from 'express';
import pusher from '../services/pusher';

const router = express.Router();

// Pusher webhook authentication
router.post('/pusher', (req, res) => {
  try {
    const webhook = pusher.webhook({
      headers: req.headers as any,
      rawBody: JSON.stringify(req.body),
    });

    if (!webhook.isValid()) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    // Handle webhook events
    webhook.getEvents().forEach((event: any) => {
      console.log('Pusher webhook event:', event);

      // Handle different event types
      switch (event.name) {
        case 'member_added':
          console.log(`Member ${event.userId} joined channel ${event.channel}`);
          break;
        case 'member_removed':
          console.log(`Member ${event.userId} left channel ${event.channel}`);
          break;
        case 'channel_occupied':
          console.log(`Channel ${event.channel} is now occupied`);
          break;
        case 'channel_vacated':
          console.log(`Channel ${event.channel} is now empty`);
          break;
        default:
          console.log('Unknown event:', event.name);
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message || 'Failed to process webhook' });
  }
});

// LiveKit webhook (for future voice/video integration)
router.post('/livekit', (req, res) => {
  try {
    console.log('LiveKit webhook:', req.body);

    // Handle LiveKit events
    const event = req.body;

    switch (event.event) {
      case 'participant_joined':
        console.log(`Participant ${event.participant.identity} joined room ${event.room.name}`);
        break;
      case 'participant_left':
        console.log(`Participant ${event.participant.identity} left room ${event.room.name}`);
        break;
      case 'room_finished':
        console.log(`Room ${event.room.name} finished`);
        break;
      default:
        console.log('Unknown event:', event.event);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error processing LiveKit webhook:', error);
    res.status(500).json({ error: error.message || 'Failed to process webhook' });
  }
});

export default router;

