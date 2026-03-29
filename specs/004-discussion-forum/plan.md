# Implementation Plan: Discussion Forum

**Branch**: `004-discussion-forum` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/004-discussion-forum/spec.md`

## Summary

Implement the full backend logic for the Discussion Forum and connect the existing frontend pages (`DiscussionPage.tsx`, `DiscussionDetailPage.tsx`) to real backend data. The feature covers: posts CRUD with categories + solved status, nested comments (2-level), upvote/downvote system, dynamic tags + statistics, real-time notifications via Socket.IO, content moderation (flagging + admin tools), and a "My Posts" dashboard.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: NestJS 10.x (backend), React 18.x + Vite 6.x (frontend)  
**Storage**: MongoDB via Prisma 6.x  
**Testing**: Jest (backend), Vitest (frontend) — *NOTE: no test files currently exist in backend*  
**Target Platform**: Web (Linux server)  
**Real-Time**: Socket.IO 4.x via NestJS `@WebSocketGateway`  
**Project Type**: Web application (monorepo: `backend/` + `frontend/`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modular Architecture | ✅ Pass | Forum uses existing `discussions/` NestJS module; new `notifications/` module will be added |
| II. Naming Conventions | ✅ Pass | All files follow `kebab-case.type.ts`, classes PascalCase, WS events `kebab-case` |
| III. TypeScript Strictness | ✅ Pass | DTOs use `class-validator`, no `any` in service signatures |
| IV. Testing Discipline | ⚠️ Gate | No tests exist today — this plan MUST add tests for new service methods |
| V. Documentation-First | ✅ Pass | Feature doc at `docs/features/discussion-forum.md` will be created |
| VI. Real-Time Standards | ✅ Pass | Notifications gateway follows pattern from `duels.gateway.ts` |
| VII. Internationalization | ✅ Pass | All new UI text uses `useLanguage()` / `t()` keys |
| VIII. Game Metrics | N/A | No scoring/ELO changes |

## Project Structure

### Documentation (this feature)

```text
specs/004-discussion-forum/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output  
├── contracts/           # Phase 1 output (API contracts)
│   └── api.md
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   └── schema.prisma              # MODIFY: add category, isSolved, bestAnswerCommentId to Discussion; add Notification model
├── src/
│   ├── discussions/
│   │   ├── discussions.module.ts   # MODIFY: add NotificationsModule import, DiscussionsGateway
│   │   ├── discussions.controller.ts  # MODIFY: add /stats, /tags/popular, /my-posts, /:id/solve, /:id/flag, /comments/:id/best-answer endpoints
│   │   ├── discussions.service.ts     # MODIFY: add category filter, isSolved toggle, stats, popular tags, my-posts, flag, best-answer logic
│   │   ├── discussions.gateway.ts     # NEW: WebSocket gateway for live updates
│   │   └── dto/
│   │       └── discussion.dto.ts      # MODIFY: add category, isSolved, flag DTOs
│   └── notifications/
│       ├── notifications.module.ts    # NEW
│       ├── notifications.controller.ts # NEW: GET /notifications, PATCH /:id/read, PATCH /read-all
│       ├── notifications.service.ts    # NEW: create, getAll, markRead, markAllRead, enforceMax100
│       ├── notifications.gateway.ts    # NEW: WebSocket gateway /notifications namespace
│       └── dto/
│           └── notification.dto.ts     # NEW

