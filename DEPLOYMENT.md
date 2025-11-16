# Deployment Guide

This guide covers deploying the Discord Clone Chat App as a web app, PWA, and desktop application.

## Web Deployment

### Frontend (Vercel, Netlify, Firebase Hosting)

#### Option 1: Vercel

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variables in Vercel dashboard
4. Deploy!

#### Option 2: Netlify

1. Connect your GitHub repository to Netlify
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables
4. Deploy!

#### Option 3: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy --only hosting
```

### Backend (Railway.app, Render.com)

#### Option 1: Railway.app (Recommended)

1. Create new project on Railway.app
2. Connect GitHub repository
3. Add environment variables
4. Railway auto-detects Node.js and deploys
5. Your backend will be live at: `https://your-app.railway.app`

#### Option 2: Render.com

1. Create new Web Service
2. Connect repository
3. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add environment variables
5. Deploy!

### Update Frontend Environment Variable

After deploying backend, update frontend env:
```env
VITE_BACKEND_URL=https://your-backend-url.com
```

## PWA (Progressive Web App)

The app is already configured as a PWA with `vite-plugin-pwa`.

### Features:
- ✅ Offline support with service workers
- ✅ Installable on mobile devices
- ✅ Firebase offline persistence
- ✅ Cached assets for faster loading

### Testing PWA Locally:

```bash
npm run build
npm run preview
```

Then visit http://localhost:4173 and check for "Install app" prompt in browser.

### PWA Icons:

Create icons in `public/` directory:
- `pwa-192x192.png` (192x192)
- `pwa-512x512.png` (512x512)
- `apple-touch-icon.png` (180x180)
- `favicon.ico`

## Electron Desktop App

### Development

```bash
npm run electron:dev
```

This starts both Vite dev server and Electron.

### Building for Production

#### Windows:

```bash
npm run electron:build:win
```

Output: `dist/Discord Clone Setup.exe`

#### macOS:

```bash
npm run electron:build:mac
```

Output: `dist/Discord Clone.dmg`

#### Linux:

```bash
npm run electron:build:linux
```

Output: `dist/Discord Clone.AppImage` and `.deb`

### Build All Platforms:

```bash
npm run electron:build
```

### Distribution

Installers will be in the `dist/` directory:
- Windows: `.exe` installer
- macOS: `.dmg` image
- Linux: `.AppImage` and `.deb` packages

### Code Signing (Production)

For production releases, you should code sign your applications:

**Windows:**
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "password"
}
```

**macOS:**
```json
"mac": {
  "identity": "Developer ID Application: Your Name (TEAM_ID)"
}
```

### Auto-Updates

To enable auto-updates, configure in `electron-builder.yml`:

```yaml
publish:
  provider: github
  owner: your-username
  repo: your-repo
```

Then use `electron-updater` in your Electron app.

## Environment Variables

### Frontend (.env)

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Pusher
VITE_PUSHER_KEY=
VITE_PUSHER_CLUSTER=

# LiveKit
VITE_LIVEKIT_URL=

# Backend
VITE_BACKEND_URL=https://your-backend-url.com
```

### Backend (.env)

```env
# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=

# Pusher
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=

# OpenAI
OPENAI_API_KEY=
```

## Performance Optimization

### Frontend:

1. **Code Splitting:**
   - Already configured with Vite
   - Lazy load routes: `const Home = lazy(() => import('./pages/Home'))`

2. **Image Optimization:**
   - Use WebP format
   - Compress images before upload
   - Use Firebase Storage CDN

3. **Bundle Analysis:**
```bash
npm run build -- --mode analyze
```

### Backend:

1. **Caching:**
   - Use Redis for session storage
   - Cache Firestore queries

2. **Rate Limiting:**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

3. **Compression:**
```javascript
import compression from 'compression';
app.use(compression());
```

## Monitoring & Analytics

### Frontend:

```bash
npm install @sentry/react
```

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### Backend:

```bash
npm install @sentry/node
```

## Security Checklist

- [ ] Environment variables configured
- [ ] Firebase security rules deployed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] HTTPS enabled (automatic on most platforms)
- [ ] Content Security Policy configured
- [ ] Regular dependency updates

## Troubleshooting

### Build Errors:

**Problem:** Type errors during build
**Solution:** Run `npm run lint` and fix issues

**Problem:** Module not found
**Solution:** Clear cache `rm -rf node_modules && npm install`

### Deployment Errors:

**Problem:** Environment variables not working
**Solution:** Ensure variables are prefixed with `VITE_` for frontend

**Problem:** Firebase connection issues
**Solution:** Verify Firebase config and security rules

### Electron Errors:

**Problem:** Electron won't start
**Solution:** Check `electron/main.js` paths and NODE_ENV

**Problem:** White screen in production
**Solution:** Verify `file://` protocol path in main.js

## Continuous Deployment

### GitHub Actions Example:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run deploy
```

## Support

For issues or questions:
- Check documentation in `/docs`
- Review plan in `discord-clone-chat.plan.md`
- Check Firebase setup in `FIREBASE_SETUP.md`
- Backend docs in `backend/README.md`

