import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || '',
  useTLS: true,
});

export async function triggerPresenceEvent(
  channel: string,
  event: string,
  data: any
): Promise<void> {
  try {
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error('Error triggering Pusher event:', error);
    throw error;
  }
}

export default pusher;

