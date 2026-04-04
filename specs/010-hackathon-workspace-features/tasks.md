# Tasks: Hackathon Workspace — Sequential Problems, Anti-Cheat, Chat & Difficulty Timers

**Input**: Design documents from `/specs/010-hackathon-workspace-features/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not explicitly requested in the feature specification. Test tasks are excluded.

**Organization**: Tasks are grouped by user story (WS1–WS5) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1=WS1, US2=WS2, US3=WS3, US4=WS4, US5=WS5)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/prisma/`
- **Frontend**: `frontend/src/`
- **Specs**: `specs/010-hackathon-workspace-features/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prisma schema changes and shared service setup required by all stories

- [x] T001 Add `anticheatViolations Int @default(0)` field to HackathonTeam model in `backend/prisma/schema.prisma`
- [x] T002 Add `problemStartTimes Json?` field to HackathonTeam model in `backend/prisma/schema.prisma`
- [x] T003 Run `npx prisma generate` and `npx prisma db push` to apply schema changes in `backend/`
- [x] T004 [P] Inject `PrismaService` into `HackathonsGateway` constructor in `backend/src/hackathons/hackathons.gateway.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend endpoint and service method that all workspace user stories depend on

**⚠️ CRITICAL**: User story phases cannot start until this is complete

- [x] T005 Implement `getHackathonChallenges(hackathonId, teamId?)` method with sequential unlock logic and `TIME_LIMITS` map in `backend/src/hackathons/hackathons.service.ts`
- [x] T006 Add `GET /hackathons/:id/challenges` endpoint with `@Query('teamId')` parameter in `backend/src/hackathons/hackathons.controller.ts`
- [x] T007 Add `getHackathonChallenges(hackathonId, teamId)` API method in `frontend/src/services/hackathonsService.ts`

**Checkpoint**: `GET /api/hackathons/:id/challenges?teamId=X` returns ordered challenges with `locked`, `solved`, `timeLimitMinutes`, `startedAt` fields.

---

## Phase 3: User Story 1 — Problem Statement Display (Priority: P0) 🎯 MVP

**Goal**: Each unlocked problem displays its full statement: title, difficulty, Markdown description, constraints, examples, sample tests, and collapsible hints in a 3-panel workspace layout.

**Independent Test**: Open workspace → Problem A shows title, difficulty badge, description, examples (2-column Input|Output), sample test cases, constraints panel, and collapsible hints. Locked problems show only label + difficulty.

### Implementation for User Story 1