frontend/
├── src/
│   ├── pages/
│   │   ├── DiscussionPage.tsx          # MODIFY: wire up stats, categories, tags, search, create post modal, vote buttons
│   │   └── DiscussionDetailPage.tsx    # MODIFY: wire up comments, votes, replies, best-answer, flag, solved
│   ├── services/
│   │   ├── discussionsService.ts       # MODIFY: add stats, popularTags, myPosts, flag, bestAnswer, solve API calls
│   │   └── notificationsService.ts     # NEW: notifications REST + Socket.IO client
│   ├── components/
│   │   ├── CreatePostModal.tsx         # NEW: modal for creating/editing posts
│   │   └── NotificationBell.tsx        # NEW: navbar bell icon with dropdown
│   └── data/
│       └── discussionData.ts           # MODIFY: update types to match backend response
```

---

## Phase 0: Research

No `NEEDS CLARIFICATION` markers remain in the spec (all 5 clarifications resolved via `/speckit.clarify`). Research focuses on best practices for the chosen patterns.

### Decision 1: Notification Delivery Architecture

**Decision**: Use a dedicated `NotificationsGateway` with its own `/notifications` namespace (separate from the existing `/duels` gateway).  
**Rationale**: Separation of concerns — notifications are cross-cutting and not specific to duels. Users connect to `/notifications` on app load and receive events for all notification types.  
**Alternatives considered**: Using a single shared gateway → rejected because it would couple duel logic with notification logic and violate Principle I (Modular Architecture).

### Decision 2: Category Storage

**Decision**: Add a `category` String field to the `Discussion` model with an enum-like validation at DTO level (not Prisma enum).  
**Rationale**: Prisma MongoDB doesn't support `@default` on enums well. Using string + DTO validation (`@IsIn`) gives flexibility to add categories without schema migration.  
**Alternatives considered**: Prisma enum → rejected for MongoDB compatibility constraints.

### Decision 3: Rate Limiting Approach

**Decision**: Use NestJS `@nestjs/throttler` module for rate limiting.  
**Rationale**: It's in the NestJS ecosystem, configuration-based, and supports per-route customization. Already compatible with the existing NestJS + Passport setup.  
**Alternatives considered**: Custom middleware → more boilerplate for same result.

### Decision 4: Flag/Report System

**Decision**: Add `flags` (String[] of user IDs) and `isHidden` (Boolean) fields to both `Discussion` and `Comment` models. When `flags.length >= 5`, auto-set `isHidden = true`.  
**Rationale**: Same array pattern already used for `upvotes`/`downvotes`. Simple, consistent, and requires minimal schema changes.

---

## Phase 1: Data Model

### Prisma Schema Changes

#### Discussion Model (MODIFY)

```diff
 model Discussion {
   id           String   @id @default(auto()) @map("_id") @db.ObjectId
   title        String
   content      String
+  category     String   @default("general")
   authorId     String   @db.ObjectId
   author       User     @relation(fields: [authorId], references: [id])
   tags         String[]
   challengeId  String?  @db.ObjectId
   upvotes      String[] @db.ObjectId
   downvotes    String[] @db.ObjectId
   commentCount Int      @default(0)
   views        Int      @default(0)
+  isSolved     Boolean  @default(false)
+  bestAnswerCommentId String? @db.ObjectId
+  flags        String[] @db.ObjectId
+  isHidden     Boolean  @default(false)
   createdAt    DateTime @default(now())
   updatedAt    DateTime @updatedAt

   comments Comment[]

   @@index([tags])
+  @@index([category])
   @@index([createdAt(sort: Desc)])
 }
```

#### Comment Model (MODIFY)

```diff
 model Comment {
   id              String     @id @default(auto()) @map("_id") @db.ObjectId
   content         String
   authorId        String     @db.ObjectId
   author          User       @relation(fields: [authorId], references: [id])
   discussionId    String     @db.ObjectId
   discussion      Discussion @relation(fields: [discussionId], references: [id])
   parentCommentId String?    @db.ObjectId
   upvotes         String[]   @db.ObjectId
   downvotes       String[]   @db.ObjectId
+  isBestAnswer    Boolean    @default(false)
+  flags           String[]   @db.ObjectId
+  isHidden        Boolean    @default(false)
   createdAt       DateTime   @default(now())
   updatedAt       DateTime   @updatedAt

   @@index([discussionId])
 }
```

#### Notification Model (NEW)

```prisma
model Notification {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  recipientId String   @db.ObjectId
  recipient   User     @relation("UserNotifications", fields: [recipientId], references: [id])
  actorId     String   @db.ObjectId
  actor       User     @relation("UserNotificationActors", fields: [actorId], references: [id])
  type        String   // "like-post" | "like-comment" | "new-comment" | "reply-comment" | "best-answer"
  targetId    String   @db.ObjectId  // discussionId or commentId
  targetType  String   // "discussion" | "comment"
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([recipientId, createdAt(sort: Desc)])
  @@index([recipientId, isRead])
}
```

#### User Model (MODIFY)

```diff
 model User {
   ...
+  notificationsReceived Notification[] @relation("UserNotifications")
+  notificationsActed    Notification[] @relation("UserNotificationActors")
 }
