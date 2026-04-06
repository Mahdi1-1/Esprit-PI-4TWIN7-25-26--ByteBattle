# Feature Specification: 🔔 Real-Time Notification System

**Feature Branch**: `011-notification-system`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "Système de notifications temps réel couvrant hackathons, duels, discussions, submissions, canvas, achievements et système — avec bell, toasts, page dédiée et préférences utilisateur"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Notification Engine (Priority: P1)

As a backend module (hackathons, duels, discussions, etc.), I want to call a centralized `NotificationEmitterService.emit()` so that notifications are persisted in MongoDB AND pushed via WebSocket to connected users in a single call.

**Why this priority**: Without the core engine, no other notification feature can function. This is the foundation that every other story depends on.

**Independent Test**: Can be fully tested by calling `NotificationEmitterService.emit()` directly from a test and verifying (1) a `Notification` document is created in MongoDB, (2) a WebSocket event `notification:new` is emitted to the target user's room, (3) user preferences are respected, (4) quiet hours suppress push but not persistence.

**Acceptance Scenarios**:

1. **Given** any module has an event to notify about, **When** it calls `NotificationEmitter.emit({ userId, type, category, priority, title, message, actionUrl?, entityId?, entityType?, senderId?, senderName?, senderPhoto? })`, **Then** a `Notification` document is created in MongoDB with `isRead: false, isArchived: false, createdAt: now()`
2. **Given** the target user is connected via WebSocket, **When** NotificationEmitter persists the notification, **Then** the notification payload is pushed to socket room `user:{userId}` via event `notification:new` within 500ms
3. **Given** the target user is NOT connected via WebSocket, **When** NotificationEmitter persists the notification, **Then** the notification is stored and will appear when the user next loads the app (via REST `GET /notifications`)
4. **Given** the notification type belongs to a category the user has disabled in preferences, **When** NotificationEmitter is called, **Then** the notification is NOT created (skipped entirely)
5. **Given** the notification priority is `critical`, **When** the user has that category disabled in preferences, **Then** the notification IS created anyway (critical overrides all preferences)
6. **Given** current server time is within the user's configured quiet hours AND priority ≠ `critical`, **When** NotificationEmitter is called, **Then** the notification is persisted but NOT pushed via WebSocket — it appears on next page load
7. **Given** recipient is a broadcast (`userId = '*'` for `system_announcement`), **When** NotificationEmitter is called, **Then** one `Notification` document per active user is created via batch insert

---

### User Story 2 - Bell Icon & Dropdown in Navbar (Priority: P1)

As a logged-in user, I want to see a bell icon in the Navbar with my unread count and a dropdown preview of recent notifications, so that I know when something needs my attention without navigating away.

**Why this priority**: The bell is the primary discovery mechanism. Without it, users have no way to know notifications exist.

**Independent Test**: Can be fully tested by logging in, triggering a notification (e.g., via admin action), and verifying the bell badge increments, the dropdown shows the notification, and clicking it navigates to the correct page.

**Acceptance Scenarios**:

1. **Given** user has 0 unread notifications, **When** page loads, **Then** bell icon shown with no badge
2. **Given** user has 1–99 unread notifications, **When** page loads or WebSocket push arrives, **Then** red badge with exact count (e.g., "7") displayed
3. **Given** user has 100+ unread notifications, **When** page loads, **Then** badge shows "99+"
4. **Given** user clicks the bell icon, **When** dropdown opens, **Then** shows latest 5 notifications with: category icon, title (bold), message (truncated 80 chars), relative time ("2m ago"), unread indicator (blue dot for unread)
5. **Given** user clicks a notification in the dropdown, **When** navigation occurs, **Then** browser navigates to `actionUrl` AND notification is marked as `isRead: true, readAt: now()`
6. **Given** user clicks "Mark all as read" in dropdown footer, **When** action completes, **Then** all unread notifications for this user are set to `isRead: true, readAt: now()` AND badge disappears
7. **Given** user clicks "View all" in dropdown footer, **When** navigation occurs, **Then** browser navigates to `/notifications`
8. **Given** dropdown is open AND a new notification arrives via WebSocket, **When** push event received, **Then** new notification appears at top of dropdown with slide-in animation

---

### User Story 3 - Full Notifications Page (Priority: P1)

As a logged-in user, I want to see all my notifications with filtering, category tabs, and bulk actions on a dedicated page, so that I can manage my notification history.

**Why this priority**: The page is the primary management interface. Users need to review, filter, and bulk-act on their notifications.

**Independent Test**: Can be fully tested by navigating to `/notifications` and verifying list rendering, pagination, category filtering, unread toggle, mark-read, archive, and empty state.

