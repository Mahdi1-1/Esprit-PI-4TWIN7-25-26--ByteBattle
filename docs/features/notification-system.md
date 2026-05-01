# Notification System

## Overview

A real-time, category-aware notification engine for ByteBattle. Delivers 32 notification types across 7 categories to users via WebSocket push and an in-app bell/dropdown with a full notifications page.

---

## Architecture

```
Event source (e.g. DuelsService.joinDuel)
       │
       ▼
NotificationEmitterService.emit(dto)
       │
       ├─ [1] Self-guard      → skip if userId === senderId
       ├─ [2] Pref check      → skip non-critical if category disabled
       ├─ [3] Dedup           → findFirst within 5 s (same userId+type+entityId)
       ├─ [4] Persist         → prisma.notification.create()
       ├─ [5] Quiet hours     → if in quiet window AND priority < critical → skip WS
       └─ [6] WS push         → NotificationsGateway.emitToUser(userId, notification)
```

### Broadcast flow (system announcements)
```
NotificationEmitterService.emitBroadcast(dto)
       │
       ├─ Fetch all active users
       ├─ prisma.notification.createMany()
       └─ NotificationsGateway.emitBroadcast('notification:new', payload)
```

---

## Notification Categories

| Category | Value | Description |
|---|---|---|
| Hackathon | `hackathon` | Team events, status transitions, results |
| Duel | `duel` | Match found, result, ELO milestones, streaks |
| Discussion | `discussion` | Replies, mentions, votes, best answer |
| Submission | `submission` | Grading results |
| Canvas | `canvas` | Collaborative canvas events |
| Achievement | `achievement` | Badges earned, level-up |
| System | `system` | Platform announcements, maintenance |

---

## Priority Levels

| Priority | Badge | Use case |
|---|---|---|
| `critical` | Red border | Security, urgent platform events — always delivered |
| `high` | Orange border | Duel matched, hackathon started, won/lost |
| `medium` | Blue border | Comment replies, team joins |
| `low` | Gray border | Upvotes, minor events |

---

## REST API

Base path: `POST /api/notifications` (all protected by JWT)

| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications` | Paginated list (`page`, `limit`, `category`, `unreadOnly`) |
| GET | `/api/notifications/unread-count` | `{ count: number }` |
| GET | `/api/notifications/preferences` | Get preferences (or defaults) |
| PUT | `/api/notifications/preferences` | Upsert preferences |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| PATCH | `/api/notifications/bulk/read` | Bulk mark read (`{ ids: string[] }`) |
| PATCH | `/api/notifications/bulk/archive` | Bulk archive |
| PATCH | `/api/notifications/:id/read` | Mark single as read |
| PATCH | `/api/notifications/:id/archive` | Archive single |
| DELETE | `/api/notifications/:id` | Delete single |

---

## WebSocket

- **Namespace**: `/notifications`
- **Events emitted to client**:
  - `notification:new` — new notification object
  - (legacy `new-notification` removed)

---

## Notification Preferences

Each user can store per-category, per-channel, and quiet-hours preferences.

```json
{
  "hackathon": true,
  "duel": true,
  "discussion": true,
  "submission": true,
  "canvas": true,
  "achievement": true,
  "system": true,
  "inApp": true,
  "email": false,
  "push": false,
  "quietStart": "22:00",
  "quietEnd": "08:00"
}
```

- If `category = false` → non-critical notifications for that category are suppressed.
- `critical` priority always bypasses category preference and quiet hours for DB persistence (WS push still suppressed during quiet hours).

---

## Frontend Components

| Component | Path | Description |
|---|---|---|
| `NotificationBell` | `components/NotificationBell.tsx` | Header bell with badge + 5-item dropdown |
| `NotificationsPage` | `pages/NotificationsPage.tsx` | Full page with tabs, filters, pagination, bulk actions |
| `NotificationToast` | `components/NotificationToast.tsx` | Single auto-dismissing toast with progress bar |
| `NotificationToastContainer` | `components/NotificationToastContainer.tsx` | Fixed top-right stack of toasts |
| `NotificationContext` | `context/NotificationContext.tsx` | Provides `notifications`, `unreadCount`, `toasts`, `markRead`, `markAllRead`, `removeToast` |

---

## Integration Points

### Hackathons
- `transitionStatus → active` → notify all participants "Hackathon started"
- `transitionStatus → ended` → notify all participants "Hackathon ended"
- `joinTeamByCode` → notify existing members "Someone joined"
- `leaveTeam` → notify remaining members "Member left"

### Duels
- `joinDuel` → notify both players "Matched"
- `endDuel` → notify both players with result + ELO
- ELO milestone (crosses 100-boundary) → achievement notification

### Discussions
- `voteDiscussion (upvote)` → notify post author
- `toggleBestAnswer` → notify comment author
- `createComment (reply)` → notify parent comment author
- `createComment (top-level)` → notify discussion author

---

## Database Schema

```prisma
model Notification {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  recipientId String   @db.ObjectId
  recipient   User     @relation("UserNotifications", fields: [recipientId], references: [id])
  type        String
  category    String
  priority    String   @default("medium")
  title       String
  message     String
  actionUrl   String?
  entityId    String?
  entityType  String?
  senderId    String?
  senderName  String?
  senderPhoto String?
  isRead      Boolean  @default(false)
  readAt      DateTime?
  isArchived  Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model NotificationPreference {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @unique @db.ObjectId
  user         User     @relation(fields: [userId], references: [id])
  hackathon    Boolean  @default(true)
  duel         Boolean  @default(true)
  discussion   Boolean  @default(true)
  submission   Boolean  @default(true)
  canvas       Boolean  @default(true)
  achievement  Boolean  @default(true)
  system       Boolean  @default(true)
  inApp        Boolean  @default(true)
  email        Boolean  @default(false)
  push         Boolean  @default(false)
  quietStart   String?
  quietEnd     String?
  updatedAt    DateTime @updatedAt
}
```

---

## Testing

```bash
# Run notification system tests
cd backend
npx jest --testPathPattern="notifications" --verbose
```

Test files:
- `notification-emitter.service.spec.ts` — 10 tests (emit pipeline, broadcast)
- `notification-preference.service.spec.ts` — 4 tests (getOrDefault, upsert)
- `notifications.controller.spec.ts` — 9 tests (all endpoints)
