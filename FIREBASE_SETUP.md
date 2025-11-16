# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "discord-clone-chat")
4. Enable/disable Google Analytics (optional)
5. Create project

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** authentication
4. Enable **Google** authentication
   - Add your authorized domain (localhost is already included)
   - Configure OAuth consent screen if required

## 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose production mode
4. Select a location (choose closest to your users)
5. Click "Enable"

## 4. Enable Firebase Storage

1. Go to **Storage**
2. Click "Get started"
3. Start in production mode
4. Choose same location as Firestore
5. Click "Done"

## 5. Deploy Security Rules

### Option A: Using Firebase CLI (Recommended)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore (rules and indexes)
# - Storage (rules)
# - Hosting (optional)

# Deploy rules and indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
```

### Option B: Manual Deployment

1. Go to **Firestore Database** → **Rules**
2. Copy contents from `firestore.rules` and paste
3. Click "Publish"

4. Go to **Storage** → **Rules**
5. Copy contents from `storage.rules` and paste
6. Click "Publish"

7. Go to **Firestore Database** → **Indexes**
8. Manually create composite indexes as specified in `firestore.indexes.json`

## 6. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname
5. Copy the `firebaseConfig` object

## 7. Update Environment Variables

Create a `.env` file in the root directory and add your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 8. Required Firestore Indexes

The following composite indexes are required and defined in `firestore.indexes.json`:

1. **messages** collection:
   - `createdAt` (DESC) + `deleted` (ASC)
   - `senderId` (ASC) + `createdAt` (DESC)
   - `mentions` (ARRAY) + `createdAt` (DESC)
   - `mentionsEveryone` (ASC) + `createdAt` (DESC)
   - `type` (ASC) + `createdAt` (DESC)

2. **threads** collection:
   - `archived` (ASC) + `lastMessageAt` (DESC)

3. **friends** collection:
   - `userIds` (ARRAY) + `status` (ASC)

These will be auto-created when you run queries that need them, or you can deploy them using:

```bash
firebase deploy --only firestore:indexes
```

## 9. Set Up Firebase Admin SDK (for Backend)

1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file securely (DO NOT commit to Git)
4. Add to backend `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

## 10. Security Checklist

- ✅ Firestore security rules deployed
- ✅ Storage security rules deployed
- ✅ Email/Password authentication enabled
- ✅ Google OAuth enabled
- ✅ Required indexes created
- ✅ Environment variables configured
- ✅ Private keys secured (not in version control)

## 11. Testing

Test your Firebase setup:

```bash
npm run dev
```

The app should:
- Connect to Firebase without errors
- Show authentication UI
- Allow user registration/login

## 12. Optional: Local Emulators (Development)

For local development without using production Firebase:

```bash
# Install emulators
firebase init emulators

# Select:
# - Authentication Emulator
# - Firestore Emulator
# - Storage Emulator

# Start emulators
firebase emulators:start
```

Update `.env`:
```env
VITE_USE_FIREBASE_EMULATORS=true
```

## Troubleshooting

### Issue: "Permission denied" errors
- Check that security rules are deployed
- Verify user is authenticated
- Check user permissions in Firestore

### Issue: "Index required" errors
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Or click the link in the error message to create index in console

### Issue: "Storage upload failed"
- Check storage rules are deployed
- Verify file size limits
- Check file type restrictions

### Issue: "Authentication not working"
- Verify authentication providers are enabled
- Check authorized domains in Firebase Console
- Verify environment variables are correct

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Security](https://firebase.google.com/docs/storage/security)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

