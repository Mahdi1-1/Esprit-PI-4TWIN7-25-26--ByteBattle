# Tasks: Discussion Forum

**Input**: Design documents from `specs/004-discussion-forum/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema changes and module scaffolding that all user stories depend on

- [x] T001 Add `category`, `isSolved`, `bestAnswerCommentId`, `flags`, `isHidden` fields to `Discussion` model and `isBestAnswer`, `flags`, `isHidden` fields to `Comment` model in `backend/prisma/schema.prisma`
- [x] T002 Add `Notification` model with `recipientId`, `actorId`, `type`, `targetId`, `targetType`, `isRead`, `createdAt` fields and User relations in `backend/prisma/schema.prisma`
- [x] T003 Run `npx prisma generate` to regenerate Prisma client with new schema
- [x] T004 [P] Update `CreateDiscussionDto` to add `category` field with `@IsIn()` validator and `@MaxLength(10000)` on content in `backend/src/discussions/dto/discussion.dto.ts`
- [x] T005 [P] Update `UpdateDiscussionDto` to add optional `category` field in `backend/src/discussions/dto/discussion.dto.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend services that MUST be complete before frontend integration

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create `backend/src/notifications/dto/notification.dto.ts` with `CreateNotificationDto` class (type, targetId, targetType)
- [x] T007 [P] Create `backend/src/notifications/notifications.service.ts` with `create()`, `getAll(userId)`, `getUnreadCount(userId)`, `markRead(id, userId)`, `markAllRead(userId)`, `enforceMax100(userId)` methods
- [x] T008 [P] Create `backend/src/notifications/notifications.controller.ts` with GET `/notifications`, GET `/notifications/unread-count`, PATCH `/notifications/:id/read`, PATCH `/notifications/read-all` endpoints with Swagger decorators
- [x] T009 Create `backend/src/notifications/notifications.gateway.ts` with `/notifications` namespace, JWT auth (same pattern as `backend/src/duels/duels.gateway.ts`), `userId→socketId` mapping, `emitToUser(userId, event, data)` method
- [x] T010 Create `backend/src/notifications/notifications.module.ts` importing PrismaModule, JwtModule, ConfigModule, exporting NotificationsService
- [x] T011 Register `NotificationsModule` in `backend/src/app.module.ts`

**Checkpoint**: Notification module ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Browse & Search Posts (Priority: P1) 🎯 MVP

**Goal**: Users see real posts from the database with dynamic stats, popular tags, category/tag filtering, search, and sorting.

**Independent Test**: Navigate to `/discussion` → verify stats show real numbers, popular tags are dynamic, categories filter correctly, search returns matching results.

### Implementation for User Story 1

- [x] T012 [US1] Add `getStats()` method to `backend/src/discussions/discussions.service.ts` — aggregate queries for totalPosts, activeUsers (posted last 7 days), solvedThreads, postsThisWeek
- [x] T013 [P] [US1] Add `getPopularTags()` method to `backend/src/discussions/discussions.service.ts` — unwind tags array, group by tag, count, sort desc, limit 10
- [x] T014 [US1] Update `findAllDiscussions()` in `backend/src/discussions/discussions.service.ts` — add `category` filter, full-text search on `content` field, add `most-commented` and `unsolved` sort options, filter out `isHidden` posts, change default limit to 20
- [x] T015 [US1] Add `GET /discussions/stats` and `GET /discussions/tags/popular` endpoints to `backend/src/discussions/discussions.controller.ts` with Swagger decorators (place BEFORE `:id` route)
- [x] T016 [US1] Add `getStats()` and `getPopularTags()` methods to `frontend/src/services/discussionsService.ts`
- [x] T017 [US1] Update `frontend/src/pages/DiscussionPage.tsx` — replace hardcoded stats with `getStats()` API call, replace hardcoded popular tags with `getPopularTags()` API call
- [x] T018 [US1] Update `frontend/src/pages/DiscussionPage.tsx` — wire category sidebar to send `category` query parameter (currently sends as `tags`), add debounced search (300ms delay), convert `selectedCategory` to pass as `category` param instead of `tags`
- [x] T019 [US1] Update `frontend/src/data/discussionData.ts` — add `category` and `isSolved` to `DiscussionPost` interface, add `userVote` field

**Checkpoint**: Discussion list page shows real data, stats, tags, filtering, and search all work

---

## Phase 4: User Story 2 — Create, Edit & Delete Posts (Priority: P1)

