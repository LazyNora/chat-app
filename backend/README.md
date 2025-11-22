# Discord Clone Backend

Backend service for Discord Clone providing push notifications, content moderation, and webhook handling.

## Features

- **Push Notifications**: Firebase Cloud Messaging (FCM) for @mentions and DMs
- **Content Moderation**: OpenAI Moderation API for automated content filtering
- **Webhooks**: Handle Pusher and LiveKit webhooks for real-time events
- **Voice/Video Calls**: LiveKit token generation for voice channels
- **Authentication**: Firebase Auth token verification

## Tech Stack

- Node.js + Express + TypeScript
- Firebase Admin SDK
- OpenAI API
- Pusher
- LiveKit Server SDK

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Firebase Admin SDK
# Get these from Firebase Console -> Project Settings -> Service Accounts
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Pusher
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster

# OpenAI
OPENAI_API_KEY=sk-...

# LiveKit
# Get these from LiveKit Cloud dashboard or your self-hosted instance
# LiveKit Cloud: https://cloud.livekit.io
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### 3. Start Development Server

```bash
npm run dev
```

The server will run on http://localhost:3001

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Notifications

#### POST `/api/notifications/send`

Send push notifications to users.

**Headers:**

```
Authorization: Bearer <firebase-token>
```

**Body:**

```json
{
	"recipientIds": ["userId1", "userId2"],
	"title": "New Message",
	"body": "You were mentioned in #general",
	"data": {
		"groupId": "...",
		"channelId": "...",
		"messageId": "..."
	}
}
```

#### POST `/api/notifications/register-token`

Register FCM token for a user.

**Headers:**

```
Authorization: Bearer <firebase-token>
```

**Body:**

```json
{
	"token": "fcm-token-here"
}
```

### Moderation

#### POST `/api/moderation/check`

Check message content with OpenAI Moderation API.

**Headers:**

```
Authorization: Bearer <firebase-token>
```

**Body:**

```json
{
	"content": "Message text to moderate",
	"groupId": "...",
	"channelId": "...",
	"messageId": "..."
}
```

**Response:**

```json
{
  "flagged": false,
  "categories": {
    "hate": false,
    "harassment": false,
    "sexual": false,
    "violence": false,
    ...
  }
}
```

#### GET `/api/moderation/flagged/:groupId`

Get all flagged messages in a group (moderators only).

**Headers:**

```
Authorization: Bearer <firebase-token>
```

### Webhooks

#### POST `/api/webhooks/pusher`

Handle Pusher webhooks for presence events.

#### POST `/api/webhooks/livekit`

Handle LiveKit webhooks for voice/video events.

### LiveKit

#### POST `/api/livekit/token`

Generate a LiveKit access token for joining a voice/video room.

**Headers:**

```
Authorization: Bearer <firebase-token>
```

**Body:**

```json
{
	"roomName": "group-123-channel-456",
	"participantName": "John Doe",
	"userId": "user123"
}
```

**Response:**

```json
{
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400`: Invalid request (missing fields or invalid room name format)
- `401`: Unauthorized (invalid or missing Firebase token)
- `500`: Server error (LiveKit configuration issue)

### Health Check

#### GET `/health`

Check if the server is running.

**Response:**

```json
{
	"status": "ok",
	"timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Deployment

### Railway.app (Recommended)

1. Create a new project on Railway.app
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy!

Railway will automatically detect Node.js and install dependencies.

### Render.com

1. Create a new Web Service
2. Connect your repository
3. Build command: `cd backend && npm install && npm run build`
4. Start command: `cd backend && npm start`
5. Add environment variables
6. Deploy!

### Other Options

- **Fly.io**: Great for global deployment
- **DigitalOcean App Platform**: Simple and reliable
- **AWS Lightsail**: Cost-effective for small projects

## Development

### Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── notifications.ts    # Push notification routes
│   │   ├── moderation.ts       # Content moderation routes
│   │   ├── webhooks.ts         # Webhook handlers
│   │   └── livekit.ts          # LiveKit token generation routes
│   ├── services/
│   │   ├── firebase.ts         # Firebase Admin SDK
│   │   ├── openai.ts           # OpenAI API client
│   │   ├── pusher.ts           # Pusher client
│   │   └── livekit.ts          # LiveKit token generation service
│   ├── middleware/
│   │   └── auth.ts             # Authentication middleware
│   └── index.ts                # Express app entry point
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Routes

1. Create a new file in `src/routes/`
2. Import and use in `src/index.ts`
3. Add authentication middleware if needed

### Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test with authentication (get token from Firebase)
curl -X POST http://localhost:3001/api/notifications/send \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientIds": ["userId"], "title": "Test", "body": "Test message"}'
```

## Security Notes

- All sensitive routes require Firebase authentication
- Environment variables are never committed to Git
- API keys should be rotated regularly
- CORS is configured to allow only your frontend domain
- Input validation is performed on all endpoints

## Troubleshooting

### Firebase Admin SDK Issues

- Ensure private key is properly formatted with `\n` newlines
- Verify service account has correct permissions
- Check Firebase project ID matches

### OpenAI API Issues

- Verify API key is valid and has credits
- Check rate limits (Moderation API is generous)
- Handle errors gracefully in production

### Pusher Connection Issues

- Verify app credentials
- Check cluster setting
- Ensure webhooks are configured in Pusher dashboard

### LiveKit Token Generation Issues

- Verify `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are set correctly
- Ensure LiveKit server is accessible from your backend
- Check room name format matches: `group-{groupId}-channel-{channelId}`
- Tokens expire after 6 hours (default)

## License

MIT
