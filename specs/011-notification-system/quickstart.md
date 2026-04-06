# Quick Start: Real-Time Notification System

**Feature**: 011-notification-system
**Date**: 2026-03-31

## Prerequisites

- Node.js 18+
- pnpm installed globally
- MongoDB running (local or Atlas)
- Redis running (for Bull queue / judge-worker)
- Backend `.env` configured (`DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`)

## Setup

### 1. Install dependencies

```bash
cd /home/mahdi-masmoudi/Bureau/ByteBattle2-officiel
pnpm install           # root workspace
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 2. Update Prisma schema and regenerate client

After modifying `backend/prisma/schema.prisma` (Notification model refactor + NotificationPreference):

```bash
cd backend
npx prisma generate    # Regenerate Prisma client with new/modified models
npx prisma db push     # Push schema changes to MongoDB (no migration files for Mongo)
```

**Important**: Existing `Notification` documents in MongoDB will NOT have the new fields (`category`, `priority`, `title`, `message`, etc.). New queries should filter `category IS NOT NULL` or handle legacy documents gracefully.

### 3. Start services

```bash
# Terminal 1: Backend
cd backend && pnpm run start:dev

# Terminal 2: Frontend
cd frontend && pnpm run dev

# Terminal 3 (optional): Judge Worker
cd judge-worker && pnpm run start:dev
```

### 4. Verify the feature

#### 4.1 Notification Preferences

1. Log in as any user
2. Navigate to **Settings → Notifications**
3. Verify category toggles (all ON by default) and quiet hours inputs
4. Toggle "Discussion" OFF, save
5. Verify save success toast

#### 4.2 Bell Icon & Dropdown

1. Look at the Navbar — bell icon should be visible
2. If unread count > 0, a red badge should show
3. Click the bell — dropdown shows latest 5 notifications
4. Click "View all" — navigates to `/notifications`

#### 4.3 Notifications Page

1. Navigate to `/notifications`
2. Verify category tabs: All | Hackathon | Duel | Discussion | Submission | Achievement | System
3. Toggle "Unread only" — filters to unread
4. Select notifications via checkboxes → "Mark read" or "Archive"
5. Click "Load more" at bottom (if 20+ notifications)

#### 4.4 Discussion Integration

1. Create a discussion post with User A
2. Log in as User B and comment on User A's post
3. User A should:
   - See bell badge increment
   - See `discussion_reply` notification in dropdown
   - See toast popup (high priority)
4. Verify User B does NOT receive a self-notification

#### 4.5 Hackathon Integration

1. Create a hackathon via admin panel
2. Register participants
3. Transition hackathon: lobby → checkin
4. Verify all participants receive `hackathon_starting` notification
5. Transition to active → verify `hackathon_active` (critical priority toast)

#### 4.6 Toast Notifications

1. Trigger a `high` priority notification
2. Verify toast appears in top-right corner
3. After 5 seconds, verify it auto-dismisses
4. Trigger a `critical` notification
5. Verify toast has red border and does NOT auto-dismiss
6. Click ✕ to dismiss manually

#### 4.7 Quiet Hours

1. Set quiet hours 00:00–23:59 (all day) in Settings → Notifications
2. Trigger a `medium` priority event
3. Verify NO toast appears and bell doesn't increment
4. Refresh page → notification appears in the list (it was persisted)
5. Trigger a `critical` event → verify it DOES appear (critical overrides quiet hours)

## Running Tests

```bash
# Backend unit tests
cd backend
npx jest --testPathPattern="notifications" --verbose

# Individual test files
npx jest notification-emitter.service.spec.ts --verbose
npx jest notification-preference.service.spec.ts --verbose
npx jest notifications.controller.spec.ts --verbose
```

## Key Files

| File | Role |
|------|------|
| `backend/prisma/schema.prisma` | Notification + NotificationPreference models |
| `backend/src/notifications/notification-emitter.service.ts` | Core engine: emit, dedup, preferences, quiet hours, broadcast |
| `backend/src/notifications/notification-preference.service.ts` | Preference CRUD + defaults |
| `backend/src/notifications/notifications.controller.ts` | 9 REST endpoints |
| `backend/src/notifications/notifications.gateway.ts` | WebSocket push: emitToUser, emitBroadcast |
| `frontend/src/context/NotificationContext.tsx` | Global state + WebSocket subscription |
| `frontend/src/components/NotificationBell.tsx` | Bell icon + dropdown |
| `frontend/src/components/NotificationToast.tsx` | Toast popup component |
| `frontend/src/pages/NotificationsPage.tsx` | Full notifications page |
| `frontend/src/services/notificationsService.ts` | REST + Socket.IO client service |
| `frontend/src/types/notification.types.ts` | TypeScript types/enums |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Bell badge stuck at 0 | Check WebSocket connection in browser DevTools (Network → WS tab). Ensure `/notifications` namespace connects |
| "Cannot find module '@prisma/client'" | Run `npx prisma generate` in `/backend` |
| Toast not appearing | Check notification priority — only `high` and `critical` trigger toasts |
| Quiet hours not working | Verify `quietStart`/`quietEnd` format is `"HH:mm"` (24-hour). Times are server-relative (UTC) |
| Old notifications missing fields | Legacy documents lack `category`/`priority`. Run a migration script or accept they won't appear in filtered views |