**Acceptance Scenarios**:

1. **Given** user navigates to `/notifications`, **When** page loads, **Then** notifications listed newest-first, paginated (20 per page, "Load more" button)
2. **Given** user clicks a category tab (All | Hackathon | Duel | Discussion | Submission | Achievement | System), **When** tab active, **Then** list filters to that category only
3. **Given** user clicks "Unread only" toggle, **When** toggle ON, **Then** only notifications with `isRead: false` shown
4. **Given** user clicks on a notification row, **When** navigation occurs, **Then** browser navigates to `actionUrl` AND notification marked as read
5. **Given** user clicks trash icon on a notification, **When** action completes, **Then** notification set to `isArchived: true` and disappears from list with fade-out
6. **Given** user selects multiple notifications via checkboxes AND clicks "Mark read", **When** action completes, **Then** all selected set to `isRead: true`
7. **Given** user selects multiple notifications AND clicks "Archive", **When** action completes, **Then** all selected set to `isArchived: true`
8. **Given** user has no notifications, **When** page loads, **Then** empty state shown: bell illustration + "You're all caught up!" message
9. **Given** each notification row, **When** rendered, **Then** displays: colored left border (priority), category icon, sender avatar (if applicable), title (bold), message (gray, truncated), relative time, blue dot (if unread)

---

### User Story 4 - Hackathon Notifications Integration (Priority: P1)

As a hackathon participant, I want to receive real-time notifications for hackathon lifecycle events so that I never miss a start time, team update, or clarification.

**Why this priority**: Hackathons are time-critical. Missing a start notification means missing the competition entirely.

**Independent Test**: Can be fully tested by registering for a hackathon, having an admin advance its phase, and verifying the correct notification type appears in the bell and page.

**Acceptance Scenarios**:

1. **Given** hackathon transitions to `checkin`, **When** scheduler fires `transitionStatus`, **Then** all registered participants receive `hackathon_starting` notification (high priority, actionUrl: `/hackathon/{id}/lobby`)
2. **Given** hackathon transitions to `active`, **When** scheduler fires, **Then** all registered participants receive `hackathon_active` notification (critical priority, actionUrl: `/hackathon/{id}/workspace`)
3. **Given** hackathon transitions to `ended`, **When** scheduler fires, **Then** all registered participants receive `hackathon_ended` notification (medium priority, actionUrl: `/hackathon/{id}/results`)
4. **Given** user joins a team via code or solo, **When** `joinTeamByCode` / `joinSolo` completes, **Then** team captain receives `hackathon_team_joined` notification (medium, actionUrl: `/hackathon/{id}/lobby`)
5. **Given** user leaves a team, **When** `leaveTeam` completes, **Then** team captain receives `hackathon_team_left` notification (medium, actionUrl: `/hackathon/{id}/lobby`)
6. **Given** admin posts a clarification, **When** `createClarification` completes, **Then** all participants receive `hackathon_clarification` notification (high, actionUrl: `/hackathon/{id}/workspace`)
7. **Given** anti-cheat violation detected, **When** gateway `handleAnticheatEvent` fires, **Then** all admin users receive `hackathon_anticheat_alert` notification (critical, actionUrl: `/admin/hackathons/{id}/monitoring`)

---

### User Story 5 - Duel Notifications Integration (Priority: P2)

As a duel player, I want to receive notifications for match results, challenges, and ELO changes so that I stay engaged with the competitive system.

**Why this priority**: Duels are the primary competitive feature but are not as time-critical as hackathons.

**Independent Test**: Can be fully tested by completing a duel and verifying both players receive `duel_result` notifications with correct win/loss data.

**Acceptance Scenarios**:

1. **Given** matchmaking finds an opponent, **When** `duelMatched` event fires, **Then** both players receive `duel_matched` notification (critical, actionUrl: `/duel/room/{id}`)
2. **Given** duel completes, **When** `completeDuel` called, **Then** both players receive `duel_result` notification (high) with title "Victory! 🏆" or "Defeat" or "Draw" and ELO change in message
3. **Given** player's ELO changes by ≥ 50 points after a duel, **When** ELO update completes, **Then** player receives `duel_elo_change` notification (medium, actionUrl: `/leaderboard`)
4. **Given** player reaches win streak of 3, 5, or 10, **When** duel win recorded, **Then** player receives `duel_streak` notification (low, actionUrl: `/profile`)

---

### User Story 6 - Discussion Notifications Integration (Priority: P2)

As a discussion author, I want to know when someone replies to my posts or marks a best answer so that I stay engaged in conversations.

**Why this priority**: Drives community engagement but is not blocking for core competitive features.

