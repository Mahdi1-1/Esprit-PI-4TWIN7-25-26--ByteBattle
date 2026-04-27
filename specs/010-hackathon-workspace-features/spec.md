# Feature Specification: Hackathon Workspace — Sequential Problems, Anti-Cheat, Chat & Difficulty Timers

**Feature Branch**: `007-judge-worker-architecture`  
**Created**: 2026-03-30  
**Status**: Implemented  
**Input**: User description: "Je veut l'énoncé de chaque problème et les problèmes vient 1 par 1, appliqué l'anticheat, le chat doit être travailler, la durée des problèmes sera selon le niveau de problème."

## Clarifications

### Session 2026-03-30

- Q: "Les problèmes vient 1 par 1" — does this mean sequential unlock (solve A → unlock B → unlock C)? → A: Yes — a team must solve the current problem before the next one becomes visible. Only solved problems and the current unsolved problem are accessible; all subsequent problems remain locked.
- Q: Should locked problems show any info (title, difficulty)? → A: Locked problems show only the label (A, B, C…) and difficulty badge. Title, description, tests, hints are all hidden until unlocked.
- Q: "La durée des problèmes sera selon le niveau" — how should time limits per difficulty work? → A: Each problem has a recommended time limit based on difficulty: easy = 15 min, medium = 25 min, hard = 40 min. A countdown timer shows remaining time for the current problem. The timer is informational — submission is still allowed after expiry (the overall hackathon endTime is the hard deadline).
- Q: What anti-cheat measures should be applied? → A: Six measures: (1) Tab visibility change detection, (2) Window blur (alt-tab) detection, (3) Copy blocking outside chat, (4) Paste blocking outside chat, (5) Right-click context menu blocking outside chat, (6) Dev tools shortcut blocking (F12, Ctrl+Shift+I/J/C, Ctrl+U). All violations are counted, shown to the user via a warning overlay, and reported to the backend via WebSocket for admin real-time alerts.
- Q: Should anti-cheat block actions or just warn? → A: Both — clipboard operations (copy/paste) are prevented (`e.preventDefault()`), and all violations trigger a full-screen warning overlay + backend notification.
- Q: Should the chat be HTTP-based or WebSocket-based? → A: Hybrid — initial message history loads via REST `GET /hackathons/:id/teams/:teamId/messages`, then real-time messages flow through WebSocket `team_message` event → `team:message` broadcast to all team members.
- Q: Can team members copy/paste within the chat panel? → A: Yes — anti-cheat clipboard blocking explicitly excludes the `.chat-panel` region to allow normal chat interaction.
- Q: Should the problem statement support Markdown formatting? → A: Yes — the `descriptionMd` field from the Challenge model is rendered as preformatted text with whitespace preserved. Examples, constraints, hints, and sample test cases are all displayed in structured panels.
- Q: What happens when a submission is accepted (AC)? → A: The challenges list is reloaded from the backend (via `getHackathonChallenges`) to unlock the next problem. The verdict triggers a 500ms debounced reload.

### Session 2 — Refinements

- Q1: Should the backend enforce sequential order on submit? → A: **YES** — the backend MUST validate that a team has solved all preceding problems before accepting a submission. `hackathon-submission.service.ts` checks the hackathon's `challengeIds` order and verifies all preceding challenges have an AC verdict.
- Q2: Anti-cheat blur + tab_switch fire simultaneously on tab switch — should we deduplicate? → A: **YES** — a 500ms debounce window is applied: if a `blur` or `tab_switch` event fires within 500ms of the previous one, it is ignored. This prevents double-counting.
- Q3: Should anti-cheat violations be persisted server-side? → A: **YES** — the `HackathonTeam` model now has an `anticheatViolations Int @default(0)` field. Each violation increments it atomically. The frontend initializes its violation counter from the persisted value on mount.
- Q4: Should chat messages include the sender's display name? → A: **YES** — the backend enriches messages with the sender's `username` field from the User model. Both `sendMessage()` and `getMessages()` in `HackathonChatService` now include the `username` field. The frontend displays `msg.username` instead of a generic "Teammate" label.
- Q5: Should the problem timer be per-individual or team-wide? → A: **Team-wide** — the backend stores `problemStartTimes` (JSON) on the `HackathonTeam` model. When `getHackathonChallenges()` is called and the current problem has no start time, the backend auto-sets it. All team members see the same timer value (`startedAt` field in the response).
- Q6: Should there be auto-disqualification after N violations? → A: **NO** — there is no automatic disqualification threshold. Admins receive real-time alerts and can manually disqualify teams at their discretion. The warning text says "may result in disqualification" as a deterrent.
- Q7: Can teams re-submit to already solved problems? → A: **NO** — solved problems are READ-ONLY. The backend rejects submissions to challenges where the team already has an AC verdict. The frontend marks solved problems with a "Solved — Read Only" banner, disables the editor, and hides the Submit/Run buttons (they remain disabled).

