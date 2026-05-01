# Implementation Plan: Hackathon System

**Branch**: `009-hackathon-system` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/009-hackathon-system/spec.md`

## Summary

Implement the complete Hackathon system for ByteBattle2 including admin management (lifecycle, monitoring, rejudge, announcements, clarifications) and participant features (team creation, ICPC scoreboard, code submission, collaborative editing via Yjs CRDT, team chat, freeze/reveal). The system extends the existing basic `hackathons/` module with 6 new Prisma models, a Socket.IO gateway, and ~20 new frontend pages/components.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: NestJS 10.x (backend), React 18.x + Vite 6.x (frontend), Yjs + y-websocket (co-editing)  
**Storage**: MongoDB via Prisma 6.x  
**Queue**: BullMQ (existing, for judge-worker submission processing)  
**Target Platform**: Web (Linux server)  
**Real-Time**: Socket.IO 4.x via NestJS `@WebSocketGateway`  
**Project Type**: Web application (monorepo: `backend/` + `frontend/` + `judge-worker/`)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modular Architecture | ✅ Pass | Extends existing `hackathons/` NestJS module with sub-services (scoreboard, submission, chat, collab) |
| II. Naming Conventions | ✅ Pass | Files follow `kebab-case.type.ts`, classes PascalCase, WS events `kebab-case` |
| III. TypeScript Strictness | ✅ Pass | All DTOs use `class-validator`, typed interfaces for WebSocket payloads |
| IV. Testing Discipline | ⚠️ Gate | No tests exist today — this plan MUST add tests for scoring logic and lifecycle transitions |
| V. Documentation-First | ✅ Pass | Feature doc at `docs/features/hackathon-system.md` will be created |
| VI. Real-Time Standards | ✅ Pass | Hackathon gateway follows pattern from `duels.gateway.ts` with JWT auth |
| VII. Internationalization | ✅ Pass | All new UI text will use existing theming CSS variables |
| VIII. Game Metrics | ✅ Pass | Hackathon results contribute to user XP and badges |

## Project Structure

### Documentation (this feature)

```text
specs/009-hackathon-system/
├── plan.md              # This file
├── spec.md              # Feature specification (21 user stories)
├── research.md          # Resolved design decisions (20 decisions)
├── data-model.md        # Prisma schema changes (8 new models, 0 modified existing)
├── contracts/
│   └── api.md           # ~35 API endpoints + ~20 WebSocket events
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Task breakdown
```

### Key Design Principle: HackathonTeam ≠ Team

The existing `Team` model is **NOT modified**. A new `HackathonTeam` model is created independently. No relation between them.

### Source Code (repository root)

```text
backend/
├── prisma/
│   └── schema.prisma                         # MODIFY: extend HackathonStatus enum, add 8 new models (DO NOT touch Team)
├── src/
│   ├── hackathons/
│   │   ├── hackathons.module.ts              # MODIFY: add gateway, sub-services, imports
│   │   ├── hackathons.controller.ts          # MODIFY: extend with all new endpoints
│   │   ├── hackathons.service.ts             # MODIFY: lifecycle management, team management
│   │   ├── hackathons.gateway.ts             # NEW: WebSocket gateway /hackathons namespace
│   │   ├── hackathon-scoreboard.service.ts   # NEW: ICPC scoring, freeze logic, reveal sequence
│   │   ├── hackathon-submission.service.ts   # NEW: submission handling, verdict processing
│   │   ├── hackathon-chat.service.ts         # NEW: team chat CRUD
│   │   ├── hackathon-collab.service.ts       # NEW: Yjs CRDT document management
│   │   ├── hackathon-clarification.service.ts # NEW: clarification request/response
│   │   ├── hackathon-announcement.service.ts # NEW: announcement CRUD + broadcast
│   │   ├── hackathon-audit.service.ts        # NEW: audit log recording
│   │   ├── hackathon-monitoring.service.ts   # NEW: admin monitoring aggregation
│   │   └── dto/
│   │       ├── hackathon.dto.ts              # MODIFY: extend existing DTOs
│   │       ├── team.dto.ts                   # NEW: CreateTeamDto, JoinTeamDto, CheckinDto
│   │       ├── submission.dto.ts             # NEW: SubmitCodeDto, RunCodeDto
│   │       ├── clarification.dto.ts          # NEW: CreateClarificationDto, AnswerClarificationDto
│   │       ├── announcement.dto.ts           # NEW: CreateAnnouncementDto
│   │       └── chat.dto.ts                   # NEW: SendMessageDto