**Independent Test**: Can be fully tested by creating a discussion, having another user comment on it, and verifying the author receives `discussion_reply` notification.

**Acceptance Scenarios**:

1. **Given** user adds a comment to a discussion, **When** `addComment` completes, **Then** post author receives `discussion_reply` notification (high, actionUrl: `/discussion/{id}`) — UNLESS the commenter IS the post author (no self-notification)
2. **Given** user's comment is marked as best answer, **When** `toggleBestAnswer` completes, **Then** comment author receives `discussion_best_answer` notification (medium, actionUrl: `/discussion/{id}`)
3. **Given** a post/comment reaches vote milestone (5, 10, 25, 50, 100), **When** upvote/downvote changes total to milestone, **Then** author receives `discussion_vote` notification (low, actionUrl: `/discussion/{id}`)
4. **Given** content is flagged, **When** flag action completes, **Then** content author receives `discussion_flagged` (high) AND all admins receive `discussion_flagged` (high)

---

### User Story 7 - Toast Notifications (Priority: P2)

As a logged-in user, I want to see a transient toast popup when an important notification arrives in real-time so that I immediately notice critical events.

**Why this priority**: Enhances real-time UX but the bell + page already cover basic notification visibility.

**Independent Test**: Can be fully tested by triggering a high-priority notification while on any page and verifying a toast appears, auto-dismisses after 5s (or persists for critical), and clicking it navigates correctly.

**Acceptance Scenarios**:

1. **Given** user is on any page, **When** a `high` or `critical` notification arrives via WebSocket, **Then** a toast appears in top-right corner with category icon + title + message (truncated 60 chars)
2. **Given** toast appeared with `high` priority, **When** 5 seconds elapse, **Then** toast auto-dismisses with fade-out animation
3. **Given** user clicks the toast body, **When** click event fires, **Then** browser navigates to `actionUrl`, toast dismisses, notification marked as read
4. **Given** user clicks ✕ button on toast, **When** click event fires, **Then** toast dismisses immediately without navigation
5. **Given** a `low` or `medium` priority notification arrives, **When** WebSocket push received, **Then** NO toast shown (bell badge updates silently)
6. **Given** multiple toasts fire within 1 second, **When** rendering, **Then** toasts stack vertically (max 3 visible), oldest dismissed first if overflow
7. **Given** `critical` priority notification, **When** toast appears, **Then** toast has red left border and does NOT auto-dismiss (must be manually closed or clicked)

---

### User Story 8 - User Notification Preferences (Priority: P3)

As a logged-in user, I want to control which notification categories I receive so that I'm not overwhelmed by notifications I don't care about.

**Why this priority**: Power-user feature. Defaults work fine for most users.

**Independent Test**: Can be fully tested by navigating to Settings → Notifications, disabling a category, triggering an event from that category, and verifying no notification is created.

**Acceptance Scenarios**:

1. **Given** user navigates to Settings → Notifications tab, **When** page loads, **Then** shows toggle switches for each category: Hackathon, Duel, Discussion, Submission, Canvas, Achievement, System — plus quiet hours inputs
2. **Given** user disables "Discussion" category, **When** a `discussion_reply` event fires for this user, **Then** notification is NOT created
3. **Given** user disables "System" category, **When** a `security_alert` (critical priority) fires, **Then** notification IS created (critical overrides user preference)
4. **Given** user sets quiet hours 22:00–08:00, **When** a `medium` priority event fires at 23:30, **Then** notification is persisted in DB but no WebSocket push — appears on next page load
5. **Given** user has never set preferences (no `NotificationPreference` document), **When** system checks preferences, **Then** defaults apply: all categories ON, inApp ON, email OFF, push OFF, no quiet hours
6. **Given** user changes toggles and clicks Save, **When** save completes, **Then** `NotificationPreference` document is upserted in DB and success toast shown

---

### Edge Cases

