# Tasks: Real-Time Notification System

**Input**: Design documents from `/specs/011-notification-system/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Included — Constitution IV (Testing Discipline) requires tests for all new services, controllers, and gateways.

**Organization**: Tasks grouped by user story (US1–US8) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prisma schema changes, shared types, and DTO definitions that all user stories depend on.

- [ ] T001 Refactor `Notification` model in `backend/prisma/schema.prisma` — remove `actorId`/`actor` FK + `targetId`/`targetType`, add `category`, `priority`, `title`, `message`, `actionUrl`, `entityId`, `entityType`, `senderId`, `senderName`, `senderPhoto`, `readAt`, `isArchived` fields. Add 3 indexes per data-model.md
- [ ] T002 Add `NotificationPreference` model in `backend/prisma/schema.prisma` — userId (unique FK), 7 category booleans, 3 channel booleans, quietStart/quietEnd strings, updatedAt
- [ ] T003 Update `User` model in `backend/prisma/schema.prisma` — remove `notificationsActed` relation, add `notificationPreference NotificationPreference?` relation
- [ ] T004 Run `npx prisma generate` and `npx prisma db push` to apply schema changes
- [ ] T005 [P] Create `CreateNotificationDto` in `backend/src/notifications/dto/create-notification.dto.ts` — userId, type, category, priority, title, message, actionUrl?, entityId?, entityType?, senderId?, senderName?, senderPhoto? with class-validator decorators
- [ ] T006 [P] Create `NotificationQueryDto` in `backend/src/notifications/dto/notification-query.dto.ts` — page, limit, category?, unreadOnly? with class-validator + class-transformer decorators
- [ ] T007 [P] Create `BulkNotificationDto` in `backend/src/notifications/dto/bulk-notification.dto.ts` — ids: string[] with class-validator
- [ ] T008 [P] Create `UpdateNotificationPreferenceDto` in `backend/src/notifications/dto/notification-preference.dto.ts` — 7 category booleans, 3 channel booleans, quietStart?, quietEnd? with class-validator
- [ ] T009 [P] Create frontend types in `frontend/src/types/notification.types.ts` — Notification interface, NotificationPreference interface, NotificationCategory enum, NotificationPriority enum, NotificationType enum (32 types), PaginatedResponse<T> generic

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core emitter service and preference service that ALL user stories depend on. Must complete before any story phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T010 Create `NotificationEmitterService` in `backend/src/notifications/notification-emitter.service.ts` — inject PrismaService + NotificationsGateway. Implement `emit({ userId, type, category, priority, title, message, actionUrl?, entityId?, entityType?, senderId?, senderName?, senderPhoto? })` with: (1) self-notification guard (senderId === userId → skip), (2) preference check (category disabled → skip, unless critical), (3) deduplication check (same userId+type+entityId within 5s → skip), (4) quiet hours check (suppress push, not persistence), (5) Prisma create, (6) gateway.emitToUser push
- [ ] T011 Implement `emitBroadcast()` method in `NotificationEmitterService` — fetch all active user IDs, build notification array, `prisma.notification.createMany()`, `gateway.server.emit('notification:new', payload)` for broadcast to all connected sockets
- [ ] T012 Create `NotificationPreferenceService` in `backend/src/notifications/notification-preference.service.ts` — implement `getOrDefault(userId)` (findUnique or return DEFAULT_PREFERENCES constant), `upsert(userId, dto)` (prisma.notificationPreference.upsert)
- [ ] T013 Add `isQuietHours(preference)` private helper in `NotificationEmitterService` — compare current server time against `quietStart`/`quietEnd` strings, handle overnight ranges (22:00–08:00)
- [ ] T014 Add `emitBroadcast()` method to `NotificationsGateway` in `backend/src/notifications/notifications.gateway.ts` — emit to all connected sockets in the `/notifications` namespace
- [ ] T015 Refactor `NotificationsService` in `backend/src/notifications/notifications.service.ts` — update `getAll()` to support pagination (skip/take/category/unreadOnly), add `archive(id, userId)`, `bulkMarkRead(ids, userId)`, `bulkArchive(ids, userId)`, `delete(id, userId)`. Remove `enforceMax100()`. Update `markRead()` to set `readAt: new Date()`. Filter `isArchived: false` by default
- [ ] T016 Update `NotificationsModule` in `backend/src/notifications/notifications.module.ts` — add `NotificationEmitterService` and `NotificationPreferenceService` to providers + exports

**Checkpoint**: Core engine ready — `NotificationEmitterService.emit()` can be called by any module.

---

## Phase 3: User Story 1 — Core Notification Engine (Priority: P1) 🎯 MVP

**Goal**: Any backend module can call `NotificationEmitterService.emit()` to persist + push a notification.

**Independent Test**: Call `emit()` directly from a test, verify MongoDB doc created, WebSocket event emitted, preferences respected, quiet hours enforced, deduplication works.

### Tests for User Story 1

- [ ] T017 [P] [US1] Create unit tests in `backend/src/notifications/notification-emitter.service.spec.ts` — test emit creates Notification doc, test WebSocket push to user room, test self-notification skip, test preference category disabled skips (non-critical), test critical overrides disabled preference, test quiet hours suppress push but not persistence, test deduplication within 5s, test broadcast creates docs for all active users
- [ ] T018 [P] [US1] Create unit tests in `backend/src/notifications/notification-preference.service.spec.ts` — test getOrDefault returns defaults when no doc, test getOrDefault returns doc when exists, test upsert creates new, test upsert updates existing

### Implementation for User Story 1

- [ ] T019 [US1] Wire up `NotificationEmitterService` end-to-end — verify emit() → Prisma create → gateway push works with real PrismaService mock and gateway mock
- [ ] T020 [US1] Add Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@ApiTags`) to all existing and new controller methods in `backend/src/notifications/notifications.controller.ts`

