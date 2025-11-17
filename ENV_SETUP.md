# Environment Variables Setup Guide

This document contains all the environment variables needed for the Discord Clone Chat App.

## 📁 Frontend Environment Variables

Create a `.env` file in the **root directory** with the following variables:

```env
# ===========================================
# FIREBASE CONFIGURATION
# ===========================================
# Get these values from Firebase Console:
# 1. Go to https://console.firebase.google.com
# 2. Select your project
# 3. Go to Project Settings (gear icon)
# 4. Scroll down to "Your apps" section
# 5. Click the web app icon (</>)
# 6. Copy the config values

VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# ===========================================
# PUSHER CONFIGURATION
# ===========================================
# Get these values from Pusher Dashboard:
# 1. Go to https://dashboard.pusher.com
# 2. Create a new Channels app or select existing
# 3. Go to "App Keys" tab
# 4. Copy Key and Cluster

VITE_PUSHER_KEY=your_pusher_key_here
VITE_PUSHER_CLUSTER=mt1

# ===========================================
# LIVEKIT CONFIGURATION
# ===========================================
# LiveKit server URL for voice/video calls
# Options:
# 1. Use LiveKit Cloud: https://cloud.livekit.io
# 2. Self-host: https://docs.livekit.io/deploy/
# Format: wss://your-livekit-server.com

VITE_LIVEKIT_URL=wss://your-livekit-server.livekit.cloud

# ===========================================
# BACKEND API URL
# ===========================================
# URL where your backend service is running
# Development: http://localhost:3001
# Production: https://your-backend-url.com

VITE_BACKEND_URL=http://localhost:3001

# ===========================================
# OPTIONAL: FIREBASE EMULATORS
# ===========================================
# Set to 'true' to use Firebase emulators for local development
# Make sure to run: firebase emulators:start

# VITE_USE_FIREBASE_EMULATORS=false
```

## 📁 Backend Environment Variables

Create a `.env` file in the **backend** directory with the following variables:

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
# Port for the backend server to listen on
PORT=3001

# Node environment (development, production, test)
NODE_ENV=development

# Frontend URL for CORS (comma-separated for multiple origins)
# Development: http://localhost:5173
# Production: https://your-frontend-url.com
CORS_ORIGIN=http://localhost:5173

# ===========================================
# FIREBASE ADMIN SDK
# ===========================================
# Get these values from Firebase Console:
# 1. Go to https://console.firebase.google.com
# 2. Select your project
# 3. Go to Project Settings > Service Accounts
# 4. Click "Generate new private key"
# 5. Download the JSON file
# 6. Extract the values from the JSON

FIREBASE_PROJECT_ID=your-project-id

# Private key from the service account JSON
# IMPORTANT: Keep the quotes and \n characters as they are
# Example: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANB...\n-----END PRIVATE KEY-----\n"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Client email from the service account JSON
# Format: firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# ===========================================
# PUSHER CONFIGURATION
# ===========================================
# Get these values from Pusher Dashboard:
# 1. Go to https://dashboard.pusher.com
# 2. Select your app
# 3. Go to "App Keys" tab
# 4. Copy all credentials (App ID, Key, Secret, Cluster)

PUSHER_APP_ID=1234567
PUSHER_KEY=your_pusher_key_here
PUSHER_SECRET=your_pusher_secret_here
PUSHER_CLUSTER=mt1

# ===========================================
# OPENAI CONFIGURATION
# ===========================================
# Get your API key from OpenAI:
# 1. Go to https://platform.openai.com/api-keys
# 2. Create a new secret key
# 3. Copy the key (it starts with sk-)
# Note: OpenAI Moderation API is free to use

OPENAI_API_KEY=sk-your_openai_api_key_here
```

## 🔧 Quick Setup Commands

```bash
# Create frontend .env file
cat > .env << 'EOF'
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_PUSHER_KEY=
VITE_PUSHER_CLUSTER=
VITE_LIVEKIT_URL=
VITE_BACKEND_URL=http://localhost:3001
EOF