frontend/
├── src/
│   ├── pages/
│   │   ├── Hackathon.tsx                     # MODIFY: enhance listing with lobby/checkin states
│   │   ├── HackathonScoreboard.tsx           # MODIFY: real-time WebSocket updates, freeze UI
│   │   ├── HackathonLobby.tsx                # NEW: team creation/joining, pre-competition
│   │   ├── HackathonWorkspace.tsx            # NEW: main competition page (problems + editor + chat)
│   │   ├── HackathonResults.tsx              # NEW: post-competition results with reveal
│   │   └── admin/
│   │       ├── AdminHackathons.tsx            # MODIFY: enhance with lifecycle controls
│   │       ├── AdminHackathonCreate.tsx       # NEW: 7-step creation wizard
│   │       ├── AdminHackathonDetail.tsx       # NEW: admin hackathon dashboard
│   │       ├── AdminHackathonMonitoring.tsx   # NEW: live monitoring during competition
│   │       └── AdminHackathonClarifications.tsx # NEW: clarification queue
│   ├── components/
│   │   └── hackathon/
│   │       ├── ScoreboardTable.tsx            # NEW: reusable ICPC scoreboard component
│   │       ├── ScoreboardReveal.tsx           # NEW: unfreeze reveal animation
│   │       ├── ProblemCell.tsx                # EXTRACT: from HackathonScoreboard.tsx
│   │       ├── TeamChat.tsx                   # NEW: team chat panel
│   │       ├── CollabEditor.tsx              # NEW: Monaco + Yjs collaborative editor
│   │       ├── ClarificationPanel.tsx         # NEW: clarification request/view
│   │       ├── AnnouncementBanner.tsx         # NEW: announcement toast/banner
│   │       ├── HackathonTimer.tsx             # NEW: competition countdown with phases
│   │       ├── ProblemSidebar.tsx             # NEW: problem list with status icons
│   │       ├── TeamRoster.tsx                 # NEW: team members with awareness
│   │       ├── LiveFeed.tsx                   # EXTRACT: from HackathonScoreboard.tsx
│   │       └── CreateWizard/
│   │           ├── WizardStep1General.tsx      # NEW: title, description
│   │           ├── WizardStep2Rules.tsx        # NEW: markdown rules editor
│   │           ├── WizardStep3Problems.tsx     # NEW: challenge picker
│   │           ├── WizardStep4TeamPolicy.tsx   # NEW: min/max size, policy
│   │           ├── WizardStep5Timing.tsx       # NEW: start, end, freeze times
│   │           ├── WizardStep6Access.tsx       # NEW: scope, join code
│   │           └── WizardStep7Review.tsx       # NEW: preview and publish
│   ├── services/
│   │   └── hackathonsService.ts              # MODIFY: add all new API methods
│   └── hooks/
│       ├── useHackathonSocket.ts             # NEW: Socket.IO connection to /hackathons
│       ├── useCollabEditor.ts                # NEW: Yjs CRDT hook for Monaco
│       └── useScoreboard.ts                  # NEW: real-time scoreboard state
```

---

## Phase 0: Research

All 12 design decisions resolved in [research.md](./research.md). No outstanding unknowns.

Key decisions:
1. **Lifecycle**: 8-state machine (draft → lobby → checkin → active → frozen → ended → archived → cancelled) with automatic transitions and nuanced deletion rules
2. **Scoring**: ICPC (solved DESC, penalty ASC), earliest AC after rejudge
3. **Co-editing**: Yjs CRDT with periodic persistence to MongoDB (every 30s)
4. **Chat**: Socket.IO rooms per team within `/hackathons` namespace
5. **Freeze**: Cached in Redis/memory, participants see frozen snapshot, dramatic reveal on unfreeze
6. **WebSocket**: Single `/hackathons` namespace with room-based isolation
7. **Anti-plagiarism**: Post-hoc MOSS-style AST comparison
8. **Submissions**: Dedicated `HackathonSubmission` model (not reusing `Submission`), rate limited to 1/min/problem/team
9. **HackathonTeam ≠ Team**: Separate model, existing Team NOT modified
10. **Captain succession**: Auto-promote oldest member if captain leaves
11. **Single hackathon**: Users can only participate in ONE active hackathon at a time
12. **Enterprise**: scope=enterprise → 1 team, 1 member from company

---

## Phase 1: Data Model

### Prisma Schema Changes

Full schema changes documented in [data-model.md](./data-model.md). Summary:

1. **Extend** `HackathonStatus` enum: add `lobby`, `checkin`, `archived`, `cancelled`
2. **Modify** `Hackathon` model: add `description`, `bannerUrl`, `cancelledReason`, `createdById`, new relations
3. **DO NOT MODIFY** existing `Team` model — keep `session`, `analytics` for backward compatibility
4. **NEW** `HackathonTeam` model: separate from `Team`, with `joinCode`, `isCheckedIn`, `isDisqualified`
5. **NEW** `HackathonTeamMember` embedded type: separate from `TeamMember`, with `joinedAt`
6. **NEW** `HackathonSubmission` model: team-scoped submissions with ICPC fields
7. **NEW** `HackathonMessage` model: team chat messages
8. **NEW** `HackathonAnnouncement` model: admin announcements
9. **NEW** `HackathonClarification` model: Q&A system
10. **NEW** `HackathonAuditLog` model: admin action audit trail
11. **NEW** `YjsDocumentSnapshot` model: persistent Yjs CRDT document snapshots

---

## Phase 1: API Contracts

Full API contracts documented in [contracts/api.md](./contracts/api.md). Summary:

- **7 public endpoints** (list, detail, scoreboard, announcements, clarifications, team detail, chat)
- **6 team endpoints** (create, join, checkin, leave, remove member, get detail)
- **3 submission endpoints** (submit, run, get team submissions) — rate limited: 1 submission/problem/minute
- **1 clarification endpoint** (create request)
- **2 chat endpoints** (get history, send message)
- **15 admin endpoints** (CRUD, lifecycle, cancel, announcements, clarifications, rejudge, disqualify, monitoring, audit, export, plagiarism)
- **~20 WebSocket events** (scoreboard, chat, collab, announcements, submissions)

---

## Implementation Phases

### Phase A: Schema + Infrastructure (Blocking)

1. Extend `HackathonStatus` enum with `lobby`, `checkin`, `archived`, `cancelled`
2. Modify `Hackathon` model: add `description`, `bannerUrl`, `cancelledReason`, `createdById`, new relations
3. **DO NOT modify** existing `Team` model — leave as-is
4. Add NEW `HackathonTeam` model (separate from `Team`)
5. Add NEW `HackathonTeamMember` embedded type (separate from `TeamMember`)
6. Add `HackathonSubmission` model
7. Add `HackathonMessage` model
8. Add `HackathonAnnouncement` model
9. Add `HackathonClarification` model
10. Add `HackathonAuditLog` model
11. Add `YjsDocumentSnapshot` model
12. Run `npx prisma generate`
13. Create new DTOs: `team.dto.ts`, `submission.dto.ts`, `clarification.dto.ts`, `announcement.dto.ts`, `chat.dto.ts`
14. Extend existing `hackathon.dto.ts` with new fields + `TransitionStatusDto` + `CancelHackathonDto`

### Phase B: Core Backend Services

**B1 — Lifecycle Management (US-A1, US-A2)**
1. Add lifecycle state machine validation to `hackathons.service.ts` (including automatic transitions, cancellation, and deletion rules)
2. Implement `transitionStatus(id, newStatus)` with full validation: draft→lobby, lobby→draft (only if 0 teams), lobby→checkin, checkin→active (≥1 checked-in team), active→frozen, active→ended, frozen→ended, ended→archived
3. Implement `cancelHackathon(id, reason)` — soft delete to `cancelled` (only from draft/lobby/checkin), with participant notification, team dissolution
4. Implement `deleteHackathon(id)` — hard delete (only from draft)
5. Implement `createHackathon()` with draft status, join code generation, enterprise enforcement
6. Implement `updateHackathon()` (only when draft/lobby)
7. Implement automatic transitions scheduler: lobby→checkin (30min before start), checkin→active (at startTime), active→frozen (at freezeAt), frozen→ended (at endTime)
8. Create `hackathon-audit.service.ts` — log all admin actions

**B2 — Team Management (US-P1, US-P2)**
1. Implement `createTeam()` — generate team join code, set captain, validate user not in another active hackathon, enforce enterprise limits (1 team, 1 member)
2. Implement `joinTeamByCode()` — validate capacity, status, user not in another active hackathon
3. Implement `checkinTeam()` — captain-only during checkin phase
4. Implement `removeTeamMember()` — captain-only during lobby/checkin
5. Implement `leaveTeam()` — member-only during lobby/checkin; if captain leaves, auto-promote oldest member
6. Implement `disqualifyTeam()` / `reinstateTeam()` — admin-only
7. Validate user not in another active hackathon on create/join

**B3 — Submission Pipeline (US-P3)**
1. Create `hackathon-submission.service.ts`
2. Implement `submitCode()` — validate active/frozen, compute attempt number, enforce rate limit (1/min/problem/team), queue to judge-worker
3. Implement `runCode()` — test execution without scoring
4. Implement verdict callback handler — on judge-worker completion, update submission and trigger scoreboard; after rejudge, use earliest AC time for penalty
5. First blood detection — check if first AC for challenge in this hackathon

**B4 — ICPC Scoreboard (US-P6, US-A10)**
1. Create `hackathon-scoreboard.service.ts`
2. Implement `computeScoreboard(hackathonId)` — aggregate by team, compute penalty, rank
3. Implement freeze logic — cache frozen snapshot in Redis/memory at freeze time
4. Implement `getScoreboard(hackathonId, isAdmin)` — if frozen and not admin, return cached snapshot; otherwise compute live; fallback to on-the-fly if cache miss
5. Implement `generateRevealSequence()` — bottom-up reveal data for animation
6. Implement scoreboard caching (compute once, invalidate on new verdict)

### Phase C: Communication Backend

**C1 — Team Chat (US-P5)**
1. Create `hackathon-chat.service.ts` — CRUD for messages
2. Implement `getMessages(teamId, cursor)` with cursor-based pagination
3. Implement `sendMessage(teamId, userId, content)` — persist and emit via WebSocket

**C2 — Clarifications (US-P7, US-A5)**
1. Create `hackathon-clarification.service.ts`
2. Implement `createClarification(teamId, userId, challengeId, question)`
3. Implement `answerClarification(id, adminId, answer, isBroadcast)`
4. Implement `getClarifications(hackathonId, teamId)` — team's own + all broadcast

**C3 — Announcements (US-P8, US-A4)**
1. Create `hackathon-announcement.service.ts`
2. Implement `createAnnouncement(hackathonId, adminId, content, isPinned)`
3. Implement `getAnnouncements(hackathonId)` — pinned first, then newest

### Phase D: WebSocket Gateway

1. Create `hackathons.gateway.ts` — `/hackathons` namespace, JWT auth
2. Implement `handleConnection` — JWT verification, userId mapping (same pattern as `duels.gateway.ts`)
3. Implement `join_hackathon` — join `hackathon:{id}` room
4. Implement `join_team` — verify membership, join `team:{teamId}` room
5. Implement `team_message` — validate and persist via chat service, emit to team room
6. Implement `collab_sync` — Yjs document sync relay to team room
7. Implement `collab_awareness` — cursor awareness relay to team room
8. Implement admin room — `admin:{hackathonId}` for monitoring feed
9. Integrate scoreboard emission — on verdict, emit `scoreboard:update` to hackathon room
10. Integrate announcement emission — on create, emit `announcement:new`
11. Integrate clarification emission — on answer, emit to team or broadcast
12. Integrate lifecycle emission — on status change, emit `hackathon:status_change`

### Phase E: Admin Backend

**E1 — Monitoring (US-A3)**
1. Create `hackathon-monitoring.service.ts`
2. Implement `getMonitoringData(hackathonId)` — aggregate stats, recent submissions, team activity
3. Emit real-time monitoring events to admin room

**E2 — Rejudge (US-A6)**
1. Implement `rejudgeProblem(hackathonId, challengeId)` — re-queue all submissions
2. Implement `rejudgeTeam(hackathonId, teamId)` — re-queue team's submissions
3. Track rejudge progress, update scoreboard atomically on completion

**E3 — Export (US-A11)**
1. Implement `exportResults(hackathonId, format)` — generate CSV/JSON
2. Include: rankings, team details, per-problem times, penalties

**E4 — Anti-Plagiarism (US-A9)**
1. Implement AST-based code comparison (JavaScript/Python/C++ parsers)
2. Implement `triggerPlagiarismScan(hackathonId, challengeId)` — pairwise comparison
3. Store results with similarity scores
4. Flagged pairs review endpoint

### Phase F: Controller Wiring

1. Wire all service methods to `hackathons.controller.ts` endpoints
2. Add Swagger decorators for all endpoints
3. Add `@Roles('admin')` guards for admin endpoints
4. Add custom guards for team membership validation
5. Register all new services in `hackathons.module.ts`

### Phase G: Frontend — Participant Pages

**G1 — Hackathon Listing Enhancement (US-P1)**
1. Update `Hackathon.tsx` — show lobby/checkin sections, registration button
2. Create `HackathonLobby.tsx` — team creation form, join team by code, team roster, check-in button

**G2 — Competition Workspace (US-P3, US-P4, US-P5)**
1. Create `HackathonWorkspace.tsx` — main competition layout: sidebar (problems) + editor + bottom panel (tests/submissions)
2. Create `ProblemSidebar.tsx` — problem list with A-F labels, difficulty, status icons
3. Create `CollabEditor.tsx` — Monaco Editor + Yjs integration (useCollabEditor hook)
4. Create `TeamChat.tsx` — chat panel with message list + input + code snippet support
5. Create `ClarificationPanel.tsx` — request form + list of responses
6. Create `AnnouncementBanner.tsx` — toast/banner for new announcements
7. Create `HackathonTimer.tsx` — countdown with freeze/active phase indicators

**G3 — Scoreboard Enhancement (US-P6)**
1. Create `useHackathonSocket.ts` — Socket.IO hook for `/hackathons` namespace
2. Create `useScoreboard.ts` — real-time scoreboard state management
3. Create `ScoreboardTable.tsx` — reusable ICPC scoreboard component
4. Update `HackathonScoreboard.tsx` — wire WebSocket for real-time updates
5. Create `ScoreboardReveal.tsx` — unfreeze reveal animation (bottom-up)

**G4 — Results Page (US-P10)**
1. Create `HackathonResults.tsx` — final rankings, team stats, per-problem analysis

### Phase H: Frontend — Admin Pages

**H1 — Creation Wizard (US-A1)**
1. Create `AdminHackathonCreate.tsx` — 7-step wizard container with navigation
2. Create wizard steps: `WizardStep1General` through `WizardStep7Review`
3. Step 3 (Problems): challenge picker with search/filter from existing challenges

**H2 — Admin Dashboard (US-A2, US-A3)**
1. Create `AdminHackathonDetail.tsx` — lifecycle controls, status badge, quick actions
2. Update `AdminHackathons.tsx` — lifecycle action buttons (Start, Freeze, End)
3. Create `AdminHackathonMonitoring.tsx` — real-time submission feed, team grid, stats

**H3 — Admin Communication (US-A4, US-A5)**
1. Add announcement creation form to `AdminHackathonDetail.tsx`
2. Create `AdminHackathonClarifications.tsx` — clarification queue with answer form

**H4 — Admin Team & Audit (US-A7, US-A8)**
1. Add team management panel to `AdminHackathonDetail.tsx` — disqualify, reinstate
2. Add audit log viewer to `AdminHackathonDetail.tsx`

### Phase I: Frontend — Services & Hooks

1. Extend `hackathonsService.ts` with all new API methods (~30 methods)
2. Create `useHackathonSocket.ts` — connection management, event listeners
3. Create `useCollabEditor.ts` — Yjs document creation, Monaco binding, awareness
4. Create `useScoreboard.ts` — scoreboard state + WebSocket updates

### Phase J: Routing & Integration

1. Update `routes.tsx` — add new routes:
   - `/hackathon/:id/lobby` → `HackathonLobby`
   - `/hackathon/:id/workspace` → `HackathonWorkspace`
   - `/hackathon/:id/scoreboard` → `HackathonScoreboard` (existing, enhanced)
   - `/hackathon/:id/results` → `HackathonResults`
   - `/admin/hackathons/create` → `AdminHackathonCreate`
   - `/admin/hackathons/:id` → `AdminHackathonDetail`
   - `/admin/hackathons/:id/monitoring` → `AdminHackathonMonitoring`
   - `/admin/hackathons/:id/clarifications` → `AdminHackathonClarifications`
2. Install Yjs dependencies: `yjs`, `y-monaco`, `lib0`
3. Wire navigation between hackathon pages based on status

### Phase K: Polish & Testing

1. Add unit tests for ICPC scoring logic
2. Add unit tests for lifecycle state machine validation
3. Create feature documentation at `docs/features/hackathon-system.md`
4. Add keyboard shortcuts for workspace (Ctrl+Enter to submit, Ctrl+R to run)
5. Add loading states, error boundaries, empty states for all pages

---

## Verification Plan

### Backend API Testing (curl/Swagger)

1. **Start backend**: `cd backend && pnpm run start:dev`
2. **Prisma generate**: `cd backend && npx prisma generate` (verify no schema errors)
3. **Swagger UI**: Open `http://localhost:4000/api/docs` and verify all new endpoints
4. **Test lifecycle flow**:
   - POST `/api/hackathons` → create draft
   - PATCH `/api/hackathons/:id/status` with `lobby` → open registration
   - POST `/api/hackathons/:id/teams` → create team
   - POST `/api/hackathons/:id/teams/join` → join team
   - PATCH status to `checkin` → start check-in
   - POST `/api/hackathons/:id/teams/:teamId/checkin` → check in
   - PATCH status to `active` → start competition
   - POST `/api/hackathons/:id/submit` → submit code → wait for verdict
   - GET `/api/hackathons/:id/scoreboard` → verify ICPC scoring
   - PATCH status to `frozen` → verify scoreboard freezes
   - PATCH status to `ended` → competition ends
