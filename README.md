# Discord Clone Chat App

A full-featured Discord/Slack clone built with modern web technologies.

## Tech Stack

### Frontend

- **React 18 + Vite + TypeScript** - Fast, type-safe development
- **Tailwind CSS + shadcn/ui** - Beautiful, accessible UI components
- **Firebase** - Authentication, Firestore database, File storage
- **Pusher** - Real-time presence and typing indicators
- **LiveKit** - Voice/video calls and screen sharing
- **Zustand** - Lightweight state management
- **React Hook Form + Zod** - Form validation
- **TipTap** - Rich text editing with Markdown support
- **Electron** - Desktop app support
- **PWA** - Mobile app support

### Backend

- **Node.js + Express + TypeScript** - Backend API service
- **Firebase Admin SDK** - Push notifications via FCM
- **OpenAI Moderation API** - AI-powered content moderation
- **Pusher Webhooks** - Real-time event handling

## Features

- 🔐 Authentication (Email/Password, Google OAuth)
- 💬 Real-time text messaging with Markdown support
- 📁 File uploads with previews (images, PDFs, documents)
- 🎙️ Voice channels
- 📹 Video calls with screen sharing
- 🧵 Message threads for organized discussions
- 📌 Pin important messages
- 👥 User mentions (@user, @everyone)
- 😊 Emoji reactions
- 🔍 Message search and filtering
- 🔔 Push notifications for mentions
- 👥 Role-based permissions system
- 🔗 QR code invitations
- 👀 Read/unread message tracking
- ✏️ Message editing and deletion
- 🤖 AI-powered content moderation
- 🎨 Customizable themes (light/dark mode)
- ⚙️ Comprehensive settings
- ⌨️ Keyboard shortcuts
- 📱 PWA support for mobile
- 💻 Electron app for desktop (Windows, Mac, Linux)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project
- Pusher account
- LiveKit server (or cloud hosting)
- OpenAI API key (for content moderation)

### Installation

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd chat-app-v2
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_PUSHER_KEY=your_pusher_key
   VITE_PUSHER_CLUSTER=your_pusher_cluster
   VITE_LIVEKIT_URL=your_livekit_url
   VITE_BACKEND_URL=http://localhost:3001
   ```

4. Start the development server

   ```bash
   npm run dev
   ```

5. Set up and start the backend (see `backend/README.md`)

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password and Google)
3. Create a Firestore database
4. Enable Firebase Storage
5. Set up Firestore Security Rules (see `firestore.rules`)
6. Create required Firestore indexes (see plan document)

### Backend Setup

See `backend/README.md` for backend setup instructions.

## Project Structure

```
src/
├── components/
│ ├── ui/ # shadcn/ui components
│ ├── chat/ # Chat-related components
│ ├── channels/ # Channel components
│ ├── groups/ # Group/server components
│ ├── modals/ # Modal dialogs
│ ├── settings/ # Settings pages
│ └── voice/ # Voice/video components
├── hooks/ # Custom React hooks
├── stores/ # Zustand stores
├── services/ # External service integrations
├── lib/ # Utility functions
├── types/ # TypeScript type definitions
└── pages/ # Route pages
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

### Frontend

- Deploy to Vercel, Netlify, or Firebase Hosting
- Build command: `npm run build`
- Output directory: `dist`

### Backend

- Deploy to Railway.app, Render.com, or Fly.io
- See backend documentation for deployment instructions

### Electron Desktop App

```bash
npm run electron:build
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