# Create backend .env file
cat > backend/.env << 'EOF'
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=""
FIREBASE_CLIENT_EMAIL=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
OPENAI_API_KEY=
EOF
```

## 📝 How to Get Each Credential

### Firebase

1. **Create Firebase Project:**

   - Go to https://console.firebase.google.com
   - Click "Add project"
   - Follow the setup wizard

2. **Get Web App Credentials:**

   - Project Settings → General
   - Scroll to "Your apps"
   - Add web app or select existing
   - Copy all config values

3. **Get Admin SDK Credentials:**
   - Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download JSON file
   - Extract: `project_id`, `private_key`, `client_email`

### Pusher

1. **Sign up:** https://pusher.com/signup
2. **Create Channels App:**
   - Dashboard → Create app
   - Select "Channels" product
3. **Get Credentials:**
   - App Keys tab
   - Copy: App ID, Key, Secret, Cluster

### LiveKit

**Option 1: LiveKit Cloud (Easiest)**

1. Sign up: https://cloud.livekit.io
2. Create project
3. Copy WebSocket URL (wss://...)

**Option 2: Self-Hosted**

1. Follow: https://docs.livekit.io/deploy/
2. Deploy to your server
3. Use your server's WebSocket URL

### OpenAI

1. **Sign up:** https://platform.openai.com
2. **Generate API Key:**
   - API Keys section
   - Create new secret key
   - Copy key (starts with `sk-`)
3. **Note:** Moderation API is free!

## 🔒 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Keep credentials secret** - don't share in public repos
3. **Use different credentials** for development and production
4. **Rotate keys regularly** - especially API keys
5. **Use environment-specific** values in deployment platforms

## 🚀 Deployment Platforms

### Frontend (Vercel)

```bash
# Add environment variables in Vercel dashboard
# Settings → Environment Variables
# Add all VITE_* variables
```

### Frontend (Netlify)

```bash
# Site settings → Build & deploy → Environment
# Add all VITE_* variables
```

### Backend (Railway.app)

```bash
# Variables tab in Railway dashboard
# Paste each variable
# Note: Railway handles \n in private keys automatically
```

### Backend (Render.com)

```bash
# Environment section
# Add each variable
# For private key: paste as-is with \n characters
```

## ✅ Verification

Test that environment variables are loaded correctly:

**Frontend:**

```typescript
console.log("Firebase Project:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log("Backend URL:", import.meta.env.VITE_BACKEND_URL);
```

**Backend:**

```typescript
console.log("Port:", process.env.PORT);
console.log("Firebase Project:", process.env.FIREBASE_PROJECT_ID);
```

## 🐛 Troubleshooting

### Issue: Variables not loading

**Frontend:**

- Ensure variables start with `VITE_`
- Restart dev server after changing `.env`
- Check file is in root directory

**Backend:**

- Check `.env` file is in `backend/` directory
- Ensure no extra spaces around `=`
- Restart backend server

### Issue: Firebase Admin SDK errors

```bash
# Check private key format
echo $FIREBASE_PRIVATE_KEY | head -c 50
# Should start with: "-----BEGIN PRIVATE KEY-----\n

# Common fix: Ensure newlines are preserved
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
-----END PRIVATE KEY-----
"
```

### Issue: CORS errors

```env
# Backend .env - Update CORS_ORIGIN to match frontend URL
CORS_ORIGIN=http://localhost:5173

# For multiple origins (production):
CORS_ORIGIN=https://app.example.com,https://www.example.com
```

## 📚 Additional Resources

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Backend README](./backend/README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Admin Setup](https://firebase.google.com/docs/admin/setup)
- [Pusher Documentation](https://pusher.com/docs/channels/getting_started/javascript/)
- [LiveKit Documentation](https://docs.livekit.io/)
