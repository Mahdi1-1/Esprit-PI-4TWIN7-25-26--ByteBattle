# Research: Real-Time Notification System

**Feature**: 011-notification-system
**Date**: 2026-03-31
**Status**: Complete — all unknowns resolved

## R1: Notification Model — FK vs Snapshot for Sender

**Decision**: Use snapshot fields (`senderId`, `senderName`, `senderPhoto`) instead of a foreign key relation to User.

**Rationale**: Notifications are historical records. If a user changes their username or deletes their account, the notification should still display the original sender info at the time the event occurred. A foreign key would show the current (possibly deleted) username or break on cascade delete. The spec explicitly requires: "Notifications where they are senderId keep the senderName/senderPhoto snapshot (no FK dependency)."

**Alternatives considered**:
- FK relation to User (like current `actorId`): Rejected — breaks on user deletion, shows changed names
- Embedded JSON field: Rejected — less queryable than flat scalar fields
- Separate `NotificationActor` embedded type: Rejected — over-engineering for 3 fields

**Implementation**:
- Remove `actorId` + `actor` FK relation from `Notification` model
- Add `senderId String?`, `senderName String?`, `senderPhoto String?` as optional scalar fields
- `senderId` is stored as plain String (not `@db.ObjectId` FK) — no referential integrity needed
- System notifications have `senderId = null`, `senderName = "ByteBattle"`, `senderPhoto = null`

## R2: Deduplication Strategy

**Decision**: Check `(userId, type, entityId)` tuple within a 5-second window before inserting.

**Rationale**: Double-click on comment submit or rapid WebSocket event replay could create duplicate notifications. The 5-second window catches rapid duplicates without blocking legitimate repeated events (e.g., user comments on the same discussion 10 minutes later).

**Alternatives considered**:
- Unique compound index on `(userId, type, entityId)`: Rejected — would block all future notifications of the same type for the same entity (e.g., no second comment notification ever)
- Redis-based dedup with TTL: Rejected — adds Redis dependency for a simple check; a Prisma query with `createdAt > now() - 5s` is sufficient
- Frontend-side dedup: Rejected — doesn't prevent duplicate DB records

**Implementation**:
- In `NotificationEmitterService.emit()`, before `prisma.notification.create()`:
  ```typescript
  const recent = await this.prisma.notification.findFirst({
    where: {
      recipientId: userId,
      type,
      entityId,
      createdAt: { gte: new Date(Date.now() - 5000) }
    }
  });
  if (recent) return null; // Skip duplicate
  ```