## RBAC Model

| Role | Scope | Capabilities |
|------|-------|-------------|
| Admin | Global | Receives anti-cheat alerts via `admin:anticheat_alert` WebSocket event; views all problems without lock; can see all challenges via `GET /hackathons/:id/challenges` (no teamId) |
| Captain | Per-team | Same as Participant; team check-in authority |
| Participant | Per-team | Views sequential problems (locked/unlocked); submits/runs code; uses team chat; receives anti-cheat enforcement |

## User Scenarios & Testing

### User Story WS1 — Problem Statement Display (Priority: P0)

During an active hackathon, each unlocked problem displays its full statement: title, difficulty badge, tags, Markdown description, constraints panel, input/output examples, sample test cases, and collapsible hints. The statement occupies the top 45% of the center panel.

**Why this priority**: P0 — Participants cannot solve problems without reading the statement.

**Independent Test**: Participant opens workspace → sees Problem A statement with title, difficulty, description, examples, and sample tests → all content matches the Challenge model's `descriptionMd`, `examples`, `tests`, `hints`, and `constraints`.

**Acceptance Scenarios**:

1. **Given** a hackathon with 4 problems, **When** participant opens the workspace, **Then** Problem A's full statement is displayed in the top portion of the center panel.
2. **Given** Problem A has `descriptionMd = "Given an array of integers..."`, **When** participant views the statement, **Then** the description is rendered with preserved whitespace and line breaks.
3. **Given** Problem A has 2 examples with input/output/explanation, **When** participant views the statement, **Then** both examples are shown in a 2-column grid (Input | Output) with explanation below.
4. **Given** Problem A has 3 non-hidden test cases, **When** participant views the statement, **Then** the "Sample Test Cases" section shows 3 test cases with Input and Expected Output.
5. **Given** Problem A has 2 hints, **When** participant clicks "💡 Hints (2)", **Then** both hints are revealed in collapsible section.
6. **Given** Problem A has constraints `{time: "2s", memory: "256MB"}`, **When** participant views the statement, **Then** constraints are shown in a separate panel.

---

### User Story WS2 — Sequential Problem Unlock (Priority: P0)

Problems are presented one at a time. The team must solve Problem A (get AC verdict) before Problem B becomes available. Solved problems remain accessible for review. Locked problems show only the label (A, B, C…), difficulty, and time limit — no title, description, or tests.

**Why this priority**: P0 — Core requirement from the user: "les problèmes vient 1 par 1".

**Independent Test**: Team sees only Problem A unlocked → solves it → Problem B unlocks → Problem A stays accessible as "Solved" → Problems C-E remain locked.

**Acceptance Scenarios**:

1. **Given** a hackathon with 5 problems (A-E) and a team with no AC submissions, **When** the workspace loads, **Then** Problem A is unlocked and active; B, C, D, E show Lock icon with "Problem B — Locked" etc.
2. **Given** Problem A is unsolved, **When** participant clicks on Problem C (locked), **Then** the click is ignored (button is disabled) and the center panel shows "Solve the previous problem first to unlock this one."
3. **Given** the team submits AC for Problem A, **When** the verdict WebSocket event arrives, **Then** the challenges list reloads within 500ms, Problem A shows ✓ (Solved), and Problem B becomes unlocked.
4. **Given** Problem A is solved and Problem B is the current challenge, **When** participant clicks Problem A, **Then** they can view its statement and past submissions (read-only review).
5. **Given** a locked Problem D, **When** the backend `getHackathonChallenges` returns it, **Then** `descriptionMd = ''`, `title = 'Problem D'`, `tags = []`, `tests = []`, `hints = []`, `locked = true`.
6. **Given** all 5 problems are solved, **When** the workspace loads, **Then** all problems show ✓ and are accessible; the progress bar shows 5/5 (100%).

**Backend API**: `GET /hackathons/:id/challenges?teamId=<teamId>`
- Returns an ordered array with `{ id, order, label, title, difficulty, descriptionMd, tags, constraints, hints, examples, tests, allowedLanguages, category, timeLimitMinutes, locked, solved }`.
- Sequential logic: `firstUnsolvedIndex = first i where team has no AC for challengeIds[i]`. For `i > firstUnsolvedIndex`: content fields are empty, `locked = true`.