**Checkpoint**: Core engine is functional. `NotificationEmitterService.emit()` can be called from tests.

---

## Phase 4: User Story 2 — Bell Icon & Dropdown in Navbar (Priority: P1)

**Goal**: Bell icon in Navbar with unread badge (0/1-99/99+), dropdown with 5 latest notifications, mark all read, "View all" link.

**Independent Test**: Log in, trigger a notification, verify bell badge increments, dropdown shows notification, click navigates.

### Implementation for User Story 2

- [ ] T021 [P] [US2] Create `NotificationContext` in `frontend/src/context/NotificationContext.tsx` — provide `notifications[]`, `unreadCount`, `toasts[]`, `markRead(id)`, `markAllRead()`, `addToast(notification)`, `removeToast(id)`. On mount: fetch unread count via REST, connect WebSocket, subscribe to `notification:new` event
- [ ] T022 [P] [US2] Update `notificationsService` in `frontend/src/services/notificationsService.ts` — update Notification interface import from `notification.types.ts`, add `getByPage(page, limit, category?, unreadOnly?)`, `archive(id)`, `bulkMarkRead(ids)`, `bulkArchive(ids)`, `getPreferences()`, `updatePreferences(dto)`. Change WebSocket event name from `new-notification` to `notification:new`
- [ ] T023 [US2] Refactor `NotificationBell` in `frontend/src/components/NotificationBell.tsx` — consume `NotificationContext` instead of local state. Badge: 0=hidden, 1-99=number, 100+="99+". Dropdown: show only 5 latest. Add "Mark all as read" button in footer. Add "View all" link to `/notifications`. Add slide-in animation for new notifications. Update icon mapping for all 7 categories (not just discussion types)
- [ ] T024 [US2] Wrap app with `NotificationProvider` in `frontend/src/App.tsx` — add `<NotificationProvider>` inside auth context, before router outlet
- [ ] T025 [US2] Update `getNotificationIcon()` and `getNotificationText()` in `NotificationBell.tsx` — map all 7 categories to icons (Trophy for hackathon, Swords for duel, MessageSquare for discussion, Code for submission, Palette for canvas, Medal for achievement, Megaphone for system)

**Checkpoint**: Bell + dropdown functional. Users see real-time notification updates in Navbar.

---

## Phase 5: User Story 3 — Full Notifications Page (Priority: P1)

**Goal**: Dedicated `/notifications` page with category tabs, unread toggle, pagination (20/page), bulk actions (mark read, archive), empty state.

**Independent Test**: Navigate to `/notifications`, verify list, tabs, unread toggle, pagination, bulk actions, empty state.

### Implementation for User Story 3

- [ ] T026 [US3] Create `NotificationsPage` in `frontend/src/pages/NotificationsPage.tsx` — layout: header with title + "Mark all read" button, category tab bar (All | Hackathon | Duel | Discussion | Submission | Achievement | System), unread toggle, notification list, "Load more" button. Each row: colored left border (priority), category icon, sender avatar, title (bold), message (gray, truncated 80 chars), relative time, blue dot (unread), checkbox for bulk select, trash icon for archive
- [ ] T027 [US3] Implement category tab filtering in `NotificationsPage` — clicking tab calls `notificationsService.getByPage(1, 20, category)`, resets page to 1
- [ ] T028 [US3] Implement "Load more" pagination in `NotificationsPage` — append results to existing list, disable button when `hasMore: false`
- [ ] T029 [US3] Implement bulk actions toolbar in `NotificationsPage` — appears when ≥1 checkbox selected. Buttons: "Mark read ({count})", "Archive ({count})". Calls `notificationsService.bulkMarkRead(ids)` or `bulkArchive(ids)`
- [ ] T030 [US3] Implement empty state in `NotificationsPage` — bell illustration + "You're all caught up!" message when zero notifications
- [ ] T031 [US3] Update `frontend/src/routes.tsx` — replace `NotificationsPlaceholder` import/usage with `NotificationsPage`