- For broadcast notifications (`userId = '*'`), dedup is skipped (batch insert doesn't apply)

## R3: Broadcast Notification Architecture

**Decision**: Use `Prisma.createMany()` for batch DB insert + Socket.IO room `broadcast` for push.

**Rationale**: Creating 1000 individual notifications sequentially would be slow (~10s). `createMany()` executes a single MongoDB `insertMany` command. For WebSocket push, emitting to a global room is O(1) server-side — each connected client receives it.

**Alternatives considered**:
- Bull queue with individual jobs: Rejected — over-engineering for a synchronous batch insert; MongoDB `insertMany` is fast enough for 1000 documents
- Background cron job: Rejected — admin wants instant delivery, not delayed
- Server-Sent Events: Rejected — Socket.IO already established for real-time

**Implementation**:
- `NotificationEmitterService.emitBroadcast(data)`:
  1. Fetch all active user IDs: `prisma.user.findMany({ where: { status: 'active' }, select: { id: true } })`
  2. Build notification array, one per user
  3. `prisma.notification.createMany({ data: notificationArray })`
  4. `gateway.server.emit('notification:new', payload)` — emits to all connected sockets in namespace

## R4: Quiet Hours — Server-Side Enforcement

**Decision**: Quiet hours are checked server-side in `NotificationEmitterService.emit()`. During quiet hours, the notification is persisted but WebSocket push is suppressed.

**Rationale**: Checking quiet hours client-side would still show the toast; the goal is zero client disruption during quiet hours. The user sees notifications when they next open the app.

**Alternatives considered**:
- Client-side filtering (receive but don't display): Rejected — still wakes the WebSocket, defeats the purpose
- Separate "pending" queue with delayed delivery: Rejected — over-engineering; the notification already exists in DB and will appear on next page load
- Timezone-aware quiet hours: DEFERRED — current implementation uses server time (UTC). If needed later, add `timezone` field to `NotificationPreference`

**Implementation**:
- `NotificationPreference` stores `quietStart` and `quietEnd` as `"HH:mm"` strings
- `NotificationEmitterService` checks: `if (isQuietHours(preference) && priority !== 'critical') skipPush = true`
- `isQuietHours()` helper compares current server time against `quietStart`/`quietEnd` (handles overnight ranges like 22:00–08:00)

## R5: Notification Model Migration Strategy

**Decision**: Replace the existing `Notification` model fields in a single Prisma schema update, then update all existing service code in one pass.

**Rationale**: The existing model is tightly scoped to discussions (5 types, `actorId` FK). Rather than maintaining backward compatibility at the model level, we clean-cut migrate. The `discussions.service.ts` calls to `notificationsService.create()` are updated to use `notificationEmitterService.emit()` instead. Since MongoDB doesn't use traditional migrations, existing notification documents will lack new fields — these are handled with default values and nullable fields.

**Alternatives considered**:
- Dual-model approach (keep old `Notification` + add `NotificationV2`): Rejected — creates permanent technical debt; single model is cleaner
- Gradual field addition without removing old fields: Rejected — `actorId` FK creates cascade issues; cleaner to replace
- Data migration script for existing notifications: DEFERRED — existing notifications are low-value discussion alerts; acceptable to let them be orphaned (no `category`/`priority` fields → filtered out by new queries that require `category`)

**Implementation**:
- Update `schema.prisma`: Remove `actorId`/`actor` relation, `targetId`/`targetType`. Add new fields with defaults
- Run `npx prisma db push` (MongoDB, no migration files needed)
- Update `discussions.service.ts` to use `NotificationEmitterService.emit()` instead of `NotificationsService.create()`
- Old notification documents in MongoDB will have missing fields — new queries filter by `category IS NOT NULL`

## R6: Toast Notification Architecture

**Decision**: React Context + Portal-based toast system managed by `NotificationContext`.

**Rationale**: Toasts need to render regardless of the current route/page. A Context provider wraps the entire app and listens to WebSocket events. When a high/critical notification arrives, it adds to a toast queue. A portal-based container renders toasts in top-right corner.

**Alternatives considered**:
- Third-party toast library (react-toastify, sonner): Rejected — adds dependency; custom component is simple enough (~100 LOC) and matches the app's design system
- Redux/Zustand for toast state: Rejected — React Context is sufficient for UI-only transient state
- CSS-only animation without portal: Rejected — portal ensures toasts render above all z-index layers

**Implementation**:
- `NotificationContext.tsx`: Manages `notifications[]`, `unreadCount`, `toasts[]` state
- On WebSocket `notification:new` event:
  - Add to `notifications` array
  - Increment `unreadCount`
  - If priority is `high` or `critical`: add to `toasts[]` (max 3, FIFO)
- `NotificationToastContainer.tsx`: Portal rendering toast stack
- `NotificationToast.tsx`: Single toast with icon, title, message, auto-dismiss timer (5s high, manual critical)

## R7: Notification Page — Cursor vs Offset Pagination

**Decision**: Offset-based pagination with `skip`/`take` (page number + 20 per page).

**Rationale**: The spec says "20 per page, Load more button". Users don't need cursor-based pagination for personal notifications — the dataset per user is bounded (~hundreds, not millions). Offset pagination is simpler to implement and understand.

**Alternatives considered**:
- Cursor-based pagination (`cursor: lastId`): Rejected — overkill for per-user notifications; adds complexity for no measurable benefit at this scale
- Infinite scroll with intersection observer: Could be added later on top of offset pagination; "Load more" button is simpler UX
- Load all + client-side filter: Rejected — would be slow for users with 500+ notifications

**Implementation**:
- `GET /api/notifications?page=1&limit=20&category=hackathon&unreadOnly=true`
- Backend: `prisma.notification.findMany({ where: { recipientId, category?, isRead? }, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' } })`
- Response includes `{ data: Notification[], total: number, page: number, hasMore: boolean }`

## R8: NotificationPreference — Defaults Strategy

**Decision**: Lazy creation with in-memory defaults. If no `NotificationPreference` document exists for a user, apply defaults programmatically.

**Rationale**: Creating a preference document for every new user adds unnecessary writes. Most users never change defaults. The preference document is created only when a user explicitly saves settings.

**Alternatives considered**:
- Eager creation on user registration: Rejected — adds a write to every registration flow; most users never touch preferences
- Store defaults in a config file: Rejected — defaults are simple enough to be inline constants
- Null-coalescing at query time: This IS the chosen approach — `preference?.hackathon ?? true`

**Implementation**:
- Default constant:
  ```typescript
  const DEFAULT_PREFERENCES = {
    hackathon: true, duel: true, discussion: true, submission: true,
    canvas: true, achievement: true, system: true,
    inApp: true, email: false, push: false,
    quietStart: null, quietEnd: null,
  };
  ```
- `NotificationPreferenceService.getOrDefault(userId)`:
  1. `findUnique({ where: { userId } })`
  2. If null → return `DEFAULT_PREFERENCES`
  3. If exists → return merged with defaults (for any missing fields)