---

### User Story WS3 — Difficulty-Based Problem Timer (Priority: P1)

Each problem has a recommended time limit based on its difficulty: easy = 15 minutes, medium = 25 minutes, hard = 40 minutes. A countdown timer in the top bar shows the remaining time for the current problem. When time is low (< 2 min), the timer pulses yellow. When expired, it shows "TIME UP" in red. The timer is informational only — the overall hackathon `endTime` is the hard deadline.

**Why this priority**: P1 — Provides time guidance per problem as requested: "la durée des problèmes sera selon le niveau".

**Independent Test**: Participant opens an easy problem → timer shows 15:00 → counts down → at 01:30 the timer turns yellow and pulses → at 00:00 it shows "TIME UP" in red → participant can still submit.

**Acceptance Scenarios**:

1. **Given** Problem A is `easy`, **When** the workspace loads, **Then** the top bar shows a timer starting at 15:00 with a Timer icon.
2. **Given** Problem B is `medium`, **When** participant switches to Problem B, **Then** the timer resets to 25:00.
3. **Given** Problem C is `hard`, **When** participant switches to Problem C, **Then** the timer starts at 40:00.
4. **Given** 1:30 remaining on the current problem, **When** the timer updates, **Then** it turns yellow with a pulse animation.
5. **Given** the timer reaches 00:00, **When** it expires, **Then** it shows "TIME UP" in red but the Submit button remains enabled.
6. **Given** a solved problem, **When** participant navigates to it, **Then** no timer is shown for that problem (it's already solved).

**Time Limits Map**:
```
easy    → 15 min
medium  → 25 min
hard    → 40 min
default → 25 min (fallback)
```

---

### User Story WS4 — Anti-Cheat System (Priority: P0)

The workspace enforces 6 anti-cheat measures. All violations increment a visible counter, trigger a full-screen warning overlay, and are reported to the backend via WebSocket `anticheat_event`. Admins receive real-time alerts via `admin:anticheat_alert`. The chat panel is excluded from clipboard restrictions.

**Why this priority**: P0 — Explicitly requested: "appliqué l'anticheat".

**Independent Test**: Participant switches tabs → sees red warning overlay with violation count → returns to workspace → tries to paste code → action is blocked and count increments → admin sees alert in dashboard.

**Acceptance Scenarios**:

1. **Given** participant is in the workspace, **When** they switch to another browser tab, **Then** a `tab_switch` violation is recorded, the counter increments, and a full-screen red warning overlay appears.
2. **Given** participant is in the workspace, **When** they alt-tab to another application, **Then** a `blur` violation is recorded with the same overlay behavior.
3. **Given** participant selects code in the editor, **When** they press Ctrl+C, **Then** the copy is prevented, a `copy_attempt` violation is recorded, and the warning overlay appears.
4. **Given** participant focuses the code editor, **When** they press Ctrl+V, **Then** the paste is prevented, a `paste_attempt` violation is recorded, and the warning overlay appears.
5. **Given** participant is in the chat panel, **When** they copy/paste text, **Then** the action is ALLOWED (no violation — `.chat-panel` is excluded).
6. **Given** participant presses F12 or Ctrl+Shift+I, **When** the keydown fires, **Then** the shortcut is prevented and a `devtools_attempt` violation is recorded.
7. **Given** participant right-clicks in the code area, **When** the context menu event fires, **Then** it is prevented (no violation counted, just blocked).
8. **Given** 3 violations have occurred, **When** the warning overlay is displayed, **Then** it shows "Violation count: 3" and "Multiple violations may result in disqualification."
9. **Given** a violation occurs, **When** the WebSocket emits `anticheat_event`, **Then** the backend logs `🚨 ANTICHEAT [eventType] User=X Team=Y Hackathon=Z` and emits `admin:anticheat_alert` to the admin room.

**Anti-Cheat Events**:
| Event Type | Trigger | Blocked? |
|---|---|---|
| `tab_switch` | `document.visibilitychange` → `document.hidden` | No (just logged) |
| `blur` | `window.blur` | No (just logged) |
| `copy_attempt` | `document.copy` outside `.chat-panel` | Yes (`e.preventDefault()`) |
| `paste_attempt` | `document.paste` outside `.chat-panel` | Yes (`e.preventDefault()`) |
| `devtools_attempt` | F12, Ctrl+Shift+I/J/C, Ctrl+U | Yes (`e.preventDefault()`) |
| context menu | Right-click outside `.chat-panel` | Yes (blocked, no violation count) |

---

### User Story WS5 — Working Team Chat (Priority: P0)

Team members communicate via real-time WebSocket-based chat. Initial history loads via REST, then new messages arrive in real-time. Messages appear in bubble-style format (sender's messages on the right, others on the left). Each message shows sender name, content, timestamp, and optional code snippet. Auto-scrolls to newest message.

**Why this priority**: P0 — Explicitly requested: "le chat doit être travailler".

**Independent Test**: Member A opens workspace → sends "try BFS" → Member B sees it instantly in the chat panel → Member B replies → both see the full conversation.

**Acceptance Scenarios**:

1. **Given** 2 team members in a hackathon, **When** Member A types "try BFS" and presses Enter, **Then** the message is emitted via WebSocket `team_message` event.
2. **Given** the WebSocket gateway receives `team_message`, **When** it processes the message, **Then** it persists it via `HackathonChatService.sendMessage()` and broadcasts `team:message` to all team members in `team:{teamId}` room.
3. **Given** Member B is connected, **When** `team:message` event arrives, **Then** the message appears in the chat panel within 1 second with sender name, content, and timestamp.
4. **Given** the current user sent a message, **When** it renders, **Then** it appears on the right side with brand-primary background and "You" label.
5. **Given** a teammate sent a message, **When** it renders, **Then** it appears on the left side with surface-2 background and "Teammate" label.
6. **Given** 15 messages in chat, **When** a new message arrives, **Then** the chat auto-scrolls to the bottom.
7. **Given** the workspace loads for the first time, **When** chat initializes, **Then** previous messages are loaded via `GET /hackathons/:id/teams/:teamId/messages` (up to 50, newest first → reversed for display).
8. **Given** a message has `codeSnippet`, **When** it renders, **Then** the code is displayed in a `<pre>` block below the message content.
9. **Given** an empty chat, **When** the panel renders, **Then** it shows an empty state with "No messages yet. Start chatting with your team!".
10. **Given** the user presses Enter in the chat input, **When** the input is not empty, **Then** the message is sent and the input clears.

**Chat Flow**:
```
Frontend: chatInput → socket.sendTeamMessage({hackathonId, teamId, content})
    ↓
Gateway: @SubscribeMessage('team_message') → chatService.sendMessage() → emit('team:message')
    ↓
Frontend: socket.onTeamMessage(cb) → setChatMessages(prev => [...prev, data])
```

---

## Technical Design

### Files Modified

| File | Changes |
|------|---------|
| `backend/prisma/schema.prisma` | Added `anticheatViolations Int` and `problemStartTimes Json?` fields to HackathonTeam |
| `backend/src/hackathons/hackathons.service.ts` | Added team-wide timer management in `getHackathonChallenges()` — auto-starts timer, returns `startedAt` per challenge |
| `backend/src/hackathons/hackathon-submission.service.ts` | Added Q1 sequential enforcement + Q7 solved-problem re-submission blocking in `submitCode()` |
| `backend/src/hackathons/hackathon-chat.service.ts` | Q4: `sendMessage()` and `getMessages()` now enrich messages with sender `username` |
| `backend/src/hackathons/hackathons.gateway.ts` | Q3: `handleAnticheatEvent()` persists violations to DB; injected PrismaService; sends back violation count |
| `backend/src/hackathons/hackathons.controller.ts` | Added `GET /hackathons/:id/challenges?teamId=` endpoint |
| `frontend/src/services/hackathonsService.ts` | Added `getHackathonChallenges()` API method |
| `frontend/src/pages/HackathonWorkspace.tsx` | Q2: debounce blur/tab_switch; Q3: load persisted violations; Q4: display username; Q5: use backend startedAt; Q7: read-only solved problems |

### Backend: `getHackathonChallenges(hackathonId, teamId?)` Logic

```
1. Fetch hackathon → get challengeIds[]
2. Fetch all Challenge docs by ID
3. Reorder to match challengeIds order
4. TIME_LIMITS = { easy: 15, medium: 25, hard: 40 }
5. If no teamId → return all (admin view, locked=false)
6. Fetch team's AC submissions (distinct by challengeId)
7. Build solvedChallengeIds set
8. Find firstUnsolvedIndex (first i not in solvedChallengeIds)
9. Map challenges:
   - i <= firstUnsolvedIndex → full data, locked=false, solved=true/false
   - i > firstUnsolvedIndex → empty content, locked=true, solved=false
```

### Frontend: Anti-Cheat Event Listeners

```
useEffect (mount when id + myTeam.id available):
  - document 'visibilitychange' → if hidden → reportViolation('tab_switch')
  - window 'blur' → reportViolation('blur')
  - document 'copy' → if not .chat-panel → preventDefault + reportViolation('copy_attempt')
  - document 'paste' → if not .chat-panel → preventDefault + reportViolation('paste_attempt')
  - document 'contextmenu' → if not .chat-panel → preventDefault
  - document 'keydown' → if F12/Ctrl+Shift+I/J/C/Ctrl+U → preventDefault + reportViolation('devtools_attempt')

  reportViolation(type):
    violationsRef.current++
    setViolations(count)
    setShowWarning(true)
    socket.emit('anticheat_event', { hackathonId, teamId, eventType, details })
```

### Frontend: Workspace Layout (3-panel)

```
┌─────────────────────────────────────────────────────────────┐
│ TOP BAR: Title │ Status Badge │ Team │ Shield │ Timer │ End │
├────────┬──────────────────────────────────┬─────────────────┤
│ LEFT   │ CENTER                           │ RIGHT           │
│ w-56   │ flex-1                           │ w-72            │
│        │ ┌──────────────────────────────┐ │ ┌─────────────┐ │
│ Prob A │ │ Problem Statement (45%)      │ │ │ [Chat] [Q&A]│ │
│ ✓ easy │ │ title, desc, examples, tests │ │ │             │ │
│        │ ├──────────────────────────────┤ │ │ Messages    │ │
│ Prob B │ │ [Language ▾] [Run] [Submit]  │ │ │ bubble list │ │
│ ● med  │ ├──────────────────────────────┤ │ │             │ │
│        │ │ Code Editor (textarea)       │ │ │             │ │
│ Prob C │ │                              │ │ ├─────────────┤ │
│ 🔒 hard│ ├──────────────────────────────┤ │ │ [input] [▶] │ │
│        │ │ Run Results + Submissions    │ │ │             │ │
│ ──── │ └──────────────────────────────┘ │ └─────────────┘ │
│Progress│                                  │                 │
│ █░░░░  │                                  │                 │
└────────┴──────────────────────────────────┴─────────────────┘
```

### WebSocket Events (New)

| Event | Direction | Payload | Room |
|-------|-----------|---------|------|
| `anticheat_event` | Client → Server | `{ hackathonId, teamId, eventType, details }` | — |
| `admin:anticheat_alert` | Server → Client | `{ userId, teamId, eventType, details, timestamp }` | `admin:{hackathonId}` |

### REST Endpoints (New)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/hackathons/:id/challenges?teamId=` | User | Returns ordered challenge list with sequential lock/unlock state |

## Decisions

1. **Timer is informational**: The per-problem timer does NOT auto-skip or block submissions. The hackathon's global `endTime` is the only hard deadline.
2. **Sequential lock is backend-enforced (both read + write)**: The `getHackathonChallenges()` endpoint strips content from locked problems server-side. Additionally, `submitCode()` validates that all preceding challenges are solved before accepting a submission (Q1).
3. **Anti-cheat is client-side + logged + persisted**: Anti-cheat cannot be 100% tamper-proof in a browser, but all violations are persisted server-side (`anticheatViolations` field on HackathonTeam) and surfaced to admins for manual review/disqualification. No auto-disqualification threshold (Q3, Q6).
4. **Chat uses WebSocket for sending, REST for history**: Sending is via `socket.emit('team_message')` for real-time delivery. Initial load uses REST for reliability. All messages are enriched with sender `username` (Q4).
5. **Problem start times are team-wide and backend-managed**: The per-problem timer is stored server-side (`problemStartTimes` JSON on HackathonTeam). When a team first accesses an unlocked problem, the backend auto-sets the start time. All team members see the same timer (Q5).
6. **Chat panel excluded from anti-cheat**: The `.chat-panel` CSS class is used to scope clipboard event handlers. This allows teammates to copy/paste within chat while blocking it in the code editor area.
7. **Anti-cheat blur/tab_switch debounce**: A 500ms debounce prevents the `blur` and `tab_switch` events from double-firing when switching tabs (Q2).
8. **Solved problems are read-only**: Once a team has an AC verdict for a problem, the backend rejects re-submissions and the frontend disables the editor, Run, and Submit buttons (Q7).

## Out of Scope

- Monaco Editor integration (currently using `<textarea>`; Monaco is tracked separately)
- Yjs collaborative editing integration
- Clarification submission UI (Q&A tab shows placeholder only)
- Scoreboard reveal animation
- Post-hackathon results page
- Admin anti-cheat dashboard (admin receives WebSocket events but no dedicated UI yet)