**Checkpoint**: Notifications page is fully functional with tabs, pagination, and bulk actions.

---

## Phase 6: User Story 4 — Hackathon Notifications Integration (Priority: P1)

**Goal**: Hackathon lifecycle events emit notifications to participants and admins.

**Independent Test**: Create hackathon, register participants, transition phases, verify correct notifications appear.

### Implementation for User Story 4

- [ ] T032 [US4] Import `NotificationsModule` in `backend/src/hackathons/hackathons.module.ts` — add to imports array
- [ ] T033 [US4] Inject `NotificationEmitterService` in `backend/src/hackathons/hackathons.service.ts` — add to constructor
- [ ] T034 [US4] Add notification emit in `transitionStatus()` in `backend/src/hackathons/hackathons.service.ts` — on `checkin`: emit `hackathon_starting` (high) to all registered participants. On `active`: emit `hackathon_active` (critical). On `ended`: emit `hackathon_ended` (medium)
- [ ] T035 [US4] Add notification emit in `joinTeamByCode()` and `joinSolo()` in `backend/src/hackathons/hackathons.service.ts` — emit `hackathon_team_joined` (medium) to team captain
- [ ] T036 [US4] Add notification emit in `leaveTeam()` in `backend/src/hackathons/hackathons.service.ts` — emit `hackathon_team_left` (medium) to team captain
- [ ] T037 [P] [US4] Add notification emit for clarification posting — emit `hackathon_clarification` (high) to all hackathon participants when admin posts a clarification
- [ ] T038 [P] [US4] Add notification emit in `handleAnticheatEvent()` in `backend/src/hackathons/hackathons.gateway.ts` — emit `hackathon_anticheat_alert` (critical) to all admin users

**Checkpoint**: Hackathon lifecycle notifications working end-to-end.

---

## Phase 7: User Story 5 — Duel Notifications Integration (Priority: P2)

**Goal**: Duel events (match, result, ELO, streak) emit notifications to players.

**Independent Test**: Complete a duel, verify both players receive `duel_result` notifications.

### Implementation for User Story 5

- [ ] T039 [US5] Import `NotificationsModule` in `backend/src/duels/duels.module.ts` — add to imports array
- [ ] T040 [US5] Inject `NotificationEmitterService` in `backend/src/duels/duels.service.ts` — add to constructor
- [ ] T041 [US5] Add notification emit on matchmaking in `backend/src/duels/duels.service.ts` — when duel is matched, emit `duel_matched` (critical) to both players with actionUrl `/duel/room/{id}`
- [ ] T042 [US5] Add notification emit on duel completion in `backend/src/duels/duels.service.ts` — emit `duel_result` (high) to both players with title "Victory! 🏆" / "Defeat" / "Draw 🤝" and ELO delta in message
- [ ] T043 [P] [US5] Add notification emit for ELO change ≥50 in `backend/src/duels/duels.service.ts` — emit `duel_elo_change` (medium) to player with actionUrl `/leaderboard`
- [ ] T044 [P] [US5] Add notification emit for win streak (3, 5, 10) in `backend/src/duels/duels.service.ts` — emit `duel_streak` (low) to player with actionUrl `/profile`

**Checkpoint**: Duel notifications working for match, result, ELO, and streak events.

---

## Phase 8: User Story 6 — Discussion Notifications Integration (Priority: P2)

**Goal**: Discussion events (reply, best answer, vote milestone, flag) emit notifications.

**Independent Test**: Create discussion, have another user comment, verify author receives `discussion_reply`.

### Implementation for User Story 6

