# Data Model: Real-Time Notification System

**Feature**: 011-notification-system
**Date**: 2026-03-31

## Entities Modified

### Notification (Major Refactor)

The existing `Notification` model is refactored from a discussion-only 5-type model to a universal 32-type, 7-category notification system.

**Before (current schema)**:
```prisma
model Notification {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  recipientId String   @db.ObjectId
  recipient   User     @relation("UserNotifications", fields: [recipientId], references: [id])
  actorId     String   @db.ObjectId
  actor       User     @relation("UserNotificationActors", fields: [actorId], references: [id])
  type        String   // 5 discussion types
  targetId    String   @db.ObjectId
  targetType  String   // "discussion" | "comment"
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

**After (new schema)**:

| Field | Type | Default | Required | Description |
|-------|------|---------|----------|-------------|
| `id` | ObjectId | auto | ✅ | Primary key |
| `recipientId` | ObjectId (FK → User) | — | ✅ | Target user who receives the notification |
| `type` | String | — | ✅ | One of 32 notification types (e.g., `hackathon_starting`, `duel_result`, `discussion_reply`) |
| `category` | String | — | ✅ | One of 7 categories: `hackathon`, `duel`, `discussion`, `submission`, `canvas`, `achievement`, `system` |
| `priority` | String | `'medium'` | ✅ | One of 4 levels: `critical`, `high`, `medium`, `low` |
| `title` | String | — | ✅ | Short notification title (e.g., "Hackathon Starting! 🏁") |
| `message` | String | — | ✅ | Notification body text (e.g., "CodeStorm 2026 begins in 30 minutes") |
| `actionUrl` | String? | null | ❌ | Deep link URL (e.g., `/hackathon/abc123/workspace`) |
| `entityId` | String? | null | ❌ | ID of the related entity (hackathon, duel, discussion, etc.) |
| `entityType` | String? | null | ❌ | Type of entity: `Hackathon`, `Duel`, `Discussion`, `Submission`, `Challenge`, `User` |
| `senderId` | String? | null | ❌ | User ID of the actor (snapshot, NOT a FK). Null for system notifications |
| `senderName` | String? | null | ❌ | Snapshot of actor's username at notification time |
| `senderPhoto` | String? | null | ❌ | Snapshot of actor's profileImage at notification time |
| `isRead` | Boolean | `false` | ✅ | Whether the user has read/clicked the notification |
| `readAt` | DateTime? | null | ❌ | Timestamp when marked as read |
| `isArchived` | Boolean | `false` | ✅ | Whether the user archived (soft-deleted) the notification |
| `createdAt` | DateTime | `now()` | ✅ | Creation timestamp |

**Prisma Schema**:
```prisma
model Notification {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  recipientId String    @db.ObjectId
  recipient   User      @relation("UserNotifications", fields: [recipientId], references: [id])
  type        String
  category    String    // hackathon | duel | discussion | submission | canvas | achievement | system
  priority    String    @default("medium") // critical | high | medium | low
  title       String
  message     String
  actionUrl   String?
  entityId    String?
  entityType  String?
  senderId    String?
  senderName  String?
  senderPhoto String?
  isRead      Boolean   @default(false)
  readAt      DateTime?
  isArchived  Boolean   @default(false)
  createdAt   DateTime  @default(now())

  @@index([recipientId, isRead, createdAt(sort: Desc)])
  @@index([recipientId, category, createdAt(sort: Desc)])
  @@index([recipientId, type, entityId, createdAt(sort: Desc)])  // deduplication index
}
```

**Indexes**:
- `[recipientId, isRead, createdAt DESC]` — primary list query (unread-first, newest-first)
- `[recipientId, category, createdAt DESC]` — category tab filtering
- `[recipientId, type, entityId, createdAt DESC]` — deduplication lookups

**Breaking changes**:
- Removed: `actorId` (FK → User), `actor` relation, `targetId`, `targetType`
- Removed from User model: `notificationsActed Notification[] @relation("UserNotificationActors")`
- Added: 10 new fields (category, priority, title, message, actionUrl, entityId, entityType, senderId, senderName, senderPhoto, readAt, isArchived)

---

### NotificationPreference (New)

Per-user notification settings with per-category toggles and quiet hours.

| Field | Type | Default | Required | Description |
|-------|------|---------|----------|-------------|
| `id` | ObjectId | auto | ✅ | Primary key |
| `userId` | ObjectId (FK → User) | — | ✅ | Unique — one preference per user |
| `hackathon` | Boolean | `true` | ✅ | Enable hackathon notifications |
| `duel` | Boolean | `true` | ✅ | Enable duel notifications |
| `discussion` | Boolean | `true` | ✅ | Enable discussion notifications |
| `submission` | Boolean | `true` | ✅ | Enable submission notifications |
| `canvas` | Boolean | `true` | ✅ | Enable canvas notifications |
| `achievement` | Boolean | `true` | ✅ | Enable achievement notifications |
| `system` | Boolean | `true` | ✅ | Enable system notifications |
| `inApp` | Boolean | `true` | ✅ | Enable in-app notifications (bell + page) |
| `email` | Boolean | `false` | ✅ | Enable email notifications (future) |
| `push` | Boolean | `false` | ✅ | Enable push notifications (future) |
| `quietStart` | String? | null | ❌ | Quiet hours start time ("HH:mm" format, e.g., "22:00") |
| `quietEnd` | String? | null | ❌ | Quiet hours end time ("HH:mm" format, e.g., "08:00") |
| `updatedAt` | DateTime | `now()` | ✅ | Last update timestamp |

**Prisma Schema**:
```prisma
model NotificationPreference {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  userId      String    @unique @db.ObjectId
  user        User      @relation(fields: [userId], references: [id])
  hackathon   Boolean   @default(true)
  duel        Boolean   @default(true)
  discussion  Boolean   @default(true)
  submission  Boolean   @default(true)
  canvas      Boolean   @default(true)
  achievement Boolean   @default(true)
  system      Boolean   @default(true)
  inApp       Boolean   @default(true)
  email       Boolean   @default(false)
  push        Boolean   @default(false)
  quietStart  String?
  quietEnd    String?
  updatedAt   DateTime  @updatedAt
}
```

**User model addition**:
```prisma
// In User model:
notificationPreference NotificationPreference?
```

---

### User (Modified)

| Change | Before | After |
|--------|--------|-------|
| Remove | `notificationsActed Notification[] @relation("UserNotificationActors")` | (deleted) |
| Add | — | `notificationPreference NotificationPreference?` |

---

## Notification Type Catalog

### Category: `hackathon` (8 types)

| Type | Priority | Title Template | Message Template | actionUrl |
|------|----------|---------------|-----------------|-----------|
| `hackathon_starting` | high | "Hackathon Starting! 🏁" | "{name} begins in 30 minutes" | `/hackathon/{id}/lobby` |
| `hackathon_active` | critical | "Hackathon Live! 🔥" | "{name} is now active — start coding!" | `/hackathon/{id}/workspace` |
| `hackathon_ended` | medium | "Hackathon Ended" | "{name} has ended. Check your results!" | `/hackathon/{id}/results` |
| `hackathon_team_joined` | medium | "New Team Member" | "{senderName} joined your team" | `/hackathon/{id}/lobby` |
| `hackathon_team_left` | medium | "Team Member Left" | "{senderName} left your team" | `/hackathon/{id}/lobby` |
| `hackathon_clarification` | high | "📢 Clarification Posted" | "Admin posted a clarification for {name}" | `/hackathon/{id}/workspace` |
| `hackathon_anticheat_alert` | critical | "⚠️ Anti-Cheat Alert" | "Violation detected: {senderName} in {name}" | `/admin/hackathons/{id}/monitoring` |
| `hackathon_submission_ac` | medium | "Challenge Solved! ✅" | "Your team solved {challengeName}" | `/hackathon/{id}/workspace` |

### Category: `duel` (5 types)

| Type | Priority | Title Template | Message Template | actionUrl |
|------|----------|---------------|-----------------|-----------|
| `duel_matched` | critical | "Duel Found! ⚔️" | "You've been matched with {senderName}" | `/duel/room/{id}` |
| `duel_result` | high | "Victory! 🏆" / "Defeat" / "Draw 🤝" | "You {result} against {senderName}" | `/duel/room/{id}` |
| `duel_elo_change` | medium | "ELO Updated" | "Your ELO changed by {delta}" | `/leaderboard` |
| `duel_streak` | low | "Win Streak! 🔥" | "{count}-game win streak!" | `/profile` |
| `duel_challenge` | high | "Duel Challenge" | "{senderName} challenged you to a duel" | `/duel/room/{id}` |

### Category: `discussion` (5 types)

| Type | Priority | Title Template | Message Template | actionUrl |
|------|----------|---------------|-----------------|-----------|
| `discussion_reply` | high | "New Reply" | "{senderName} commented on your post" | `/discussion/{id}` |
| `discussion_best_answer` | medium | "Best Answer! ⭐" | "Your answer was marked as best" | `/discussion/{id}` |
| `discussion_vote` | low | "Vote Milestone 🎯" | "Your post reached {count} votes" | `/discussion/{id}` |
| `discussion_flagged` | high | "Content Flagged ⚠️" | "Your content was flagged for review" | `/discussion/{id}` |
| `discussion_mention` | medium | "You were mentioned" | "{senderName} mentioned you" | `/discussion/{id}` |

### Category: `submission` (4 types)

| Type | Priority | Title Template | Message Template | actionUrl |
|------|----------|---------------|-----------------|-----------|
| `submission_accepted` | medium | "Submission Accepted ✅" | "Your solution to {challengeName} was accepted" | `/challenge/{id}` |
| `submission_rejected` | low | "Submission Rejected ❌" | "Your solution to {challengeName} failed" | `/challenge/{id}` |
| `submission_first_ac` | high | "First AC! 🎉" | "You solved {challengeName} for the first time" | `/challenge/{id}` |
| `submission_review` | medium | "Code Review Ready" | "Your submission is ready for review" | `/challenge/{id}/submissions` |

### Category: `canvas` (3 types)

| Type | Priority | Title Template | Message Template | actionUrl |
|------|----------|---------------|-----------------|-----------|
| `canvas_completed` | medium | "Canvas Complete! 🎨" | "You completed the {canvasName} canvas" | `/canvas` |
| `canvas_streak` | low | "Canvas Streak! 🔥" | "{count}-day canvas streak!" | `/canvas` |
| `canvas_new` | low | "New Canvas Available" | "A new canvas challenge is available" | `/canvas` |

### Category: `achievement` (4 types)

| Type | Priority | Title Template | Message Template | actionUrl |
|------|----------|---------------|-----------------|-----------|
| `achievement_unlocked` | high | "Achievement Unlocked! 🏅" | "You earned: {badgeName}" | `/profile` |
| `achievement_level_up` | medium | "Level Up! ⬆️" | "You reached level {level}" | `/profile` |
| `achievement_rank_change` | medium | "Rank Changed" | "You moved to rank #{rank}" | `/leaderboard` |
| `achievement_milestone` | low | "Milestone! 🎯" | "{description}" | `/profile` |

### Category: `system` (3 types)

| Type | Priority | Title Template | Message Template | actionUrl |
|------|----------|---------------|-----------------|-----------|
| `system_announcement` | high | "📢 Announcement" | "{message}" | null |
| `system_maintenance` | critical | "⚠️ Maintenance" | "Scheduled maintenance at {time}" | null |
| `security_alert` | critical | "🔒 Security Alert" | "{message}" | `/settings` |

## State Transitions

### Notification Lifecycle

```
Created (isRead: false, isArchived: false)
  │
  ├─ User clicks notification ──→ Read (isRead: true, readAt: now())
  │                                  │
  │                                  ├─ User archives ──→ Archived (isArchived: true)
  │                                  └─ User deletes ──→ Hard deleted
  │
  ├─ User marks all read ──→ Read (isRead: true, readAt: now())
  │
  └─ User archives unread ──→ Archived (isRead: false, isArchived: true)
```

### NotificationPreference Lifecycle

```
Not exists (defaults apply: all ON, inApp ON, email/push OFF, no quiet hours)
  │
  └─ User saves settings ──→ Created/Upserted (custom values)
       │
       └─ User saves again ──→ Updated (updatedAt refreshed)
```