**Goal**: Users can create new posts with category + tags, edit/delete their own posts, and mark posts as solved.

**Independent Test**: Click "New Post" → fill form → submit → post appears. Edit own post → updates. Delete own post → removed. Mark as Solved → badge shows.

### Implementation for User Story 2

- [x] T020 [US2] Create new file `frontend/src/pages/NewDiscussionPage.tsx` with a form for title, category (dropdown matching `discussionCategories`), tags (comma-separated max 5), and content (markdown textarea)
- [x] T021 [US2] Update `frontend/src/App.tsx` and `frontend/src/routes.tsx` to add route `/discussion/new` mapping to `NewDiscussionPage`
- [x] T022 [US2] Update `createDiscussion` in `backend/src/discussions/discussions.service.ts` to accept `category` from dto and store it (Requires T004 DTO update)
- [x] T023 [US2] Add `DELETE /discussions/:id` endpoint in `backend/src/discussions/discussions.controller.ts` with ownership check in service
- [x] T024 [US2] Update `UpdateDiscussionDto` and `updateDiscussion` service method to accept optional `category` to allow editing it
- [x] T025 [US2] Add `create()`, `update()`, `delete()`, `solve()` methods to `frontend/src/services/discussionsService.ts` (update existing if needed)
- [x] T026 [US2] Create `frontend/src/components/CreatePostModal.tsx` — modal with form fields: title (input, max 200), content (textarea, max 10000), category (dropdown from `discussionCategories`), tags (input with autocomplete, 1-5 tags) with validation
- [x] T027 [US2] Wire "New Post" button in `frontend/src/pages/DiscussionPage.tsx` to open `CreatePostModal`, handle form submission via `discussionsService.create()`, refresh list on success
- [x] T028 [US2] Add edit/delete buttons to post detail in `frontend/src/pages/DiscussionDetailPage.tsx` — visible only when `currentUser.id === post.authorId`, edit opens pre-filled `CreatePostModal`, delete shows confirmation dialog
- [x] T029 [US2] Add "Mark as Solved" / "Mark as Unsolved" button in `frontend/src/pages/DiscussionDetailPage.tsx` — visible only to post author, calls `solve()` API, updates solved badge

**Checkpoint**: Full post CRUD lifecycle works end-to-end

---

## Phase 5: User Story 3 — Vote on Posts (Priority: P1)

**Goal**: Users can upvote/downvote posts with visual feedback, toggle off, switch votes. Self-voting prevented.

**Independent Test**: Click upvote on another user's post → score changes and arrow turns green. Click again → removed. Click downvote → switches. Own post → buttons disabled.

### Implementation for User Story 3

- [x] T028 [US3] Update `voteDiscussion()` in `backend/src/discussions/discussions.service.ts` — add self-vote prevention (`if (discussion.authorId === userId) throw ForbiddenException`), integrate notification creation for upvotes (call `NotificationsService.create()` with type "like-post")
- [x] T029 [US3] Wire vote buttons in `frontend/src/pages/DiscussionPage.tsx` PostCard — call `discussionsService.vote()` on click, apply optimistic UI update, show active state (green for upvote, red for downvote), disable for own posts, pass `currentUser.id` to compare with `authorId`
- [x] T030 [US3] Wire vote buttons in `frontend/src/pages/DiscussionDetailPage.tsx` — same logic as PostCard for the full post view, update displayed score on vote response
- [x] T031 [US3] Update `findAllDiscussions()` response mapping in `frontend/src/pages/DiscussionPage.tsx` — include `authorId` and compute `userVote` from upvotes/downvotes arrays using current user ID

**Checkpoint**: Voting on posts works everywhere with correct visual feedback and self-vote prevention

---

## Phase 6: User Story 4 — Comments & Nested Replies (Priority: P1)

**Goal**: Users can comment on posts, reply to comments (2 levels max), edit/delete own comments, vote on comments.

**Independent Test**: Post a comment → appears. Reply to comment → nested below parent. Vote on comment → score changes. Edit/delete own → works. Reply button hidden on depth-2.

### Implementation for User Story 4