- [x] T008 [US1] Create `AntiCheatWarning` component stub (returns null) and `ProblemTimer` component stub (returns placeholder) at top of `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T009 [US1] Create `HackathonWorkspace` component with core state: `hackathon`, `loading`, `problems`, `currentProblemIndex`, `code`, `language` in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T010 [US1] Implement `useEffect` to load hackathon data via `hackathonsService.getById(id)` with status-based redirection in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T011 [US1] Implement `loadChallenges` callback that calls `hackathonsService.getHackathonChallenges(id, myTeam.id)` and sets `problems` state in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T012 [US1] Build the 3-panel layout: LEFT (w-56 problem sidebar with progress bar), CENTER (flex-1 statement + editor), RIGHT (w-72 chat placeholder) in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T013 [US1] Implement the LEFT panel: problem list with label, difficulty badge, time limit, Lock/CheckCircle icons, solved progress bar in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T014 [US1] Implement the CENTER panel top 45%: problem statement with title, difficulty badge, tags, `descriptionMd` (whitespace-preserved), constraints panel in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T015 [US1] Implement examples section: 2-column grid (Input | Output) with optional explanation below each example in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T016 [US1] Implement sample test cases section with Input and Expected Output display in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T017 [US1] Implement collapsible hints section with `<details>` / `<summary>` showing hint count in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T018 [US1] Implement locked problem view: center panel shows Lock icon + "Solve the previous problem first to unlock this one" message in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T019 [US1] Implement language selector dropdown and code textarea editor in CENTER panel below statement in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T020 [US1] Implement Run and Submit buttons with `handleRun()` and `handleSubmit()` calling `hackathonsService.runCode()` and `hackathonsService.submitCode()` in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T021 [US1] Implement bottom panel: run results display + submissions list with verdict badges in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T022 [US1] Add route `/hackathon/:id/workspace` pointing to `HackathonWorkspace` in `frontend/src/routes.tsx`

**Checkpoint**: Workspace renders with full problem statements. Submitting code works. Locked problems show restricted view.

---

## Phase 4: User Story 2 — Sequential Problem Unlock (Priority: P0)

**Goal**: Team must solve Problem A (AC verdict) before Problem B unlocks. Backend enforces sequential order on both read (API) and write (submit).

**Independent Test**: Team has no AC → only Problem A unlocked → submit AC → challenges reload → Problem B unlocks → Problem A shows ✓ Solved.

### Implementation for User Story 2

- [x] T023 [US2] Add Q7 guard in `submitCode()`: check for existing AC verdict on `challengeId` and throw `BadRequestException('This problem is already solved')` in `backend/src/hackathons/hackathon-submission.service.ts`
- [x] T024 [US2] Add Q1 guard in `submitCode()`: validate `challengeIds` ordering — check all preceding challenges have AC verdicts before accepting in `backend/src/hackathons/hackathon-submission.service.ts`
- [x] T025 [US2] Add challenge-not-in-hackathon guard: validate `dto.challengeId` is in `hackathon.challengeIds` in `backend/src/hackathons/hackathon-submission.service.ts`
- [x] T026 [US2] Connect `onSubmissionVerdict` WebSocket event to reload challenges after AC via `setTimeout(() => loadChallenges(), 500)` in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T027 [US2] Make solved problems read-only: show "Solved — Read Only" banner, set textarea `readOnly`, disable Run/Submit buttons when `currentProblem.solved` in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T028 [US2] Block `handleSubmit()` and `handleRun()` early return when `currentProblem.solved` in `frontend/src/pages/HackathonWorkspace.tsx`

**Checkpoint**: Submitting to a locked or already-solved problem returns 400. AC verdict triggers automatic challenge list reload. Solved problems are read-only.

---

## Phase 5: User Story 3 — Difficulty-Based Problem Timer (Priority: P1)

**Goal**: Each problem shows a countdown timer based on difficulty (easy=15min, medium=25min, hard=40min). Timer is team-wide (synchronized via backend). Timer is informational — submission allowed after expiry.

**Independent Test**: Open easy problem → timer shows 15:00 → counts down → yellow pulse at <2min → "TIME UP" at 0:00 → submit still works. Same timer value for all team members.

### Implementation for User Story 3

- [x] T029 [US3] Implement team-wide timer auto-start in `getHackathonChallenges()`: read `team.problemStartTimes`, auto-set `startedAt` for current unlocked problem if not already set, persist to DB in `backend/src/hackathons/hackathons.service.ts`
- [x] T030 [US3] Return `startedAt` field per challenge in `getHackathonChallenges()` response from `team.problemStartTimes[challengeId]` in `backend/src/hackathons/hackathons.service.ts`
- [x] T031 [US3] Implement `ProblemTimer` component: accepts `startedAt` (timestamp) and `timeLimitMinutes`, displays countdown, yellow pulse at <2min, "TIME UP" in red at 0 in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T032 [US3] Wire `ProblemTimer` in top bar using `currentProblem.startedAt` and `currentProblem.timeLimitMinutes` — hide for solved/locked problems in `frontend/src/pages/HackathonWorkspace.tsx`

**Checkpoint**: Timer shows correct duration per difficulty, synced across team members, counts down in real-time, does not block submissions.

---

## Phase 6: User Story 4 — Anti-Cheat System (Priority: P0)

**Goal**: 6 anti-cheat measures detect and report violations. Violations are persisted server-side. Admins receive real-time alerts. 500ms debounce prevents blur/tab_switch double-firing. Chat panel excluded from clipboard restrictions.

**Independent Test**: Switch tabs → warning overlay with count → return → try Ctrl+V in editor → blocked + count increments → Ctrl+V in chat → allowed → admin sees alerts. Page refresh → violation count persists.

### Implementation for User Story 4

- [x] T033 [P] [US4] Implement `AntiCheatWarning` overlay component: full-screen red overlay with AlertTriangle icon, violation count, dismiss button in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T034 [US4] Add anti-cheat state: `violations`, `showWarning`, `violationsRef`, `lastViolationTimeRef` (for 500ms debounce) in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T035 [US4] Implement `reportViolation(eventType)` function with 500ms debounce for `blur`/`tab_switch`, increment count, show warning, emit `anticheat_event` via WebSocket in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T036 [US4] Add 6 event listeners in `useEffect`: `visibilitychange` (tab_switch), `blur`, `copy` (blocked outside `.chat-panel`), `paste` (blocked outside `.chat-panel`), `contextmenu` (blocked), `keydown` (F12/Ctrl+Shift+I/J/C/Ctrl+U blocked) in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T037 [US4] Implement `handleAnticheatEvent()` in gateway: increment `anticheatViolations` atomically via `prisma.hackathonTeam.update({ data: { anticheatViolations: { increment: 1 } } })` in `backend/src/hackathons/hackathons.gateway.ts`
- [x] T038 [US4] Emit `admin:anticheat_alert` to admin room and `anticheat:violation_count` back to reporter client in `backend/src/hackathons/hackathons.gateway.ts`
- [x] T039 [US4] Listen for `anticheat:violation_count` server event to sync `violationsRef` from persisted count in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T040 [US4] Initialize violation count from `myTeam.anticheatViolations` on hackathon data load in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T041 [US4] Add anti-cheat indicator in top bar: Shield icon with green "Anti-Cheat" label + red violation badge when count > 0 in `frontend/src/pages/HackathonWorkspace.tsx`

**Checkpoint**: All 6 anti-cheat measures active. Violations persist across page refresh. Admin room receives alerts. Debounce prevents double-counting. Chat panel allows clipboard.

---

## Phase 7: User Story 5 — Working Team Chat (Priority: P0)

**Goal**: Real-time WebSocket chat between team members. REST for history. Messages enriched with sender username. Bubble-style UI with auto-scroll.

**Independent Test**: Member A sends "try BFS" → Member B sees it instantly with username "mahdi_dev" → B replies → both see full conversation with correct alignment (own=right, other=left).

### Implementation for User Story 5

- [x] T042 [P] [US5] Implement Q4 username enrichment in `sendMessage()`: fetch `user.username` after create, return `{ ...message, username }` in `backend/src/hackathons/hackathon-chat.service.ts`
- [x] T043 [P] [US5] Implement Q4 username enrichment in `getMessages()`: batch-fetch unique userIds, build usernameMap, enrich all messages in `backend/src/hackathons/hackathon-chat.service.ts`
- [x] T044 [US5] Add chat state: `chatMessages`, `chatInput`, `activePanel`, `chatEndRef` in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T045 [US5] Implement `useEffect` to load initial chat history via `hackathonsService.getTeamMessages(id, myTeam.id)` (newest first → reversed for display) in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T046 [US5] Connect `onTeamMessage` WebSocket event to append new messages and auto-scroll via `chatEndRef` in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T047 [US5] Implement `handleSendMessage()`: emit `team_message` via `socket.sendTeamMessage()`, clear input in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T048 [US5] Build RIGHT panel chat UI: tabs (Chat | Q&A), bubble-style messages (own=right brand-primary, other=left surface-2), sender `msg.username` display, timestamp, code snippet `<pre>` block in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T049 [US5] Build chat input bar: text input + Send button, Enter key to send in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T050 [US5] Add empty state UI: "No messages yet. Start chatting with your team!" with MessageSquare icon in `frontend/src/pages/HackathonWorkspace.tsx`

**Checkpoint**: Chat messages flow in real-time via WebSocket. Sender username shown. History loads on mount. Auto-scroll on new messages.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T051 [P] Add keyboard shortcuts via `useKeyboardShortcuts`: Ctrl+Enter=submit, Ctrl+R=run, Ctrl+/=toggle chat in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T052 [P] Add rate limit cooldown timer UI: disabled Submit button with countdown "Wait Ns" when rate limited in `frontend/src/pages/HackathonWorkspace.tsx`
- [x] T053 [P] Add `WorkspaceSkeleton` loading state component for initial workspace load in `frontend/src/components/HackathonSkeletons.tsx`
- [x] T054 Update spec.md Decisions section with all 8 decisions (Q1–Q7 + timer informational) in `specs/010-hackathon-workspace-features/spec.md`
- [x] T055 Run quickstart.md validation: verify all endpoints work, WebSocket events flow, anti-cheat triggers in `specs/010-hackathon-workspace-features/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────────────────────────┐
                                                      │