- [ ] T045 [US6] Import `NotificationsModule` in `backend/src/discussions/discussions.module.ts` — add to imports array
- [ ] T046 [US6] Inject `NotificationEmitterService` in `backend/src/discussions/discussions.service.ts` — add to constructor
- [ ] T047 [US6] Refactor existing notification calls in `discussions.service.ts` — replace `this.notificationsService.create({ recipientId, actorId, type, targetId, targetType })` with `this.notificationEmitter.emit({ userId, type, category: 'discussion', priority, title, message, actionUrl, entityId, entityType: 'Discussion', senderId, senderName, senderPhoto })` in `createComment()`, `toggleBestAnswer()`, vote methods, and flag methods
- [ ] T048 [US6] Add vote milestone notifications in `discussions.service.ts` — on upvote/downvote, check if total reaches 5, 10, 25, 50, or 100 → emit `discussion_vote` (low) to author
- [ ] T049 [P] [US6] Add flag notifications in `discussions.service.ts` — on flag action, emit `discussion_flagged` (high) to content author AND all admin users

**Checkpoint**: Discussion notifications migrated from old system to new emitter.

---

## Phase 9: User Story 7 — Toast Notifications (Priority: P2)

**Goal**: Transient toast popups for high/critical notifications in top-right corner.

**Independent Test**: Trigger high-priority notification, verify toast appears, auto-dismisses after 5s.

### Implementation for User Story 7

- [ ] T050 [P] [US7] Create `NotificationToast` component in `frontend/src/components/NotificationToast.tsx` — single toast: category icon + title + message (truncated 60 chars) + relative time. Red left border for critical. Auto-dismiss timer (5s for high, no auto-dismiss for critical). Click body → navigate to actionUrl + mark read. Click ✕ → dismiss without navigation. Fade-in/fade-out animation
- [ ] T051 [P] [US7] Create `NotificationToastContainer` in `frontend/src/components/NotificationToastContainer.tsx` — portal-based, fixed top-right. Manages toast stack (max 3 visible, FIFO). Renders `<NotificationToast>` for each toast in queue
- [ ] T052 [US7] Integrate toast system in `NotificationContext.tsx` — on WebSocket `notification:new` event, if priority is `high` or `critical`, add to toasts queue. If toasts.length > 3, remove oldest. Render `<NotificationToastContainer>` via portal inside the provider

**Checkpoint**: Toast system working — high/critical notifications show transient popups.

---

## Phase 10: User Story 8 — User Notification Preferences (Priority: P3)

**Goal**: Settings → Notifications page with per-category toggles and quiet hours.

**Independent Test**: Navigate to Settings → Notifications, disable a category, trigger event, verify no notification created.

### Implementation for User Story 8

- [ ] T053 [US8] Add preferences REST endpoints to `NotificationsController` in `backend/src/notifications/notifications.controller.ts` — `GET /api/notifications/preferences` (calls `preferenceService.getOrDefault(userId)`), `PUT /api/notifications/preferences` (calls `preferenceService.upsert(userId, dto)`) with Swagger decorators
- [ ] T054 [US8] Update Settings page notifications tab in `frontend/src/pages/Settings.tsx` — replace placeholder content with: 7 category toggle switches (Hackathon, Duel, Discussion, Submission, Canvas, Achievement, System), quiet hours start/end time inputs, Save button. On mount: fetch `notificationsService.getPreferences()`. On save: call `notificationsService.updatePreferences(dto)`, show success toast
- [ ] T055 [US8] Add `getPreferences()` and `updatePreferences(dto)` to `frontend/src/services/notificationsService.ts` — `GET /notifications/preferences` and `PUT /notifications/preferences`

**Checkpoint**: Preferences page functional, category toggles affect notification delivery.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Tests, documentation, and cleanup across all stories.

- [ ] T056 [P] Create controller tests in `backend/src/notifications/notifications.controller.spec.ts` — test all 9 endpoints: GET paginated list, GET unread count, PATCH read, PATCH read-all, PATCH archive, PATCH bulk read, PATCH bulk archive, GET preferences, PUT preferences
- [ ] T057 [P] Create feature documentation in `docs/features/notification-system.md` — overview, 32 notification types, 7 categories, API endpoints, WebSocket events, data model, preferences
- [ ] T058 [P] Add Swagger decorators to all new controller endpoints in `backend/src/notifications/notifications.controller.ts` — `@ApiQuery`, `@ApiBody`, `@ApiParam`, `@ApiResponse` for each endpoint
- [ ] T059 Validate quickstart.md scenarios — run through all 7 verification scenarios in `specs/011-notification-system/quickstart.md`
- [ ] T060 Run full test suite — `npx jest --testPathPattern="notifications" --verbose` — all tests must pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (schema must exist for services)
- **Phases 3–10 (User Stories)**: All depend on Phase 2 completion
  - US1 (Core Engine): Can start after Phase 2
  - US2 (Bell/Dropdown): Can start after Phase 2, benefits from US1 being done
  - US3 (Notifications Page): Can start after Phase 2, benefits from US2 (shared context)
  - US4 (Hackathon Integration): Depends on US1 (needs emit() working)
  - US5 (Duel Integration): Depends on US1 (needs emit() working)
  - US6 (Discussion Integration): Depends on US1 (needs emit() working)
  - US7 (Toast): Depends on US2 (needs NotificationContext)
  - US8 (Preferences): Depends on Phase 2 (PreferenceService)