```

---

## Phase 1: API Contracts

### Discussions API (Extended)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/discussions` | user | Create post (+ category field) |
| GET | `/api/discussions` | public | List posts (+ category filter, + content search) |
| GET | `/api/discussions/stats` | public | Forum statistics (dynamic) |
| GET | `/api/discussions/tags/popular` | public | Top 10 tags by post count |
| GET | `/api/discussions/my-posts` | user | Current user's posts |
| GET | `/api/discussions/:id` | public | Post detail with nested comments |
| PATCH | `/api/discussions/:id` | author | Update post |
| DELETE | `/api/discussions/:id` | author | Delete post + cascade comments |
| POST | `/api/discussions/:id/vote` | user | Vote (upvote/downvote) |
| PATCH | `/api/discussions/:id/solve` | author | Toggle solved status |
| POST | `/api/discussions/:id/flag` | user | Flag post |
| POST | `/api/discussions/:id/comments` | user | Add comment |
| PATCH | `/api/discussions/comments/:id` | author | Edit comment |
| DELETE | `/api/discussions/comments/:id` | author | Delete comment + replies |
| POST | `/api/discussions/comments/:id/vote` | user | Vote on comment |
| PATCH | `/api/discussions/comments/:id/best-answer` | post-author | Toggle best answer |
| POST | `/api/discussions/comments/:id/flag` | user | Flag comment |

### Notifications API (New)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications` | user | Get user's notifications (newest first, max 100) |
| GET | `/api/notifications/unread-count` | user | Get unread count |
| PATCH | `/api/notifications/:id/read` | user | Mark one as read |
| PATCH | `/api/notifications/read-all` | user | Mark all as read |

### WebSocket Events (Notifications Gateway)

**Namespace**: `/notifications`

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `new-notification` | Server → Client | `{ id, type, actorUsername, targetTitle, createdAt }` | Pushed to recipient when a notification is created |

---

## Implementation Phases

### Phase A: Schema + Backend Core (Discussions)

1. Update Prisma schema (Discussion, Comment, Notification, User relations)
2. Run `npx prisma generate`
3. Update `CreateDiscussionDto` to include `category` (with `@IsIn(validCategories)`)
4. Update `UpdateDiscussionDto` to include `category`
5. Add `getStats()` to `DiscussionsService` — aggregate query for total, active users, solved, this week
6. Add `getPopularTags()` — aggregate and count tags across all discussions
7. Add `getMyPosts(userId)` — filter by authorId
8. Add `toggleSolved(id, userId)` — author-only toggle
9. Add `flagDiscussion(id, userId)` — add userId to flags array, auto-hide if >= 5
10. Update `findAllDiscussions()` — add `category` filter, full-text search on `content` too, sort by `most-commented`, `unsolved`
11. Update `findOneDiscussion()` — organize comments into nested structure (parent → children), hide flagged content
12. Add `toggleBestAnswer(commentId, userId)` — verify user is post author, toggle `isBestAnswer`
13. Add `flagComment(commentId, userId)` — same pattern as discussion flags
14. Wire all new methods into `DiscussionsController` with Swagger decorators
15. Add self-vote prevention on both discussion and comment vote methods

### Phase B: Notifications Module

1. Create `notifications/` module with controller, service, gateway, DTOs
2. `NotificationsService.create()` — create notification, enforce max 100 per user, emit WebSocket event
3. `NotificationsService.getAll(userId)` — return latest 100, newest first
4. `NotificationsService.getUnreadCount(userId)` — count where isRead = false
5. `NotificationsService.markRead(id, userId)` — verify recipient, set isRead = true
6. `NotificationsService.markAllRead(userId)` — bulk update
7. `NotificationsGateway` — `/notifications` namespace, JWT auth (same pattern as duels gateway), map userId → socketId
8. Integrate notification creation into `DiscussionsService` at key points:
   - `createComment()` → notify post author ("new-comment")
   - `createComment(parentCommentId)` → notify parent comment author ("reply-comment")
   - `voteDiscussion(upvote)` → notify post author ("like-post")
   - `voteComment(upvote)` → notify comment author ("like-comment")
   - `toggleBestAnswer()` → notify comment author ("best-answer")
9. Register `NotificationsModule` in `AppModule`

### Phase C: Rate Limiting

1. Install `@nestjs/throttler` (if not present)
2. Configure `ThrottlerModule` globally in `AppModule`
3. Apply custom throttle decorators on discussion/comment creation and voting endpoints

### Phase D: Frontend Integration