- **What happens when a user is deleted?** All their notifications are cascade-deleted. Notifications where they are `senderId` keep the `senderName`/`senderPhoto` snapshot (no FK dependency).
- **What happens when a hackathon is deleted?** Notifications with `entityType: "Hackathon"` and matching `entityId` remain (they are historical records) but `actionUrl` leads to a 404 — the notification page should handle this gracefully.
- **What happens when 1000+ users need a broadcast notification?** `NotificationEmitter` uses `Prisma.createMany()` for batch insert (not 1000 individual calls) and WebSocket room `broadcast` for push.
- **What happens when a user receives 50 notifications in 1 second?** Toasts cap at 3 visible. Bell badge updates once (debounced). Page loads via pagination.
- **What happens during a network disconnect?** WebSocket reconnects via `socket.io` auto-reconnect. On reconnect, client calls `GET /notifications/unread-count` to sync badge. Missed notifications are available via REST.
- **What happens when the same event fires twice?** (e.g., double-click on comment submit) `NotificationEmitter` should deduplicate by checking `(userId, type, entityId, createdAt within 5s)` before inserting.
- **How does system handle notification for a user who is both team captain AND participant?** They receive ONE notification (not two). The emitter deduplicates by `userId`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a centralized `NotificationEmitterService` that any backend module can inject and call to create notifications
- **FR-002**: System MUST persist all notifications in MongoDB with the `Notification` model schema defined in §6.1
- **FR-003**: System MUST push notifications to connected users via WebSocket event `notification:new` within 500ms of creation
- **FR-004**: System MUST support 32 notification types across 7 categories: hackathon (8), duel (5), discussion (5), submission (4), canvas (3), achievement (4), system (3)
- **FR-005**: System MUST enforce 4 priority levels: `critical` (always delivered), `high`, `medium`, `low`
- **FR-006**: System MUST display a bell icon in the Navbar with unread count badge (0=hidden, 1-99=number, 100+="99+")
- **FR-007**: System MUST provide a bell dropdown with the 5 most recent notifications and "Mark all read" + "View all" actions
- **FR-008**: System MUST provide a full notifications page at `/notifications` with category tabs, unread toggle, pagination (20/page), and bulk actions (mark read, archive)
- **FR-009**: System MUST mark notifications as read when user clicks them (sets `isRead: true, readAt: now()`)
- **FR-010**: System MUST allow users to archive notifications (sets `isArchived: true`, hidden from default view)
- **FR-011**: System MUST provide a `NotificationPreference` model allowing per-category on/off toggles and quiet hours
- **FR-012**: System MUST respect user preferences — disabled categories skip notification creation UNLESS priority is `critical`
- **FR-013**: System MUST suppress WebSocket push during quiet hours for non-critical notifications (persist only)
- **FR-014**: System MUST display toast notifications for `high` and `critical` priority events (auto-dismiss 5s for high, manual dismiss for critical)
- **FR-015**: System MUST deduplicate notifications with same `(userId, type, entityId)` within a 5-second window
- **FR-016**: System MUST support broadcast notifications (`system_announcement`) via batch insert to all active users
- **FR-017**: System MUST integrate with hackathon scheduler to emit lifecycle notifications (starting, active, ended)
- **FR-018**: System MUST integrate with hackathon team operations to emit team-joined/left notifications to captain
- **FR-019**: System MUST integrate with duel service to emit match/result/ELO/streak notifications
- **FR-020**: System MUST integrate with discussion service to emit reply/best-answer/vote-milestone/flag notifications
- **FR-021**: System MUST NOT send self-notifications (e.g., author commenting on own post)

### Key Entities

- **Notification**: A persistent record of an event notification — contains userId, type, category, priority, title, message, actionUrl, entityId/entityType, senderId/senderName/senderPhoto, isRead, readAt, isArchived, createdAt. Indexed on `[userId, isRead, createdAt]` and `[userId, category, createdAt]`.
- **NotificationPreference**: Per-user settings — contains userId (unique), per-category boolean toggles (hackathon, duel, discussion, submission, canvas, achievement, system), delivery channel flags (inApp, email, push), quiet hours (quietStart, quietEnd as "HH:mm" strings). Defaults: all ON, inApp ON, email/push OFF, no quiet hours.
- **User** (existing): Extended with `notifications Notification[]` and `notificationPreference NotificationPreference?` relations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Notifications are delivered via WebSocket within 500ms of the triggering event (measured by timestamp diff between event creation and `notification:new` socket emission)
- **SC-002**: Bell badge unread count is accurate within 1 second of any read/new event (no stale counts)
- **SC-003**: Notifications page loads 20 items in under 300ms (MongoDB indexed query on `userId + isRead + createdAt`)
- **SC-004**: Broadcast notifications to 1000 users complete within 5 seconds (batch insert + room broadcast)
- **SC-005**: Zero duplicate notifications for the same event (deduplication within 5s window)
- **SC-006**: Critical notifications are ALWAYS delivered regardless of user preference settings (100% delivery rate)
- **SC-007**: Quiet hours correctly suppress WebSocket push but NOT persistence (100% of quiet-hour notifications appear on next page load)
- **SC-008**: All 8 hackathon notification types fire correctly during a full hackathon lifecycle (lobby → checkin → active → frozen → ended)
- **SC-009**: Toast notifications render within 200ms of WebSocket receipt and auto-dismiss correctly (5s high, manual critical)
- **SC-010**: Notification preferences page saves within 500ms and immediately affects notification delivery
