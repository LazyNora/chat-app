<!-- 3f4c94b7-fc0c-426e-84d0-57e5d9bfbabf 20aefc24-8beb-42f0-87b6-183d292b25c4 -->
# Discord/Slack Clone - Rapid Prototype Roadmap

## Project Decisions Summary

**Tech Choices:**

- GIF Provider: Tenor API
- URL Previews: Self-hosted in backend
- Video: LiveKit Cloud with quality settings
- File Limit: 50MB (keep current)
- Languages: English + Vietnamese (i18n)
- Mobile: Responsive design + PWA

**Features Included:**

- ✅ Core UI (context menus, tooltips, mentions)
- ✅ Messaging (threads, pins, GIFs, replies)
- ✅ Management (channels, members, timeout/ban)
- ✅ Search & shortcuts
- ✅ Voice messages
- ✅ 2FA authentication
- ✅ Video quality settings
- ✅ Internationalization

**Features Explicitly Skipped:**

- ❌ Custom emoji uploads
- ❌ Webhooks & bots
- ❌ Server discovery
- ❌ Auto-moderation & content filtering
- ❌ Monetization features
- ❌ Analytics tracking
- ❌ Native mobile app

## Phase 1: Core UI Foundation (Week 1-2)

### 1.1 Context Menus & Tooltips

**Files:** `MessageContextMenu.tsx`, `ChannelContextMenu.tsx`, `MemberContextMenu.tsx`

Add context menus using shadcn `ContextMenu` and `DropdownMenu`:

- Messages: Edit, Delete, Pin, Copy, Reply, Create Thread, Copy Link
- Channels: Edit, Delete, Settings, Permissions, Copy Link, Mute
- Members: Profile, Kick, Timeout, Ban, Manage Roles, Send DM
- Add tooltips to ALL icon buttons using shadcn `Tooltip`

### 1.2 @Mention System

**Files:** `MentionAutocomplete.tsx`, enhance `MessageInput.tsx`

- Detect @ character in message input
- Show autocomplete dropdown with user search
- Support @everyone with permission check
- Render mentions as pills with user avatars
- Highlight mentions for current user (bg color)
- Store mention userIds in message document
- Trigger push notifications for mentioned users

### 1.3 Message Actions Enhancement

**Files:** Update `MessageItem.tsx`

- Add reply-to functionality (show parent message quoted)
- Add copy message content action
- Add "Jump to message" for replies
- Show edit indicator with timestamp

## Phase 2: Essential Messaging Features (Week 2-3)

### 2.1 Thread UI Components

**Files:** `ThreadPanel.tsx`, `ThreadList.tsx`, `ThreadView.tsx`, `ThreadButton.tsx`

- Create thread sidebar panel (slides in from right)
- Show thread list with parent message preview
- Full thread view with messages
- Add "Create Thread" button in message context menu
- Show thread count badge on parent messages
- Close thread panel, navigate back to main channel

### 2.2 Pin Messages UI

**Files:** `PinnedMessagesPanel.tsx`, `PinnedMessageBanner.tsx`

- Show pinned message banner at channel top (latest pin)
- Click banner to open panel with all pinned messages
- Add pin/unpin in message context menu
- Show pin icon on pinned messages
- Limit 50 pins per channel (enforce in UI)

### 2.3 GIF Support (Tenor API)

**Files:** `GifPicker.tsx`, `backend/src/services/tenor.ts`

- Add GIF button to `MessageInput`
- Create GIF picker modal with search
- Integrate Tenor API (get free API key)
- Display trending GIFs by default
- Search GIFs with debounced input
- Send GIF as message with URL
- Render GIF inline in message list

### 2.4 Self-Hosted URL Previews

**Files:** `LinkPreview.tsx`, `backend/src/services/urlPreview.ts`

- Backend: Add endpoint to fetch OpenGraph metadata
- Frontend: Detect URLs in message content
- Fetch preview data after message sent
- Store preview in message document
- Render preview card (title, description, image)
- Handle errors gracefully (no preview if fails)

## Phase 3: Channel & Member Management (Week 3-4)

### 3.1 Channel Categories

**Files:** `ChannelCategory.tsx`, `CategoryManager.tsx`, `src/services/categories.ts`

- Add categories collection: `groups/{id}/categories`
- Create category CRUD operations
- Group channels under categories in sidebar
- Add category create/edit/delete/collapse UI
- Drag-and-drop to reorder (use `@dnd-kit/core`)
- Update channel with `categoryId` field

### 3.2 Channel Settings Modal

**Files:** `ChannelSettingsModal.tsx`

- Add settings button in channel context menu
- Settings tabs: Overview, Permissions, Advanced
- Slowmode cooldown (0-6 hours)
- Max file size override (up to 50MB)
- Channel description/topic editor
- Channel permissions override UI
- Delete channel with confirmation