- **Phase 11 (Polish)**: Depends on all desired stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
  └─→ Phase 2 (Foundational)
       ├─→ US1 (Core Engine) ──→ US4 (Hackathon Integration)
       │                     ──→ US5 (Duel Integration)
       │                     ──→ US6 (Discussion Integration)
       ├─→ US2 (Bell/Dropdown) ──→ US3 (Notifications Page)
       │                       ──→ US7 (Toast)
       └─→ US8 (Preferences)
```

### Within Each User Story

- Models before services
- Services before endpoints/controllers
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T005–T009 (DTOs + frontend types) all [P] — can run in parallel
- T017–T018 (US1 tests) [P] — can run in parallel
- T021–T022 (US2 context + service) [P] — can run in parallel
- T037–T038 (US4 clarification + anticheat) [P] — can run in parallel
- T043–T044 (US5 ELO + streak) [P] — can run in parallel
- T050–T051 (US7 toast + container) [P] — can run in parallel
- T056–T058 (Polish tests + docs + swagger) [P] — can run in parallel

---

## Parallel Example: Phase 1 (Setup)

```text
# After T001–T004 (schema changes) complete sequentially:
# Launch all DTOs + types in parallel:
T005: CreateNotificationDto          → backend/src/notifications/dto/create-notification.dto.ts
T006: NotificationQueryDto           → backend/src/notifications/dto/notification-query.dto.ts
T007: BulkNotificationDto            → backend/src/notifications/dto/bulk-notification.dto.ts
T008: UpdateNotificationPreferenceDto → backend/src/notifications/dto/notification-preference.dto.ts
T009: Frontend types                  → frontend/src/types/notification.types.ts
```

## Parallel Example: User Story 4 (Hackathon Integration)

```text
# After T032–T036 complete sequentially:
# Launch independent integration points in parallel:
T037: Clarification notification → hackathons.service.ts (different method)
T038: Anti-cheat notification    → hackathons.gateway.ts (different file)
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Complete Phase 1: Setup (T001–T009)
2. Complete Phase 2: Foundational (T010–T016)
3. Complete Phase 3: US1 — Core Engine (T017–T020)
4. **STOP and VALIDATE**: Test `emit()` directly → Notification created + WebSocket pushed
5. Complete Phase 4: US2 — Bell/Dropdown (T021–T025)
6. Complete Phase 5: US3 — Notifications Page (T026–T031)
7. **STOP and VALIDATE**: Bell works, page works, real-time updates flow

### Incremental Delivery

1. Setup + Foundational → Core engine ready
2. Add US1 (Core Engine) → Test emit() → Foundation validated
3. Add US2 (Bell/Dropdown) → Test bell → Users can see notifications
4. Add US3 (Notifications Page) → Test page → Users can manage notifications
5. Add US4 (Hackathon) → Test lifecycle → Hackathon participants get notified
6. Add US5 (Duel) → Test matches → Duel players get notified
7. Add US6 (Discussion) → Test replies → Discussion authors get notified
8. Add US7 (Toast) → Test popups → Real-time UX enhanced
9. Add US8 (Preferences) → Test toggles → Power users can customize

### Task Summary

| Phase | Story | Tasks | [P] Tasks |
|-------|-------|-------|-----------|
| Phase 1 | Setup | T001–T009 (9) | 5 |
| Phase 2 | Foundational | T010–T016 (7) | 0 |
| Phase 3 | US1 Core Engine | T017–T020 (4) | 2 |
| Phase 4 | US2 Bell/Dropdown | T021–T025 (5) | 2 |
| Phase 5 | US3 Notifications Page | T026–T031 (6) | 0 |
| Phase 6 | US4 Hackathon | T032–T038 (7) | 2 |
| Phase 7 | US5 Duel | T039–T044 (6) | 2 |
| Phase 8 | US6 Discussion | T045–T049 (5) | 1 |
| Phase 9 | US7 Toast | T050–T052 (3) | 2 |
| Phase 10 | US8 Preferences | T053–T055 (3) | 0 |
| Phase 11 | Polish | T056–T060 (5) | 3 |
| **Total** | | **60 tasks** | **19 parallelizable** |