5. **Test real-time**: Connect WebSocket to `/hackathons`, join rooms, verify events

### Frontend Browser Testing

1. **Start frontend**: `cd frontend && pnpm run dev`
2. **Participant flow**:
   - Navigate to `/hackathon` → see hackathon list
   - Click register on a lobby hackathon → create team
   - Share join code → second user joins
   - Check-in during checkin phase
   - Open workspace during active phase → solve problems
   - Verify collaborative editing with 2 browser tabs
   - Verify team chat works
   - View scoreboard updating in real-time
   - Submit clarification → get response
3. **Admin flow**:
   - Navigate to `/admin/hackathons` → create via wizard
   - Transition through lifecycle states
   - View monitoring dashboard during competition
   - Broadcast announcement → verify participants see it
   - Answer clarification → verify team sees it
   - Freeze → verify participant scoreboard stops
   - End & Reveal → verify animation

### Manual User Testing

> Complete end-to-end test with 2 users + 1 admin:
> 1. Admin creates hackathon via wizard
> 2. Admin opens registration (draft → lobby)
> 3. User A creates team "Alpha", shares join code
> 4. User B joins team "Alpha" via code
> 5. Admin starts check-in → Captain (User A) checks in
> 6. Admin starts competition → workspace opens
> 7. Users A and B collaboratively solve Problem A
> 8. Team submits → scoreboard updates
> 9. Admin broadcasts announcement → users see it
> 10. User A asks clarification → admin responds → user sees answer
> 11. Admin freezes scoreboard → users see FROZEN
> 12. Users still submit during freeze
> 13. Admin ends and reveals → animated scoreboard unfreeze
> 14. Users view final results page

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase A (Schema) → Phase B (Core Backend) → Phase C (Communication)
                                          → Phase D (WebSocket Gateway)
                                          → Phase E (Admin Backend)
                                          → Phase F (Controller Wiring)