1. **`discussionData.ts`** — Update `DiscussionPost` type to include `category`, `isSolved`, `userVote`
2. **`discussionsService.ts`** — Add `getStats()`, `getPopularTags()`, `getMyPosts()`, `solve()`, `flag()`, `bestAnswer()`, `flagComment()`
3. **`DiscussionPage.tsx`**:
   - Wire stats bar to `getStats()` API (replace hardcoded values)
   - Wire popular tags to `getPopularTags()` API (replace hardcoded array)
   - Wire "New Post" button to `CreatePostModal`
   - Wire category sidebar to send `category` filter param
   - Wire vote buttons to `vote()` API with optimistic update
   - Show user's current vote state (green upvote / red downvote)
   - Prevent self-voting on own posts
   - Add debounced search (300ms)
4. **`CreatePostModal.tsx`** (NEW) — Modal with form: title, content (textarea), category dropdown, tag input with autocomplete
5. **`DiscussionDetailPage.tsx`**:
   - Wire comment submit to `addComment()` API
   - Wire reply submit to `addComment(parentCommentId)` API
   - Wire vote buttons on post and comments
   - Wire "Mark as Solved" button (visible only to post author)
   - Wire "Best Answer" button on comments (visible only to post author)
   - Wire "Flag" button on post and comments
   - Wire edit/delete buttons (visible only to author)
   - Organize comments into nested tree structure client-side
   - Limit reply depth to 2 levels (hide Reply button on level-2 comments)
6. **`notificationsService.ts`** (NEW) — REST API calls + Socket.IO connection to `/notifications` namespace
7. **`NotificationBell.tsx`** (NEW) — Bell icon in Navbar, unread count badge, dropdown with notification list, mark read / mark all read
8. **`Navbar.tsx`** — Add `NotificationBell` component (only for authenticated users)

### Phase E: i18n + Documentation

1. Add translation keys for all new UI text (FR + EN) in language files
2. Create `docs/features/discussion-forum.md` with feature overview, API contracts, data model

---

## Verification Plan

### Backend API Testing (curl/Swagger)

1. **Start backend**: `cd backend && pnpm run start:dev`
2. **Prisma generate**: `cd backend && npx prisma generate` (verify no schema errors)
3. **Swagger UI**: Open `http://localhost:4000/api/docs` and verify all new endpoints appear with correct decorators
4. **Test CRUD flow via Swagger**:
   - POST `/api/discussions` with `{ title, content, category: "help", tags: ["test"] }` → should create
   - GET `/api/discussions` → should list the created post
   - GET `/api/discussions?category=help` → should filter
   - GET `/api/discussions/stats` → should return real counts
   - GET `/api/discussions/tags/popular` → should return tag counts
   - POST `/api/discussions/:id/vote` with `{ type: "upvote" }` → should work
   - POST `/api/discussions/:id/comments` with `{ content: "test comment" }` → should create
   - PATCH `/api/discussions/:id/solve` → should toggle solved

### Frontend Browser Testing

1. **Start frontend**: `cd frontend && pnpm run dev`
2. **Navigate to** `http://localhost:3000/discussion`:
   - Verify stats bar shows real numbers (not hardcoded)
   - Verify popular tags are dynamically loaded
   - Click "New Post" → verify modal opens with form
   - Create a post → verify it appears in the list
   - Click a category → verify filtering works
   - Type in search bar → verify results update after debounce
   - Click upvote/downvote → verify score changes and button colors
3. **Navigate to post detail** (`/discussion/:id`):
   - Verify full post content and comments load
   - Submit a comment → verify it appears
   - Reply to a comment → verify nested reply appears indented
   - Vote on comments → verify score updates
   - Click "Mark as Solved" (as author) → verify badge appears
4. **Notifications**:
   - User A creates a post, User B comments → verify User A sees bell badge
   - Click bell → verify dropdown shows notification
   - Click "Mark as Read" → verify badge decrements

### Manual User Testing

> The user should test the complete flow by opening the app in a browser, logging in, and performing the following sequence:
> 1. Go to `/discussion` — verify real stats and tags are shown
> 2. Click "New Post" — create a post with title, content, category "Help", and tags
> 3. Navigate to the newly created post — verify it appears
> 4. Post a comment — verify the comment counter updates
> 5. Reply to your comment — verify nesting works
> 6. Open a second browser/incognito tab, log in as a different user
> 7. With User B, upvote User A's post — verify the score changes
> 8. Verify User A receives a notification (bell icon in navbar)