### 3.3 Member Management

**Files:** `MemberList.tsx`, `MemberCard.tsx`, `TimeoutModal.tsx`, `BanModal.tsx`

- Add members tab in group sidebar
- Show member list with roles (colored badges)
- Member search and role filtering
- Timeout modal: duration (10min, 1hr, 1day, 1week, custom)
- Ban modal: reason + option to delete messages
- Implement timeout & ban in `groups.ts` service
- Create `groups/{id}/timeouts` collection
- Create `groups/{id}/bans` collection

### 3.4 QR Code Invitations

**Files:** `InviteModal.tsx`

- Open invite modal from group dropdown
- Generate invite code using existing service
- Display QR code using `qrcode.react`
- Show invite link with copy button
- Settings: Max uses, expiration (never, 30min, 1hr, 1day, 7days)
- Download QR code as image
- List all active invites with usage stats

## Phase 4: Search & Navigation (Week 4-5)

### 4.1 Advanced Search

**Files:** `SearchModal.tsx`, `SearchFilters.tsx`, `SearchResults.tsx`

- Global search modal (Cmd/Ctrl+K)
- Search across all channels in current server
- Filters: User, Date range, Content type (text/file/link)
- Search operators: `from:@user`, `in:#channel`, `has:file`, `has:link`
- Display results with message context (before/after)
- Jump to message in channel on click
- Highlight search terms

### 4.2 Keyboard Shortcuts

**Files:** Enhance `useKeyboardShortcuts.ts`, `KeyboardShortcutsModal.tsx`

Implement shortcuts:

- `Cmd/Ctrl+K`: Open search
- `Cmd/Ctrl+/`: Show shortcuts help
- `Alt+Up/Down`: Navigate channels
- `Esc`: Close modals/panels
- `Cmd/Ctrl+Enter`: Send message
- `@`: Focus mention (if at start)
- `Cmd/Ctrl+Shift+M`: Mute/unmute (in voice)

Create help modal showing all shortcuts

### 4.3 Seen/Unseen Status

**Files:** Update `MessageList.tsx`, `ChannelItem.tsx`

- Track last seen message per channel per user
- Update `messageSeenStatus/{userId}/channels/{channelId}` on view
- Show unread badge on channels (message count)
- Mark channel as read when viewing
- Show "NEW" divider line in message list

## Phase 5: Voice & Video Enhancements (Week 5)

### 5.1 Voice Messages

**Files:** `VoiceMessageRecorder.tsx`, `VoiceMessagePlayer.tsx`

- Add microphone button to `MessageInput`
- Record audio using MediaRecorder API
- Show recording UI with timer and waveform
- Save as audio file to Firebase Storage
- Send as message with audio file attachment
- Playback with play/pause, seek, speed controls
- Show duration and waveform preview

### 5.2 Video Quality Settings

**Files:** `VideoQualitySettings.tsx`, enhance `VoiceControls.tsx`

- Add quality selector in voice channel
- Options: Auto, High (720p), Medium (480p), Low (360p)
- Store preference in user settings
- Pass quality to LiveKit connection
- Show bandwidth usage estimate
- Auto-adjust quality based on network

## Phase 6: Authentication & Security (Week 5-6)

### 6.1 Two-Factor Authentication (2FA)

**Files:** `TwoFactorSetup.tsx`, `TwoFactorVerify.tsx`, `backend/src/services/2fa.ts`

- Add 2FA setup in user settings
- Generate TOTP secret using `otplib`
- Display QR code for authenticator app
- Verify setup with code entry
- Store 2FA secret securely (Firebase Admin)
- Enforce 2FA on login if enabled
- Backup codes generation (10 codes)
- Disable 2FA with password confirmation

### 6.2 Enhanced User Settings

**Files:** Update `UserSettings.tsx`

Add sections:

- Account: Email, password, 2FA
- Profile: Display name, avatar, banner, about me
- Privacy: Online status visibility, DM permissions
- Notifications: Sound, desktop, push, per-channel overrides
- Appearance: Theme, language selector
- Voice/Video: Quality, input/output devices

## Phase 7: Internationalization (Week 6)

### 7.1 i18n Setup

**Files:** `src/i18n/`, `src/i18n/translations/en.json`, `src/i18n/translations/vi.json`

- Install `react-i18next` and `i18next`
- Create translation files for English and Vietnamese
- Translate all UI strings, error messages, notifications
- Add language selector in settings
- Store language preference in user settings
- Use translation hooks throughout app: `const { t } = useTranslation()`

Key translation areas:

- Navigation & menus
- Button labels & actions
- Error messages & toasts
- Settings labels
- Placeholder text
- Time/date formatting

## Phase 8: Limits & Configuration (Week 6)

### 8.1 Max Limits Configuration

**Files:** `src/config/limits.ts`, update relevant components