- [x] T032 [US4] Update `findOneDiscussion()` in `backend/src/discussions/discussions.service.ts` — organize flat comments into nested tree structure (parent-child), filter out `isHidden` comments, sort by createdAt
- [x] T033 [US4] Update `createComment()` in `backend/src/discussions/discussions.service.ts` — enforce max depth 2 (check if parent comment itself has a parentCommentId → reject), add notification for post author ("new-comment") and parent comment author ("reply-comment")
- [x] T034 [US4] Update `voteComment()` in `backend/src/discussions/discussions.service.ts` — add self-vote prevention, add notification for comment author ("like-comment")
- [x] T035 [US4] Wire comment submit button in `frontend/src/pages/DiscussionDetailPage.tsx` — call `discussionsService.addComment()`, refresh comments on success, clear textarea
- [x] T036 [US4] Wire reply form in `frontend/src/pages/DiscussionDetailPage.tsx` — pre-fill `@username ` in reply input, call `addComment()` with `parentCommentId`, refresh comments on success
- [x] T037 [US4] Hide Reply button on depth-2 comments in `frontend/src/pages/DiscussionDetailPage.tsx` — pass `depth` prop through CommentCard recursion, hide when `depth >= 1`
- [x] T038 [US4] Wire edit/delete buttons on comments in `frontend/src/pages/DiscussionDetailPage.tsx` — visible only to comment author, edit shows inline input, delete shows confirmation
- [x] T039 [US4] Wire vote buttons on comments in `frontend/src/pages/DiscussionDetailPage.tsx` — call `voteComment()`, optimistic update, disable for own comments
- [x] T040 [US4] Add comment sorting controls (newest, oldest, most-liked) to `frontend/src/pages/DiscussionDetailPage.tsx` — default newest, sort client-side

**Checkpoint**: Full comment lifecycle with nested replies, voting, and CRUD works

---

## Phase 7: User Story 5 — Best Answer Marking (Priority: P2)

**Goal**: Post author can mark/unmark one comment as "Best Answer". Marked comment appears at top with visual highlight.

**Independent Test**: As post author, click "Best Answer" on a comment → green badge appears, comment moves to top. Click again → unmark.

### Implementation for User Story 5

- [x] T041 [US5] Add `toggleBestAnswer(commentId, userId)` method to `backend/src/discussions/discussions.service.ts` — verify user is post author, toggle `isBestAnswer` on comment and `bestAnswerCommentId` on discussion, create notification ("best-answer") for comment author
- [x] T042 [US5] Add `PATCH /discussions/comments/:id/best-answer` endpoint to `backend/src/discussions/discussions.controller.ts` with Swagger decorator
- [x] T043 [US5] Add `bestAnswer(commentId)` method to `frontend/src/services/discussionsService.ts`
- [x] T044 [US5] Add "Mark as Best Answer" / "Unmark" button on each comment in `frontend/src/pages/DiscussionDetailPage.tsx` — visible only to post author, calls `bestAnswer()` API
- [x] T045 [US5] Sort best-answer comment to top of comment list in `frontend/src/pages/DiscussionDetailPage.tsx` and show green highlight ring + "✅ Best Answer" badge

**Checkpoint**: Best answer marking works with correct authorization and visual feedback

---

## Phase 8: User Story 6 — Real-Time Notifications (Priority: P2)

**Goal**: Users receive real-time notifications for interactions on their content. Bell icon with badge in navbar.

**Independent Test**: User A posts. User B comments on it. User A sees bell badge → clicks → sees notification → marks read → badge decreases.

### Implementation for User Story 6

- [x] T046 [US6] Create `frontend/src/services/notificationsService.ts` — REST methods (`getAll`, `getUnreadCount`, `markRead`, `markAllRead`) + Socket.IO client connecting to `/notifications` namespace with JWT auth
- [x] T047 [US6] Create `frontend/src/components/NotificationBell.tsx` — bell icon component with unread count badge, dropdown panel listing notifications with type-specific icons (👍/💬/↩️/✅), mark individual/all read buttons, link to related post on click
- [x] T048 [US6] Add `NotificationBell` component to `frontend/src/components/Navbar.tsx` — render only for authenticated users, positioned in the top-right action area
- [x] T049 [US6] Connect Socket.IO listener in `NotificationBell` — on `new-notification` event, increment badge count and prepend notification to dropdown list

**Checkpoint**: Notifications work end-to-end: backend creates → Socket.IO delivers → bell shows badge → dropdown lists → mark read works

---

## Phase 9: User Story 7 — My Posts Dashboard (Priority: P3)

**Goal**: Users can view and manage all their own posts with stats and filters.

**Independent Test**: Navigate to "My Posts" → see all own posts with like/comment/view counts. Filter by unsolved → only unsolved shown. Click edit → edit form works.

### Implementation for User Story 7