Phase F → Phase G (Frontend Participant)
        → Phase H (Frontend Admin)
        → Phase I (Frontend Services)
        → Phase J (Routing)

All → Phase K (Polish)
```

### Parallel Opportunities

```
After Phase A:
├── B1 Lifecycle (independent)
├── B2 Team Management (independent)
├── B3 Submission Pipeline (independent)
└── B4 Scoreboard (depends on B3 verdict processing)

After Phase B:
├── C1 Chat (independent)
├── C2 Clarifications (independent)
├── C3 Announcements (independent)
├── D WebSocket Gateway (depends on B3, C1, C2, C3)
├── E1 Monitoring (depends on B3)
├── E2 Rejudge (depends on B3)
└── E3 Export (depends on B4)

Frontend phases G, H, I, J can run in parallel after Phase F
```

### Implementation Strategy: MVP First

**MVP (Minimum Viable Hackathon)**:
1. Phase A: Schema
2. B1: Lifecycle + B2: Teams + B3: Submissions + B4: Scoreboard
3. Phase D: Gateway (scoreboard events only)
4. Phase F: Controller wiring (core endpoints)
5. G1: Listing + G2: Workspace (editor only, no collab) + G3: Scoreboard
6. H1: Creation wizard + H2: Admin dashboard

**Post-MVP Enhancements** (can ship incrementally):
- Co-editing (Yjs integration)
- Team chat
- Clarifications + Announcements
- Monitoring dashboard
- Freeze/reveal animation
- Export + Anti-plagiarism
- Audit log

---

## Notes

- Total estimated scope: ~120 tasks across 11 phases
- MVP deliverable: ~60 tasks (Phases A, B, D-partial, F, G-partial, H-partial)
- Post-MVP: ~60 tasks (collab editing, chat, clarifications, monitoring, polish)
- Commit after each logical group of tasks
- Stop at each phase checkpoint to validate independently
