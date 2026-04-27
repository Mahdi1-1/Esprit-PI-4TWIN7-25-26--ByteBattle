# Tasks: Hackathon System

**Input**: Design documents from `specs/009-hackathon-system/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US-A1, US-P1, etc.)
- Include exact file paths in descriptions

---

## Phase 1: Schema & Infrastructure (Blocking)

**Purpose**: Prisma schema changes and DTO scaffolding that all features depend on

**⚠️ CRITICAL**: Do NOT modify the existing `Team` or `TeamMember` models. Create NEW `HackathonTeam` and `HackathonTeamMember` instead.

- [ ] T001 Extend `HackathonStatus` enum in `backend/prisma/schema.prisma` — add `lobby`, `checkin`, `archived`, `cancelled` values
- [ ] T002 Modify `Hackathon` model in `backend/prisma/schema.prisma` — add `description String?`, `bannerUrl String?`, `cancelledReason String?`, `createdById String @db.ObjectId`, and relations to new models (`teams HackathonTeam[]`, `submissions`, `messages`, `announcements`, `clarifications`, `auditLogs`, `yjsSnapshots`)
- [ ] T003 Add NEW `HackathonTeam` model to `backend/prisma/schema.prisma` — completely separate from existing `Team` model, with fields: hackathonId, name, members (HackathonTeamMember[]), joinCode, isCheckedIn, isDisqualified, solvedCount, penaltyTime, score, type, companyId, createdAt, and relations to HackathonSubmission, HackathonMessage, HackathonClarification, YjsDocumentSnapshot
- [ ] T004 Add NEW `HackathonTeamMember` embedded type to `backend/prisma/schema.prisma` — separate from existing `TeamMember`, with fields: userId, role ("captain"/"member"), joinedAt
- [ ] T005 Add `HackathonSubmission` model to `backend/prisma/schema.prisma` with all fields from data-model.md (hackathonId, teamId→HackathonTeam, challengeId, userId, code, language, verdict, testsPassed, testsTotal, timeMs, memMb, attemptNumber, penaltyMinutes, isFirstBlood, jobId, submittedAt) and indexes
- [ ] T006 [P] Add `HackathonMessage` model to `backend/prisma/schema.prisma` with fields (hackathonId, teamId→HackathonTeam, userId, content, codeSnippet, codeLanguage, sentAt) and indexes
- [ ] T007 [P] Add `HackathonAnnouncement` model to `backend/prisma/schema.prisma` with fields (hackathonId, adminId, content, isPinned, createdAt) and indexes
- [ ] T008 [P] Add `HackathonClarification` model to `backend/prisma/schema.prisma` with fields (hackathonId, teamId→HackathonTeam, userId, challengeId, question, answer, answeredById, status, isBroadcast, createdAt, answeredAt) and indexes
- [ ] T009 [P] Add `HackathonAuditLog` model to `backend/prisma/schema.prisma` with fields (hackathonId, actorId, action, details, createdAt) and indexes
- [ ] T009b [P] Add `YjsDocumentSnapshot` model to `backend/prisma/schema.prisma` with fields (hackathonId, teamId→HackathonTeam, challengeId, snapshot Bytes, updatedAt) and unique compound index `[hackathonId, teamId, challengeId]`
- [ ] T010 Run `cd backend && npx prisma generate` to regenerate Prisma client
- [ ] T011 [P] Extend `CreateHackathonDto` in `backend/src/hackathons/dto/hackathon.dto.ts` — add `description`, `bannerUrl`, `teamPolicy` with proper validators
- [ ] T012 [P] Extend `UpdateHackathonDto` in `backend/src/hackathons/dto/hackathon.dto.ts` — add `description`, `bannerUrl`, add `TransitionStatusDto` class with `@IsEnum(HackathonStatus)` validator, add `CancelHackathonDto` with `reason: string`
- [ ] T013 [P] Create `backend/src/hackathons/dto/team.dto.ts` with `CreateTeamDto` (name: string), `JoinTeamDto` (joinCode: string), `RemoveMemberDto` (userId: string)
- [ ] T014 [P] Create `backend/src/hackathons/dto/submission.dto.ts` with `SubmitCodeDto` (challengeId, code, language), `RunCodeDto` (challengeId, code, language)
- [ ] T015 [P] Create `backend/src/hackathons/dto/clarification.dto.ts` with `CreateClarificationDto` (challengeId?, question), `AnswerClarificationDto` (answer, isBroadcast)
- [ ] T016 [P] Create `backend/src/hackathons/dto/announcement.dto.ts` with `CreateAnnouncementDto` (content, isPinned?)
- [ ] T017 [P] Create `backend/src/hackathons/dto/chat.dto.ts` with `SendMessageDto` (content, codeSnippet?, codeLanguage?)

**Checkpoint**: Schema generated, all DTOs ready — backend service work can begin

---

## Phase 2: Core Backend — Lifecycle & Teams (US-A1, US-A2, US-P1, US-P2)

**Purpose**: Hackathon CRUD, lifecycle state machine, team creation/joining/check-in

- [ ] T018 [US-A2] Add lifecycle validation to `backend/src/hackathons/hackathons.service.ts` — create private method `validateTransition(currentStatus, newStatus)` implementing the FULL state machine: draft→lobby (publish), lobby→draft (unpublish, only if 0 teams), lobby→checkin (auto 30min before or manual), checkin→active (≥1 checked-in team, auto at startTime or manual), active→frozen (auto at freezeAt or manual), active→ended (manual), frozen→ended (auto at endTime or manual), ended→archived. Also: any (except active/frozen)→cancelled
- [ ] T019 [US-A2] Add `transitionStatus(hackathonId, newStatus, adminId)` method to `backend/src/hackathons/hackathons.service.ts` — validate transition, update status, log audit entry
- [ ] T019b [US-A2] Add `cancelHackathon(hackathonId, adminId, reason)` method — validate status NOT active/frozen, soft delete (set status to `cancelled`, store `cancelledReason`), dissolve all teams, send notification to all participants, log audit. If status=draft, hard delete instead.
- [ ] T019c [US-A2] Add `deleteHackathon(hackathonId, adminId)` method — if draft: hard delete. If ended: soft delete to archived. If lobby/checkin: call cancelHackathon. If active/frozen: throw ForbiddenException.
- [ ] T019d [US-A2] Create `backend/src/hackathons/hackathon-scheduler.service.ts` with cron jobs for automatic transitions: lobby→checkin (30min before startTime), checkin→active (at startTime), active→frozen (at freezeAt), frozen→ended (at endTime). Use `@nestjs/schedule` with `@Cron()` or interval checking.
- [ ] T020 [US-A1] Update `create()` in `backend/src/hackathons/hackathons.service.ts` — generate 6-char alphanumeric `joinCode`, set `createdById` from current user, default status `draft`. If scope=enterprise+companyId: force teamPolicy to `{ minSize: 1, maxSize: 1 }`.
- [ ] T021 [US-A1] Update `update()` in `backend/src/hackathons/hackathons.service.ts` — only allow when status is `draft` or `lobby`, validate fields
- [ ] T022 [P] Create `backend/src/hackathons/hackathon-audit.service.ts` with `log(hackathonId, actorId, action, details)` method — creates `HackathonAuditLog` entry
- [ ] T023 [US-P1] Implement `createTeam()` in `backend/src/hackathons/hackathons.service.ts` — validate hackathon is in `lobby`, validate user NOT already in ANY active hackathon (single-hackathon rule), validate user not already in a HackathonTeam for this hackathon, generate team `joinCode`, set caller as captain with `joinedAt`. For enterprise scope: enforce max 1 team, validate user is CompanyMember.
- [ ] T024 [US-P1] Add `joinTeamByCode(hackathonId, joinCode, userId)` method to `backend/src/hackathons/hackathons.service.ts` — find HackathonTeam by joinCode, validate capacity from `teamPolicy.maxSize`, validate user NOT already in ANY active hackathon, validate user not already in a team for this hackathon, add member as HackathonTeamMember
- [ ] T025 [US-P2] Add `checkinTeam(hackathonId, teamId, userId)` method to `backend/src/hackathons/hackathons.service.ts` — validate hackathon is in `checkin`, validate caller is captain of this HackathonTeam, set `isCheckedIn = true`
- [ ] T026 [US-P2] Add `removeTeamMember(hackathonId, teamId, userId, targetUserId)` method — validate caller is captain, validate hackathon is `lobby`/`checkin`, cannot remove self (captain), remove HackathonTeamMember
- [ ] T027 [US-P2] Add `leaveTeam(hackathonId, teamId, userId)` method — validate `lobby`/`checkin`, remove self from members. **Captain succession**: if leaving user is captain, auto-promote oldest member (by `joinedAt`) to captain. If no members remain after leave, dissolve (delete) the HackathonTeam.
- [ ] T028 [US-A7] Add `disqualifyTeam(hackathonId, teamId, adminId, reason)` and `reinstateTeam(hackathonId, teamId, adminId)` methods — set `isDisqualified` on HackathonTeam, log audit

**Checkpoint**: Hackathon lifecycle + team management works via service layer

---

## Phase 3: Core Backend — Submissions & Scoreboard (US-P3, US-P6, US-A10)

**Purpose**: Submission pipeline, ICPC scoring, freeze/reveal

- [ ] T029 [US-P3] Create `backend/src/hackathons/hackathon-submission.service.ts` with constructor injecting PrismaService, QueueService
- [ ] T030 [US-P3] Implement `submitCode(hackathonId, teamId, userId, dto)` in submission service — validate hackathon is `active` or `frozen`, validate HackathonTeam not disqualified, enforce rate limit (1 submission per problem per minute per team — check last submission timestamp for this team+challenge), compute `attemptNumber` (count previous HackathonSubmissions for same team+challenge + 1), create `HackathonSubmission`, enqueue to judge-worker with `context: 'hackathon'`
- [ ] T031 [US-P3] Implement `runCode(hackathonId, userId, dto)` in submission service — validate active/frozen, execute against test cases via QueueService without creating submission
- [ ] T032 [US-P3] Implement `handleVerdict(submissionId, verdict, testsPassed, testsTotal, timeMs, memMb)` callback in submission service — update HackathonSubmission, check first blood (query if any prior AC for this hackathon+challenge), compute penalty if AC (use earliest AC time after rejudge), trigger scoreboard update
- [ ] T033 [US-P6] Create `backend/src/hackathons/hackathon-scoreboard.service.ts` with constructor injecting PrismaService, CacheManager (Redis)
- [ ] T034 [US-P6] Implement `computeScoreboard(hackathonId)` in scoreboard service — for each non-disqualified HackathonTeam: count solved problems (distinct challenges with AC), compute penalty per solved problem (time of earliest AC in minutes from start + wrongAttempts × 20), sort by solved DESC then penalty ASC
- [ ] T035 [US-P6] Implement per-problem status in scoreboard — for each team+challenge: return `{ status: solved|attempted|unattempted, time, attempts, isFirstBlood }`
- [ ] T036 [US-A10] Implement freeze logic in scoreboard service — when freeze triggers, compute and cache scoreboard in Redis/memory. `getFrozenScoreboard(hackathonId)` returns cached snapshot. Falls back to on-the-fly computation (filtering pre-freeze submissions) if cache misses.
- [ ] T037 [US-A10] Implement `getScoreboard(hackathonId, isAdmin)` — if frozen and not admin, return cached frozen snapshot; otherwise return live computed scoreboard
- [ ] T038 [US-A10] Implement `generateRevealSequence(hackathonId)` — starting from last place, for each team resolve their pending submissions one at a time, generating animation steps: `[{ teamId, challengeId, oldStatus, newStatus, newRank }]`

**Checkpoint**: ICPC scoring + freeze + reveal logic complete

---

## Phase 4: Communication Backend (US-P5, US-P7, US-P8, US-A4, US-A5)

**Purpose**: Team chat, clarifications, announcements

- [ ] T039 [P] [US-P5] Create `backend/src/hackathons/hackathon-chat.service.ts` with `sendMessage(hackathonId, teamId, userId, dto)` — validate team membership, create `HackathonMessage`, return message
- [ ] T040 [P] [US-P5] Add `getMessages(hackathonId, teamId, before?, limit?)` to chat service — cursor-based pagination (before = DateTime cursor), default limit 50, newest first
- [ ] T041 [P] [US-P7] Create `backend/src/hackathons/hackathon-clarification.service.ts` with `createClarification(hackathonId, teamId, userId, challengeId?, question)` — validate active/frozen, create with status "pending"
- [ ] T042 [P] [US-A5] Add `answerClarification(clarificationId, adminId, answer, isBroadcast)` to clarification service — set answer, answeredById, answeredAt, status, isBroadcast
- [ ] T043 [P] [US-A5] Add `getClarifications(hackathonId, teamId?, isAdmin?)` to clarification service — if admin: return all; if participant: return own team's + all broadcast answered
- [ ] T044 [P] [US-A4] Create `backend/src/hackathons/hackathon-announcement.service.ts` with `createAnnouncement(hackathonId, adminId, content, isPinned)` — create `HackathonAnnouncement`
- [ ] T045 [P] [US-A4] Add `getAnnouncements(hackathonId)` to announcement service — pinned first, then by createdAt DESC
- [ ] T046 [P] [US-A4] Add `togglePin(announcementId, adminId)` to announcement service

**Checkpoint**: All communication features have backend services

---

## Phase 5: WebSocket Gateway (Cross-cutting)

**Purpose**: Real-time event delivery for scoreboard, chat, collab, announcements

- [ ] T047 Create `backend/src/hackathons/hackathons.gateway.ts` — `@WebSocketGateway({ cors: '*', namespace: '/hackathons' })`, implement `OnGatewayConnection`, `OnGatewayDisconnect`, inject JwtService, ConfigService, all hackathon sub-services
- [ ] T048 Implement `handleConnection(client)` in gateway — extract JWT from handshake (same pattern as `backend/src/duels/duels.gateway.ts`), verify token, map socketId → userId
- [ ] T049 Implement `handleDisconnect(client)` in gateway — remove from clientMaps
- [ ] T050 Implement `@SubscribeMessage('join_hackathon')` — validate user is participant, add to `hackathon:{id}` room
- [ ] T051 Implement `@SubscribeMessage('join_team')` — validate user is team member, add to `team:{teamId}` room; if admin, also add to `admin:{hackathonId}` room
- [ ] T052 [US-P5] Implement `@SubscribeMessage('team_message')` — validate membership, persist via chat service, emit `team:message` to `team:{teamId}` room
- [ ] T053 [US-P4] Implement `@SubscribeMessage('collab_sync')` — relay Yjs CRDT update to `team:{teamId}` room (exclude sender), also trigger periodic persistence (see T053b)
- [ ] T053b [US-P4] Create `backend/src/hackathons/hackathon-yjs.service.ts` — periodic Yjs document persistence to MongoDB via `YjsDocumentSnapshot` model. Implement `persistSnapshot(hackathonId, teamId, challengeId, snapshot: Buffer)` to upsert into MongoDB, and `loadSnapshot(hackathonId, teamId, challengeId)` to retrieve. Use debounced persistence: on each `collab_sync` event, reset a 5-second timer; when timer fires, persist the accumulated Yjs document state to MongoDB. On reconnect/page reload, load last snapshot from `YjsDocumentSnapshot` to restore editor state.
- [ ] T054 [US-P4] Implement `@SubscribeMessage('collab_awareness')` — relay cursor awareness to `team:{teamId}` room (exclude sender)
- [ ] T055 [US-P6] Add `emitScoreboardUpdate(hackathonId, scoreboardDelta)` helper — emit `scoreboard:update` to `hackathon:{id}` room (called from submission verdict handler)
- [ ] T056 [US-A4] Add `emitAnnouncement(hackathonId, announcement)` helper — emit `announcement:new` to `hackathon:{id}` room
- [ ] T057 [US-A5] Add `emitClarificationResponse(hackathonId, teamId, clarification, isBroadcast)` helper — if broadcast, emit to `hackathon:{id}`; else emit to `team:{teamId}`
- [ ] T058 [US-A2] Add `emitStatusChange(hackathonId, newStatus, oldStatus)` helper — emit `hackathon:status_change` to `hackathon:{id}` room
- [ ] T059 [US-P3] Add `emitSubmissionVerdict(teamId, submission)` helper — emit `submission:verdict` to `team:{teamId}` room
- [ ] T060 [US-A3] Add `emitAdminFeed(hackathonId, event)` helper — emit `admin:submission_feed` and `admin:team_activity` to `admin:{hackathonId}` room

**Checkpoint**: All real-time events flow correctly through WebSocket gateway

---

## Phase 6: Admin Backend — Monitoring, Rejudge, Export (US-A3, US-A6, US-A8, US-A9, US-A11)

**Purpose**: Admin-specific backend features

- [ ] T061 [P] [US-A3] Create `backend/src/hackathons/hackathon-monitoring.service.ts` with `getMonitoringData(hackathonId)` — aggregate: totalSubmissions, acceptanceRate, activeTeams (submitted in last 15min), idleTeams, problemsSolvedDistribution, recentSubmissions (last 20), teamActivity
- [ ] T062 [P] [US-A6] Add `rejudgeProblem(hackathonId, challengeId, adminId)` to submission service — find all HackathonSubmissions for challenge, re-queue each to judge-worker with `isRejudge: true` flag, log audit. After all verdicts return, recompute scoreboard using earliest-AC-wins rule (Decision #16).
- [ ] T063 [P] [US-A6] Add `rejudgeTeam(hackathonId, teamId, adminId)` to submission service — find all HackathonSubmissions for HackathonTeam, re-queue each, log audit
- [ ] T064 [P] [US-A8] Add `getAuditLog(hackathonId, action?, page, limit)` to audit service — paginated query with optional action filter
- [ ] T065 [P] [US-A11] Add `exportResults(hackathonId, format)` to scoreboard service — generate CSV rows or JSON with: rank, teamName, members, solved, penalty, per-problem details
- [ ] T066 [P] [US-A9] Create basic anti-plagiarism: `checkPlagiarism(hackathonId, challengeId)` — for v1, simple string similarity (Jaccard index on tokenized code); store results in a scan document

**Checkpoint**: All admin features have backend services

---

## Phase 7: Controller Wiring & Module Setup

**Purpose**: Connect all services to HTTP endpoints and configure module

- [ ] T067 Update `backend/src/hackathons/hackathons.module.ts` — import QueueModule, JwtModule, ConfigModule; add all new services as providers; add HackathonsGateway as provider
- [ ] T068 [US-A2] Add `PATCH /hackathons/:id/status` endpoint to `backend/src/hackathons/hackathons.controller.ts` — `@Roles('admin')`, validate `TransitionStatusDto`, call `transitionStatus()`
- [ ] T069 [US-P1] Add `POST /hackathons/:id/teams/join` endpoint — call `joinTeamByCode()` (change from current `POST /hackathons/teams/:teamId/join`)
- [ ] T069b [US-P1] Add `POST /hackathons/:id/join-solo` endpoint — shortcut that auto-creates a HackathonTeam of 1 with the user as captain, validate hackathon `teamPolicy.minSize <= 1`. Internally calls `createTeam()` then immediately returns the team.
- [ ] T070 [US-P2] Add `POST /hackathons/:id/teams/:teamId/checkin` endpoint — validate captain, call `checkinTeam()`
- [ ] T071 [US-P2] Add `DELETE /hackathons/:id/teams/:teamId/members/:userId` endpoint — validate captain, call `removeTeamMember()`
- [ ] T072 [US-P2] Add `POST /hackathons/:id/teams/:teamId/leave` endpoint — call `leaveTeam()` (handles captain succession per Decision #14)
- [ ] T073 [US-P3] Add `POST /hackathons/:id/submit` endpoint — validate team member, call `submitCode()`. Return `429 Too Many Requests` with `Retry-After` header if rate limit (1 submission/problem/minute) exceeded.
- [ ] T074 [US-P3] Add `POST /hackathons/:id/run` endpoint — validate team member, call `runCode()`
- [ ] T075 [US-P3] Add `GET /hackathons/:id/teams/:teamId/submissions` endpoint — validate team member or admin
- [ ] T076 [US-P7] Add `POST /hackathons/:id/clarifications` endpoint — validate team member, call `createClarification()`
- [ ] T077 [US-A5] Add `POST /hackathons/:id/clarifications/:clarificationId/answer` endpoint — `@Roles('admin')`, call `answerClarification()`
- [ ] T078 [US-P7] Add `GET /hackathons/:id/clarifications` endpoint — call `getClarifications()` with team context
- [ ] T079 [US-P5] Add `GET /hackathons/:id/teams/:teamId/messages` endpoint — validate team member
- [ ] T080 [US-P5] Add `POST /hackathons/:id/teams/:teamId/messages` endpoint — validate team member
- [ ] T081 [US-A4] Add `POST /hackathons/:id/announcements` endpoint — `@Roles('admin')`, call `createAnnouncement()`, emit via gateway
- [ ] T082 [US-A4] Add `GET /hackathons/:id/announcements` endpoint — public to participants
- [ ] T083 [US-A4] Add `PATCH /hackathons/:id/announcements/:announcementId` endpoint — `@Roles('admin')`, call `togglePin()`
- [ ] T084 [US-A6] Add `POST /hackathons/:id/rejudge` endpoint — `@Roles('admin')`, accept `{ challengeId?, teamId? }`
- [ ] T085 [US-A7] Add `PATCH /hackathons/:id/teams/:teamId/disqualify` and `PATCH .../reinstate` endpoints — `@Roles('admin')`
- [ ] T086 [US-A3] Add `GET /hackathons/:id/admin/monitoring` endpoint — `@Roles('admin')`
- [ ] T087 [US-A8] Add `GET /hackathons/:id/admin/audit-log` endpoint — `@Roles('admin')`
- [ ] T088 [US-A3] Add `GET /hackathons/:id/admin/scoreboard` endpoint — `@Roles('admin')`, always returns live data
- [ ] T089 [US-A11] Add `POST /hackathons/:id/export` endpoint — `@Roles('admin')`, stream file download
- [ ] T090 [US-A9] Add `POST /hackathons/:id/plagiarism-scan` and `GET .../plagiarism-scan/:scanId` endpoints — `@Roles('admin')`
- [ ] T090b [US-A2] Add `DELETE /hackathons/:id` endpoint — `@Roles('admin')`, call `deleteHackathon()`. Returns 204 for hard delete (draft), 200 with archived/cancelled body for soft delete, 403 for active/frozen.
- [ ] T090c [US-A2] Add `POST /hackathons/:id/cancel` endpoint — `@Roles('admin')`, body `{ reason: string }`, call `cancelHackathon()`. Returns 403 if status is active/frozen.
- [ ] T091 Add Swagger `@ApiTags('hackathons')` and `@ApiOperation()` decorators to all new endpoints

**Checkpoint**: All ~35 endpoints are wired and accessible via Swagger UI

---

## Phase 8: Frontend — Services & Hooks

**Purpose**: API client methods and WebSocket hooks

- [ ] T092 [P] Extend `frontend/src/services/hackathonsService.ts` — add methods: `getScoreboardLive()`, `transitionStatus()`, `createTeam()`, `joinTeamByCode()`, `joinSolo()`, `checkinTeam()`, `removeTeamMember()`, `leaveTeam()`, `submitCode()`, `runCode()`, `getTeamSubmissions()`, `getClarifications()`, `createClarification()`, `getAnnouncements()`, `getTeamMessages()`, `sendTeamMessage()`, `getTeamDetail()`, `disqualifyTeam()`, `reinstateTeam()`, `rejudge()`, `getMonitoring()`, `getAuditLog()`, `getAdminScoreboard()`, `exportResults()`, `triggerPlagiarismScan()`, `getPlagiarismResults()`, `cancelHackathon()`, `deleteHackathon()`
- [ ] T093 [P] Create `frontend/src/hooks/useHackathonSocket.ts` — Socket.IO connection to `/hackathons` namespace with JWT auth, auto-join hackathon room, expose `joinTeamRoom()`, `onScoreboardUpdate()`, `onAnnouncement()`, `onSubmissionVerdict()`, `onStatusChange()`, `sendTeamMessage()`, `sendCollabSync()`, `sendCollabAwareness()` handlers
- [ ] T094 [P] Create `frontend/src/hooks/useScoreboard.ts` — state management for scoreboard data, integration with `useHackathonSocket` for real-time updates, merge deltas into local state
- [ ] T095 [P] Create `frontend/src/hooks/useCollabEditor.ts` — initialize Yjs Doc, create `y-websocket` provider using hackathon socket, bind to Monaco editor, manage awareness (cursor color, name), cleanup on unmount. On mount, request last `YjsDocumentSnapshot` from server to restore state (Decision #20: periodic Yjs persistence to MongoDB).

**Checkpoint**: Frontend data layer ready for UI components

---

## Phase 9: Frontend — Participant Pages (US-P1, US-P2, US-P3, US-P4, US-P5, US-P6)

**Purpose**: All participant-facing UI pages and components

### 9A: Hackathon Listing & Lobby (US-P1, US-P2)

- [ ] T096 [US-P1] Update `frontend/src/pages/Hackathon.tsx` — enhance sections: "Ongoing" (active/frozen), "Registration Open" (lobby), "Check-in" (checkin), "Upcoming" (draft, for admin only), "Finished" (ended/archived), "Cancelled" (cancelled, dimmed style); add Register/Join/Join Solo buttons for lobby hackathons
- [ ] T097 [US-P1] Create `frontend/src/pages/HackathonLobby.tsx` — show hackathon details (title, rules, team policy), create team form (name input), join team form (joinCode input), **"Join Solo" button** (calls `joinSolo()`, visible only when `teamPolicy.minSize <= 1`), team roster display, check-in button (visible to captain during checkin), countdown to start
- [ ] T098 [US-P2] Create `frontend/src/components/hackathon/TeamRoster.tsx` — display HackathonTeam members with roles, avatar, join time; captain sees remove button (during lobby/checkin); member sees leave button (with captain succession warning if captain); shareable join code with copy button

### 9B: Competition Workspace (US-P3, US-P4, US-P5)

- [ ] T099 [US-P3] Create `frontend/src/pages/HackathonWorkspace.tsx` — main competition layout: resizable 3-panel layout (left: problem sidebar, center: editor + test/submission panel, right: chat + clarifications); top bar with hackathon timer and team name
- [ ] T100 [US-P3] Create `frontend/src/components/hackathon/ProblemSidebar.tsx` — list problems A-F with title, difficulty badge, status icon (✓ green for solved, ✗ red for attempted, — gray for unattempted); click to select problem
- [ ] T101 [US-P3] Implement problem detail view in `HackathonWorkspace.tsx` — problem description panel (markdown rendered), examples section, constraints, input/output format
- [ ] T102 [US-P4] Create `frontend/src/components/hackathon/CollabEditor.tsx` — Monaco Editor instance + Yjs integration via `useCollabEditor` hook; show remote cursors with color-coded name tags; language selector dropdown (options filtered by per-challenge `allowedLanguages`, Decision #18); Run and Submit buttons
- [ ] T103 [US-P3] Implement test execution in workspace — "Run" button calls `hackathonsService.runCode()`, display test results in bottom panel (input, expected, actual, pass/fail for each test case)
- [ ] T104 [US-P3] Implement code submission in workspace — "Submit" button calls `hackathonsService.submitCode()`, show "Judging..." state, update on `submission:verdict` WebSocket event, show verdict badge (AC green, WA red, etc.). On 429 response, disable submit button and show cooldown timer (Decision #19: 1 submission/problem/minute).
- [ ] T105 [US-P3] Add submissions history tab to workspace — list of team's past submissions for current problem with attempt number, verdict, time, language
- [ ] T106 [US-P5] Create `frontend/src/components/hackathon/TeamChat.tsx` — message list (scrollable, auto-scroll to bottom), input with send button, code snippet formatting (triple backtick renders with syntax highlight), sender avatar + name + timestamp
- [ ] T107 [US-P5] Wire TeamChat to `useHackathonSocket` — `sendTeamMessage()` on send, listen to `team:message` for incoming, load history via `hackathonsService.getTeamMessages()` on mount

### 9C: Scoreboard (US-P6)

- [ ] T108 [US-P6] Create `frontend/src/components/hackathon/ScoreboardTable.tsx` — reusable ICPC scoreboard table component: rank column, team name, solved count, penalty, per-problem status cells using `ProblemCell` pattern from existing `HackathonScoreboard.tsx`
- [ ] T109 [US-P6] Extract `ProblemCell` component to `frontend/src/components/hackathon/ProblemCell.tsx` — status cell rendering: green (solved with time+attempts+firstBlood), red (attempted with attempts), gray (unattempted)
- [ ] T110 [US-P6] Update `frontend/src/pages/HackathonScoreboard.tsx` — replace hardcoded data with `useScoreboard` hook, connect to `useHackathonSocket` for real-time updates, show "SCOREBOARD FROZEN" banner when frozen, show team highlight for current user's team
- [ ] T111 [US-A10] Create `frontend/src/components/hackathon/ScoreboardReveal.tsx` — unfreeze reveal animation component: bottom-up row resolution, each team's pending cells resolve one at a time with suspense delay (1-2 seconds per resolution), rank may change during reveal (row slides up/down), confetti on final #1

### 9D: Communication UI (US-P7, US-P8)

- [ ] T112 [US-P7] Create `frontend/src/components/hackathon/ClarificationPanel.tsx` — tabs: "My Requests" + "Broadcast"; request form (problem selector dropdown, question textarea, submit button); list of past requests with status badge (pending yellow, answered green, no-response gray)
- [ ] T113 [US-P8] Create `frontend/src/components/hackathon/AnnouncementBanner.tsx` — toast notification on new announcement (auto-dismiss after 10s), announcements panel (drawer/modal) listing all announcements with pinned at top; listen to `announcement:new` WebSocket event

### 9E: Results & Timer

- [ ] T114 [US-P10] Create `frontend/src/pages/HackathonResults.tsx` — final rankings table (same as scoreboard but without freeze), team detail view (click to expand: members, per-problem breakdown with time and attempts vs median), first blood badges
- [ ] T115 Create `frontend/src/components/hackathon/HackathonTimer.tsx` — countdown to end time, show phase indicators (Active / Frozen), flash warning at 30min and 5min remaining

**Checkpoint**: All participant-facing UI is implemented

---

## Phase 10: Frontend — Admin Pages (US-A1, US-A2, US-A3, US-A4, US-A5, US-A6, US-A7, US-A8)

**Purpose**: Admin hackathon management UI

### 10A: Creation Wizard (US-A1)

- [ ] T116 [US-A1] Create `frontend/src/pages/admin/AdminHackathonCreate.tsx` — 7-step wizard container: step indicator bar, prev/next buttons, "Save Draft" and "Publish" on final step, progress persistence in component state
- [ ] T117 [US-A1] Create `frontend/src/components/hackathon/CreateWizard/WizardStep1General.tsx` — title input (required, max 200), description textarea, banner image upload
- [ ] T118 [US-A1] Create `frontend/src/components/hackathon/CreateWizard/WizardStep2Rules.tsx` — markdown editor for rules (preview pane toggle)
- [ ] T119 [US-A1] Create `frontend/src/components/hackathon/CreateWizard/WizardStep3Problems.tsx` — challenge picker: search input, filterable by difficulty/category, list of published challenges with checkbox selection, selected challenges shown with drag-to-reorder (determines A/B/C labeling)
- [ ] T120 [US-A1] Create `frontend/src/components/hackathon/CreateWizard/WizardStep4TeamPolicy.tsx` — min team size input (1-5), max team size input (1-5), auto-assign toggle
- [ ] T121 [US-A1] Create `frontend/src/components/hackathon/CreateWizard/WizardStep5Timing.tsx` — start time datetime picker, end time datetime picker, freeze-at datetime picker (optional, with helper "30 min before end" button)
- [ ] T122 [US-A1] Create `frontend/src/components/hackathon/CreateWizard/WizardStep6Access.tsx` — scope selector (public/invite-only/enterprise), join code display (auto-generated), company selector (for enterprise scope). When enterprise selected: auto-set team policy to max 1 team + 1 member (Decision #23), show info banner explaining enterprise constraints.
- [ ] T123 [US-A1] Create `frontend/src/components/hackathon/CreateWizard/WizardStep7Review.tsx` — summary card of all settings with edit links back to each step, "Save as Draft" and "Publish" (→ lobby) buttons

### 10B: Admin Dashboard & Lifecycle (US-A2, US-A3)

- [ ] T124 [US-A2] Create `frontend/src/pages/admin/AdminHackathonDetail.tsx` — hackathon detail with status badge (8 states including cancelled), lifecycle action buttons (context-dependent: "Open Registration", "Start Check-in", "Start Competition", "Freeze"/"Unfreeze" (admin override, Decision #22), "End & Reveal", "Archive", "Cancel" with reason prompt, "Delete" with confirmation), team list, quick stats
- [ ] T125 [US-A2] Update `frontend/src/pages/admin/AdminHackathons.tsx` — enhance existing page: lifecycle buttons per hackathon card (Start, Freeze, End, Cancel, Delete), status chips for all 8 states, link to detail page, link to create wizard. Delete button: disabled for active/frozen (with tooltip explaining why)
- [ ] T126 [US-A3] Create `frontend/src/pages/admin/AdminHackathonMonitoring.tsx` — real-time dashboard: submission feed (streaming via WebSocket), team activity grid (active/idle/offline indicators), aggregate stats cards (total submissions, acceptance rate, problems solved chart), auto-refresh every 5s

### 10C: Admin Communication (US-A4, US-A5)

- [ ] T127 [US-A4] Add announcement creation section to `AdminHackathonDetail.tsx` — textarea, pin toggle, "Broadcast" button; list of past announcements below
- [ ] T128 [US-A5] Create `frontend/src/pages/admin/AdminHackathonClarifications.tsx` — queue of pending clarifications sorted by newest; each shows team name, problem label, question; answer form with textarea + "Send Private" / "Broadcast to All" / "No Response Needed" buttons; answered/dismissed shown in separate tab

### 10D: Admin Team & Audit (US-A7, US-A8)

- [ ] T129 [US-A7] Add team management panel to `AdminHackathonDetail.tsx` — list of HackathonTeams with members, check-in status, solved count; "Disqualify" button with reason input, "Reinstate" button for disqualified teams
- [ ] T130 [US-A8] Add audit log viewer to `AdminHackathonDetail.tsx` — paginated list of admin actions with actor name, action type, details, timestamp; filter by action type dropdown

### 10E: Admin Advanced (US-A6, US-A9, US-A11)

- [ ] T131 [US-A6] Add rejudge section to `AdminHackathonDetail.tsx` — dropdown to select problem, "Rejudge Problem" button, progress display (X/Y completed); dropdown to select team, "Rejudge Team" button
- [ ] T132 [US-A9] Add plagiarism scan section to `AdminHackathonDetail.tsx` — trigger scan per problem, show progress, display flagged pairs with similarity percentage, "Review" button opens side-by-side code view modal
- [ ] T133 [US-A11] Add export section to `AdminHackathonDetail.tsx` — "Export CSV" and "Export JSON" buttons, download file

**Checkpoint**: All admin-facing UI is implemented

---

## Phase 11: Routing, Integration & Polish

**Purpose**: Wire routes, install dependencies, add tests, documentation

- [ ] T134 Update `frontend/src/routes.tsx` — add routes: `/hackathon/:id/lobby` → `HackathonLobby`, `/hackathon/:id/workspace` → `HackathonWorkspace`, `/hackathon/:id/results` → `HackathonResults`, `/admin/hackathons/create` → `AdminHackathonCreate`, `/admin/hackathons/:id` → `AdminHackathonDetail`, `/admin/hackathons/:id/monitoring` → `AdminHackathonMonitoring`, `/admin/hackathons/:id/clarifications` → `AdminHackathonClarifications`
- [ ] T135 Install Yjs dependencies in frontend: `cd frontend && pnpm add yjs y-monaco lib0`
- [ ] T136 Wire navigation in `Hackathon.tsx` — based on hackathon status and user's team membership: lobby → HackathonLobby, active/frozen → HackathonWorkspace, ended → HackathonResults
- [ ] T137 Wire navigation in `HackathonWorkspace.tsx` — redirect to lobby if not in a team, redirect to results if ended
- [ ] T138 [P] Add loading skeletons to all new pages (HackathonLobby, HackathonWorkspace, HackathonScoreboard, HackathonResults, AdminHackathonCreate, AdminHackathonDetail, AdminHackathonMonitoring)
- [ ] T139 [P] Add error boundaries and empty states to all new pages
- [ ] T140 [P] Add keyboard shortcuts to HackathonWorkspace: `Ctrl+Enter` = Submit, `Ctrl+R` = Run, `Ctrl+/` = Toggle chat, `Ctrl+.` = Toggle clarifications (register via `useKeyboardShortcuts` hook)
- [ ] T141 [P] Add unit tests for ICPC scoring logic: `hackathon-scoreboard.service.spec.ts` — test ranking, penalty computation, first blood, freeze snapshot (Redis cache), reveal sequence, earliest-AC-wins after rejudge (Decision #16)
- [ ] T142 [P] Add unit tests for lifecycle state machine: `hackathons.service.spec.ts` — test all valid transitions (8-state machine including cancelled), rejection of invalid transitions, deletion rules by status (Decision #24), concurrent participation check (Decision #15), captain succession (Decision #14), solo join shortcut (Decision #13), enterprise scope constraints (Decision #23), rate limiting (Decision #19)
- [ ] T143 [P] Create `docs/features/hackathon-system.md` with feature overview, lifecycle diagram, scoring rules, API endpoint table, WebSocket events table

**Checkpoint**: All routes wired, dependencies installed, tests passing, documentation complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Schema)**: No dependencies — start immediately
- **Phase 2 (Lifecycle & Teams)**: Depends on Phase 1
- **Phase 3 (Submissions & Scoreboard)**: Depends on Phase 1
- **Phase 4 (Communication)**: Depends on Phase 1
- **Phase 5 (WebSocket)**: Depends on Phases 2, 3, 4 (needs all services)
- **Phase 6 (Admin Backend)**: Depends on Phases 3, 4
- **Phase 7 (Controller)**: Depends on Phases 2, 3, 4, 5, 6 (all backend services)
- **Phase 8 (Frontend Services)**: Depends on Phase 7 (API contracts must be final)
- **Phase 9 (Frontend Participant)**: Depends on Phase 8
- **Phase 10 (Frontend Admin)**: Depends on Phase 8
- **Phase 11 (Polish)**: Depends on Phases 9, 10

### Parallel Opportunities

```
After Phase 1:
├── Phase 2: Lifecycle & Teams
├── Phase 3: Submissions & Scoreboard
└── Phase 4: Communication (all 3 sub-phases parallel)