Define and enforce limits:

```typescript
export const LIMITS = {
  MAX_MEMBERS_PER_GROUP: 10000,
  MAX_CHANNELS_PER_GROUP: 200,
  MAX_ROLES_PER_GROUP: 250,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_MESSAGE_LENGTH: 2000,
  MAX_PINS_PER_CHANNEL: 50,
  MAX_ATTACHMENTS_PER_MESSAGE: 10,
  MAX_CUSTOM_STATUS_LENGTH: 128,
  MAX_CHANNEL_NAME_LENGTH: 100,
  MAX_GROUP_NAME_LENGTH: 100,
  SEARCH_RESULTS_LIMIT: 25,
  MESSAGE_HISTORY_LIMIT: 100,
};
```

Enforce limits in UI and services

### 8.2 Responsive Design Polish

**Files:** Update all components

- Test on mobile viewports (375px, 768px, 1024px)
- Optimize sidebar collapsing on mobile
- Touch-friendly button sizes (min 44x44px)
- Mobile-specific navigation (bottom nav?)
- Swipe gestures for common actions
- PWA manifest and service worker optimization

## Phase 9: Friends & DM (Week 7)

### 9.1 Enhanced Friends System

**Files:** `FriendsPage.tsx`, `FriendsList.tsx`, `AddFriendModal.tsx`

- Create dedicated Friends page/panel
- Tabs: All Friends, Pending, Blocked, Add Friend
- Friend cards with online status
- Add friend by username#discriminator
- Accept/decline friend requests with notifications
- Block/unblock users
- Remove friend with confirmation

### 9.2 Direct Messages UI

**Files:** `DMList.tsx`, `DMConversation.tsx`

- Show DM conversations in left sidebar (separate section)
- Unread badges on DMs
- Create new DM from friend list
- Group DMs support (future: skip for now)
- DM-specific settings (mute, close DM)

## Phase 10: Polish & Production Ready (Week 7-8)

### 10.1 Error Handling

**Files:** `ErrorBoundary.tsx`, update all components

- Add error boundaries at route level
- Graceful error messages with retry buttons
- Handle offline state gracefully
- Show connection status indicator
- Retry failed operations automatically
- Log errors to console (no analytics)

### 10.2 Loading States

**Files:** Skeleton components

- Add skeleton loaders for all lists
- Loading spinners for async actions
- Optimistic UI updates where possible
- Disable buttons during operations
- Progress indicators for file uploads

### 10.3 Performance Optimization

**Files:** Various

- Implement React.memo for expensive components
- Virtual scrolling for messages (use `react-virtual`)
- Lazy load images with blur placeholder
- Code splitting with React.lazy
- Debounce expensive operations (search, typing)
- Optimize bundle size

## Backend Enhancements

### Add to `backend/src/`:

1. **`routes/tenor.ts`**: Tenor GIF API proxy
2. **`routes/urlPreview.ts`**: Fetch OpenGraph metadata
3. **`routes/2fa.ts`**: 2FA setup and verification
4. **`services/tenor.ts`**: Tenor API integration
5. **`services/urlPreview.ts`**: URL metadata fetching
6. **`services/2fa.ts`**: TOTP generation and verification

### Install Backend Packages:

```bash
cd backend
npm install otplib qrcode node-fetch cheerio
```

## Database Schema Updates

### New Collections:

```
groups/{groupId}/categories          # Channel categories
groups/{groupId}/bans                # Banned users with reason & timestamp  
groups/{groupId}/timeouts            # Timed-out users with duration
users/{userId}/backupCodes           # 2FA backup codes (encrypted)
```

### Update Existing:

```
channels: add categoryId field
messages: add replyTo, parentMessageId for quotes
users: add 2faEnabled, 2faSecret, language, videQuality prefs
```

## Firestore Security Rules Updates

Update `firestore.rules` for new collections:

- Categories: Manage via manageChannels permission
- Bans: Manage via banMembers permission
- Timeouts: Manage via kickMembers permission
- Backup codes: Only user can read their own

## New shadcn/ui Components to Install

```bash
npx shadcn@latest add context-menu
npx shadcn@latest add tooltip
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add slider
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add scroll-area
npx shadcn@latest add collapsible
```

## .cursorrules File

Create `.cursorrules` in project root:

```markdown
# Discord Clone Development Rules

## Code Style
- Use TypeScript with strict mode
- Use functional components with hooks
- Use Tailwind CSS for styling
- Use shadcn/ui components for all UI elements
- Keep components small and focused (< 200 lines)
- Extract reusable logic into custom hooks

## Component Structure
- Place UI components in src/components/ui/
- Place feature components in appropriate subdirectories
- Export types alongside components
- Use proper TypeScript interfaces for props

## State Management
- Use Zustand for global state
- Use React hooks for local state
- Keep stores in src/stores/
- Use Firebase real-time listeners for live data

## Services & API
- Keep Firebase operations in src/services/
- Use async/await for all async operations
- Handle errors with try-catch
- Show user feedback with toast notifications

## UI Requirements
- Add context menus to all relevant items
- Add tooltips to all icon buttons
- Add loading states to all async actions
- Add error states with retry options
- Use shadcn components: ContextMenu, DropdownMenu, Tooltip, Dialog

## Accessibility
- Add ARIA labels to buttons without text
- Ensure keyboard navigation support
- Add proper focus management in modals
- Use semantic HTML elements

## Firebase Best Practices
- Batch writes when updating multiple documents
- Use security rules to validate data
- Denormalize data for performance
- Add indexes for all queries
- Use serverTimestamp() for timestamps

## File Organization
- One component per file
- Co-locate types with components
- Keep utility functions in src/lib/
- Keep hooks in src/hooks/

## Internationalization
- Use react-i18next for all text
- Support English (en) and Vietnamese (vi)
- Store translations in src/i18n/translations/
- Use translation keys, not hardcoded strings

## Performance
- Use React.memo for expensive components
- Implement virtualization for long lists
- Lazy load routes and heavy components
- Optimize images and assets
- Debounce search and typing indicators

## Responsive Design
- Mobile-first approach
- Test on 375px, 768px, 1024px viewports
- Touch targets min 44x44px
- Use Tailwind responsive classes (sm:, md:, lg:)
- PWA-ready with offline support
```

## Environment Variables

Add to `.env`:

```env
# Existing...
VITE_FIREBASE_API_KEY=...
VITE_PUSHER_KEY=...
VITE_LIVEKIT_URL=...

# New additions:
VITE_TENOR_API_KEY=your_tenor_key
VITE_BACKEND_URL=http://localhost:3001
```

Backend `.env`:

```env
# Existing...
FIREBASE_SERVICE_ACCOUNT=...

# New:
TENOR_API_KEY=your_tenor_key
```

## Implementation Order

**Week 1-2: Foundation**

1. Context menus & tooltips
2. @Mention system
3. Thread UI
4. Pin messages UI

**Week 3-4: Management**

5. Channel categories
6. Member management (timeout/ban)
7. Channel settings modal
8. QR invites

**Week 4-5: Search & Voice**

9. Advanced search
10. Keyboard shortcuts
11. Voice messages
12. Seen/unseen status

**Week 5-6: Features**

13. Video quality settings
14. 2FA authentication
15. GIF support (Tenor)
16. URL previews

**Week 6-7: UX**

17. Internationalization (en/vi)
18. Friends & DM enhancements
19. Max limits enforcement
20. Responsive design polish

**Week 7-8: Production**

21. Error handling & boundaries
22. Loading states & skeletons
23. Performance optimization
24. Testing & bug fixes

## Success Criteria

- ✅ All icon buttons have tooltips
- ✅ All items have context menus
- ✅ @Mentions work with autocomplete & notifications
- ✅ Threads fully functional with UI
- ✅ Pin messages visible with panel
- ✅ Members can be kicked, timed out, banned
- ✅ Channels organized in categories
- ✅ Search works with filters (Cmd+K)
- ✅ Keyboard shortcuts implemented
- ✅ QR codes generated for invites
- ✅ GIFs searchable and sendable (Tenor)
- ✅ Links show previews (self-hosted)
- ✅ Voice messages recordable
- ✅ 2FA setup and enforced
- ✅ Video quality adjustable
- ✅ App fully bilingual (en/vi)
- ✅ Responsive on mobile (PWA)
- ✅ Limits enforced throughout

## Estimated Timeline

**Total: 7-8 weeks** for complete prototype

- Phases 1-2: 2 weeks (Core UI)
- Phases 3-4: 2 weeks (Management & Search)
- Phases 5-6: 2 weeks (Voice, Video, Auth)
- Phases 7-10: 1-2 weeks (i18n, Polish, Production)

**Can be accelerated to 5-6 weeks with focused development!**

### To-dos

- [ ] Add context menus and tooltips throughout the app
- [ ] Implement @mention autocomplete and detection
- [ ] Build thread UI components (panel, list, view)
- [ ] Create pin messages UI with panel and indicators
- [ ] Build member list, context menu, and ban functionality
- [ ] Implement channel categories with drag-drop
- [ ] Create advanced search modal with filters
- [ ] Implement keyboard shortcuts throughout app
- [ ] Build QR code invitation modal
- [ ] Add seen/unseen message indicators
- [ ] Create custom user status picker
- [ ] Build enhanced friends panel and DM list
- [ ] Integrate GIF/sticker picker with Tenor API
- [ ] Add URL link preview rendering
- [ ] Create channel settings modal (cooldown, file limits)
- [x] Create .cursorrules file with development guidelines
- [ ] a