Phase 2: Foundational (T005–T007) ───────────────────┤ BLOCKS all user stories
                                                      │
    ┌─────────────────────────────────────────────────┘
    │
    ├── Phase 3: US1 — Problem Statement (P0) 🎯 MVP
    │      ↓ (provides the workspace shell)
    ├── Phase 4: US2 — Sequential Unlock (P0)
    │      (uses workspace from US1)
    ├── Phase 5: US3 — Problem Timer (P1)
    │      (uses workspace from US1, startedAt from Foundational)
    ├── Phase 6: US4 — Anti-Cheat (P0)
    │      (uses workspace from US1, independent of US2/US3/US5)
    └── Phase 7: US5 — Team Chat (P0)
           (uses workspace from US1, independent of US2/US3/US4)
    
Phase 8: Polish ── depends on all desired stories complete
```

### User Story Dependencies

- **US1 (Problem Statement)**: Depends on Foundational (Phase 2) only. **Must be first** — provides the workspace shell.
- **US2 (Sequential Unlock)**: Depends on US1 (needs workspace layout + submit handler)
- **US3 (Problem Timer)**: Depends on US1 (needs workspace top bar) + Foundational (`startedAt` field)
- **US4 (Anti-Cheat)**: Depends on US1 (needs workspace mount point). Can parallel with US2, US3, US5.
- **US5 (Team Chat)**: Depends on US1 (needs RIGHT panel). Can parallel with US2, US3, US4.

### Within Each User Story

- Backend tasks before frontend tasks (when both exist)
- Service methods before controller endpoints
- Core implementation before integration
- Story complete before checkpoint

### Parallel Opportunities

- T001 + T002 can run in parallel (different fields in same file)
- T004 can run in parallel with T001/T002 (different file)
- T033 (AntiCheatWarning component) can run in parallel with other US4 tasks
- T042 + T043 (chat enrichment) can run in parallel (different methods in same file)
- After US1 complete: US2, US3, US4, US5 can all be worked in parallel by different developers
- T051 + T052 + T053 (polish) can all run in parallel

---

## Parallel Example: User Story 4 (Anti-Cheat)

```bash
# Backend tasks (can parallel with frontend setup):
Task T037: "Implement handleAnticheatEvent persistence in hackathons.gateway.ts"
Task T038: "Emit admin:anticheat_alert and anticheat:violation_count in hackathons.gateway.ts"