After Phases 2+3+4:
├── Phase 5: WebSocket Gateway
├── Phase 6: Admin Backend (parallel sub-phases)
└── Phase 7: Controller Wiring (after 5+6)

After Phase 7+8:
├── Phase 9: Participant UI (9A, 9B, 9C, 9D, 9E all parallel)
└── Phase 10: Admin UI (10A, 10B, 10C, 10D, 10E all parallel)

Phase 11 tasks are all [P] — can run in parallel
```

### MVP Subset (Minimum Viable Hackathon)

For a working hackathon system without advanced features:

**Required**: T001-T010 (schema), T018-T028 (lifecycle+teams), T029-T037 (submissions+scoreboard), T047-T051+T055+T058+T059 (gateway core), T067-T075+T069b+T090b+T090c+T091 (controller core), T092-T094 (frontend services), T096-T105+T108-T110+T115 (participant UI core), T116-T125 (admin UI core), T134-T137 (routing)

**Deferrable**: Co-editing (T053-T054, T053b, T095, T102), Team Chat (T039-T040, T052, T106-T107), Clarifications (T041-T043, T076-T078, T112, T128), Announcements (T044-T046, T056, T081-T083, T113, T127), Monitoring (T061, T060, T086, T126), Rejudge (T062-T063, T084, T131), Export (T065, T089, T133), Plagiarism (T066, T090, T132), Audit (T022, T064, T087, T130), Reveal Animation (T038, T111)

---

## Notes

- Total: **~150 tasks** across 11 phases (including sub-tasks T009b, T019b-d, T053b, T069b, T090b-c)
- MVP: ~80 tasks (Phases 1-3, core of 5+7, 8, core of 9+10, 11 routing)
- Post-MVP: ~70 tasks (collab editing, chat, clarifications, monitoring, rejudge, export, plagiarism, audit, reveal, polish)
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each task or logical group
- Stop at each checkpoint to validate independently