- [x] T050 [US7] Add `getMyPosts(userId, status?)` method to `backend/src/discussions/discussions.service.ts` — filter by `authorId`, optional `isSolved` filter
- [x] T051 [US7] Add `GET /discussions/my-posts` endpoint to `backend/src/discussions/discussions.controller.ts` with optional `status` query param and Swagger decorator (place BEFORE `:id` route)
- [x] T052 [US7] Add `getMyPosts(status?)` method to `frontend/src/services/discussionsService.ts`
- [x] T053 [US7] Add "My Posts" tab/view to `frontend/src/pages/DiscussionPage.tsx` — toggle between "All Posts" and "My Posts" view, show solved/unsolved filter, render posts with per-post stats, quick edit/delete actions

**Checkpoint**: My Posts dashboard works with filtering and quick actions

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Rate limiting, content moderation, i18n, documentation

- [ ] T054 [P] Install `@nestjs/throttler` and configure `ThrottlerModule` globally in `backend/src/app.module.ts` with default limits
- [ ] T055 [P] Apply `@Throttle()` decorators on post creation (5/hour), comment creation (30/hour), and voting (60/hour) endpoints in `backend/src/discussions/discussions.controller.ts`
- [x] T056 [P] Add `flagDiscussion(id, userId)` and `flagComment(commentId, userId)` methods to `backend/src/discussions/discussions.service.ts` — push userId to flags array, auto-set `isHidden=true` when `flags.length >= 5`
- [x] T057 [P] Add `POST /discussions/:id/flag` and `POST /discussions/comments/:id/flag` endpoints to `backend/src/discussions/discussions.controller.ts` with Swagger decorators
- [x] T058 [P] Add `flag(id)` and `flagComment(commentId)` methods to `frontend/src/services/discussionsService.ts`
- [x] T059 [P] Wire Flag buttons in `frontend/src/pages/DiscussionDetailPage.tsx` — on post (existing Flag icon) and on comments, call `flag()` API, show toast confirmation
- [ ] T060 [P] Add admin moderation: update `backend/src/discussions/discussions.controller.ts` to allow users with `admin` role to delete/hide any post or comment (bypass author check)
- [ ] T061 [P] Add all new translation keys (FR + EN) for forum UI text in frontend locale files
- [x] T062 [P] Create feature documentation at `docs/features/discussion-forum.md` with overview, API endpoints, data model, and usage guide

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (schema must be generated first)
- **User Stories (Phase 3-9)**: All depend on Phase 2 completion
  - **US1 (Browse)**: Independent — no dependencies on other stories
  - **US2 (Create/Edit)**: Independent — no dependencies on other stories
  - **US3 (Voting)**: Independent — no dependencies on other stories
  - **US4 (Comments)**: Independent — no dependencies on other stories
  - **US5 (Best Answer)**: Depends on US4 (comments must exist to mark as best)
  - **US6 (Notifications)**: Depends on Phase 2 (NotificationsModule must be registered)
  - **US7 (My Posts)**: Depends on US1 (reuses list view infrastructure)
- **Polish (Phase 10)**: Can start after Phase 2, independent of user stories

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → US1, US2, US3, US4, US6 (parallel)
                                          → US4 → US5 (sequential)
                                          → US1 → US7 (sequential)
                                          → All stories → Phase 10 (Polish)
```

### Parallel Opportunities

```
After Phase 2 completes, these can run in parallel:
├── US1: Browse & Search (T012-T019)
├── US2: Create/Edit/Delete (T020-T027)
├── US3: Voting (T028-T031)
├── US4: Comments & Replies (T032-T040)
└── US6: Notifications frontend (T046-T049)

After US4:
└── US5: Best Answer (T041-T045)

After US1:
└── US7: My Posts (T050-T053)

Phase 10 tasks are all [P] — can run in parallel
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T011)
3. Complete US1: Browse & Search (T012-T019)
4. **STOP and VALIDATE**: Real data shows on `/discussion`
5. Complete US2: Create/Edit/Delete (T020-T027)
6. **STOP and VALIDATE**: Post CRUD works
7. Complete US3: Voting (T028-T031)
8. **STOP and VALIDATE**: Voting works with visual feedback

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 → Real data browsing (MVP!) → Validate
3. US2 → Post creation works → Validate
4. US3 → Voting works → Validate
5. US4 → Comments work → Validate
6. US5 → Best Answer → Validate
7. US6 → Notifications → Validate
8. US7 → My Posts → Validate
9. Phase 10 → Polish, rate limiting, moderation, i18n, docs

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total: **62 tasks** across 10 phases