# Frontend tasks (after backend ready):
Task T033: "AntiCheatWarning overlay component"     # [P] - independent component
Task T034: "Anti-cheat state setup"                  # sequential
Task T035: "reportViolation with debounce"           # depends on T034
Task T036: "6 event listeners"                       # depends on T035
Task T039: "Listen for server violation count"       # depends on T038
Task T040: "Initialize count from team data"         # independent of T039
Task T041: "Top bar anti-cheat indicator"            # depends on T034
```

---

## Parallel Example: User Story 5 (Chat)

```bash
# Backend tasks (can run in parallel — different methods):
Task T042: "sendMessage() username enrichment"       # [P]
Task T043: "getMessages() username enrichment"       # [P]

# Frontend tasks (sequential within story):
Task T044: "Chat state setup"
Task T045: "Load initial chat history"               # depends on T043, T044
Task T046: "WebSocket onTeamMessage listener"        # depends on T044
Task T047: "handleSendMessage()"                     # depends on T042, T044
Task T048: "Chat bubble UI"                          # depends on T044
Task T049: "Chat input bar"                          # depends on T047
Task T050: "Empty state UI"                          # [P] depends on T044
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004) — ~15 min
2. Complete Phase 2: Foundational (T005–T007) — ~30 min
3. Complete Phase 3: US1 Problem Statement (T008–T022) — ~2 hours
4. **STOP and VALIDATE**: Workspace renders with full problem statements, submit works
5. Deploy/demo if ready — participants can already use the workspace

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Problem Statement) → **MVP!** Workspace is usable
3. US2 (Sequential Unlock) → Problems appear 1 by 1 as user requested
4. US4 (Anti-Cheat) → Competition integrity enforced
5. US5 (Team Chat) → Team collaboration enabled
6. US3 (Problem Timer) → Time guidance per difficulty
7. Polish → Keyboard shortcuts, loading states, documentation

### Parallel Team Strategy

With 2 developers after US1 is complete:

1. Both complete Setup + Foundational + US1 together
2. Once US1 is done:
   - **Developer A**: US2 (Sequential Unlock) → US3 (Timer)
   - **Developer B**: US4 (Anti-Cheat) → US5 (Chat)
3. Both: Phase 8 Polish

---

## Notes

- All tasks in `frontend/src/pages/HackathonWorkspace.tsx` modify the same file — they MUST be executed sequentially within each story
- Backend tasks across different files (gateway.ts vs submission.service.ts vs chat.service.ts) CAN run in parallel
- The `schema.prisma` changes (T001, T002) must be followed by `prisma generate` (T003) before any backend task that uses the new fields
- All 5 user stories share the `HackathonWorkspace.tsx` component — coordination needed if parallel
