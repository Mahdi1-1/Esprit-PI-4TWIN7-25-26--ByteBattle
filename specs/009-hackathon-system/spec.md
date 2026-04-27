# Feature Specification: Hackathon System

**Feature Branch**: `009-hackathon-system`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: User description: "Implement the complete Hackathon system for ByteBattle2 including all participant AND admin logic. Each hackathon contains multiple problems to solve as a team, with a real-time ICPC scoreboard, co-editing of code, team chat, freeze time system, and a complete admin panel."

## Clarifications

### Session 2026-03-28

- Q: Should hackathon submissions reuse the existing `Submission` model? → A: No — create a dedicated `HackathonSubmission` model with team-specific fields (teamId, hackathonId, penaltyMinutes, isFirstBlood, attemptNumber) to keep models clean.
- Q: How should the scoreboard behave during freeze time? → A: The backend continues computing scores internally. Participants see the frozen snapshot. Admins always see real-time scores. On unfreeze, a dramatic reveal animation shows final standings.
- Q: Should the co-editing feature use OT or CRDT? → A: Use Yjs CRDT — industry standard, integrates with Monaco Editor, no central authority needed.
- Q: What is the maximum team size? → A: Configurable per hackathon via `teamPolicy.maxSize` (default 3, max 5).
- Q: Should clarifications be public or private? → A: Admin can choose per-response: answer privately to one team or broadcast to all teams (standard ICPC behavior).
- Q: How should the admin create a hackathon? → A: 7-step wizard: General Info → Rules → Problems → Team Policy → Timing → Access → Review & Publish.
- Q: Should there be a check-in phase? → A: Yes — after lobby (registration), captains must check in their team during the `checkin` phase before competition starts.
- Q: What penalty should wrong submissions incur? → A: +20 minutes per wrong attempt on a problem that is eventually solved (standard ICPC penalty).
- Q: What anti-plagiarism measures are needed? → A: Post-hackathon MOSS-style AST comparison. Admin can trigger analysis and review flagged pairs.
- Q: Should teams be able to see other teams' submissions? → A: No — teams only see their own submissions. The scoreboard shows solved/attempted status but no code.

### Session 2026-03-29

- Q: Solo participants — if `teamPolicy.minSize = 1`? → A: Yes, solo participants still go through team creation (team of 1). A "Join Solo" shortcut auto-creates a team with the user as captain.
- Q: Captain leaves or disconnects — who inherits captaincy? → A: Auto-promote the oldest member (by `joinedAt`). If no members remain, the team is dissolved.
- Q: Concurrent hackathon participation? → A: No — a user can only be in ONE active hackathon at a time. If they want to join another, they must leave their current team first.
- Q: Which submission counts for scoring after rejudge? → A: Follow standard ICPC rules — after rejudge, the earliest AC submission's time is used for penalty calculation.
- Q: Scoreboard frozen snapshot — how stored? → A: Cached in Redis/memory. Computed once at freeze time, served from cache. Invalidated only on unfreeze. Falls back to on-the-fly computation if cache misses.
- Q: Allowed programming languages per hackathon? → A: Inherit each challenge's `allowedLanguages`. No hackathon-level language restriction.
- Q: Rate limiting on submissions? → A: Max 1 submission per problem per minute per team. Prevents spam while allowing reasonable iteration.
- Q: Yjs document persistence — survive server restart? → A: Yes — Yjs documents are persisted periodically (every 30s) to MongoDB. On reconnect, the document is restored from the last snapshot.
- Q: `session` and `analytics` fields on existing Team model? → A: Keep them for backward compatibility but do NOT use them in hackathon logic. Create a SEPARATE `HackathonTeam` model (not modifying the existing `Team`). `HackathonTeam` ≠ `Team` — no relation between them.
- Q: Freeze trigger — automatic, manual, or both? → A: Both — automatic at `freezeAt` time, but admin can override (freeze early or skip freeze). Admin can also manually unfreeze.
- Q: Enterprise scope — how does it interact with team creation? → A: Enterprise scope is primarily for interviews. If a hackathon has `scope: enterprise` + `companyId`, it's limited to 1 team with 1 member from that company. All other hackathons use standard team policy.
- Q: Hackathon deletion rules? → A: Depends on status. `draft` = hard delete. `lobby`/`checkin` = soft delete (status → `cancelled`) with confirmation + participant notification. `active`/`frozen` = deletion FORBIDDEN (must end first). `ended` = soft delete to `archived`, results preserved.

## RBAC Model

| Role | Scope | Capabilities |
|------|-------|-------------|
| Super Admin | Global | All admin capabilities + create/delete hackathons + manage other admins |
| Admin | Per-hackathon | Full hackathon management: lifecycle transitions, rejudge, announcements, monitoring, disqualification |
| Moderator | Per-hackathon | Answer clarifications, view submissions, issue warnings (cannot change lifecycle or rejudge) |
| Captain | Per-team | Check-in team, manage team members (invite/kick before competition), submit code |
| Participant | Per-team | Submit code, use co-editor, team chat, request clarifications, view scoreboard |

## User Scenarios & Testing

### User Story A1 — Admin Creates Hackathon (Priority: P0)

An admin creates a new hackathon through a 7-step wizard: (1) General Info (title, description), (2) Rules (markdown rules document), (3) Problem Selection (search and add challenges from the problem bank), (4) Team Policy (min/max size, auto-assign or captain-create), (5) Timing (start, end, freeze-at times with timezone support), (6) Access (public, invite-only with joinCode, or enterprise-scoped), (7) Review & Publish (preview all settings, publish or save as draft).

**Why this priority**: P0 — Without the ability to create a hackathon, no other feature is usable.

**Independent Test**: Admin navigates to `/admin/hackathons` → clicks "Create Hackathon" → completes all 7 wizard steps → hackathon appears in admin list with "draft" status.

**Acceptance Scenarios**:

1. **Given** an admin user, **When** they click "Create Hackathon", **Then** a 7-step wizard opens with General Info as the first step.
2. **Given** the wizard is on step 3 (Problems), **When** the admin searches for challenges, **Then** they see a filterable list of published challenges with difficulty badges and can add/remove them.
3. **Given** all 7 steps are filled in, **When** the admin clicks "Save as Draft", **Then** the hackathon is created with status `draft` and appears in the admin list.
4. **Given** a draft hackathon, **When** the admin clicks "Publish", **Then** the status changes to `lobby` and participants can see it on the hackathon listing page.
5. **Given** step 4 (Team Policy), **When** the admin sets max team size to 4, **Then** no team can exceed 4 members when joining later.

---

### User Story A2 — Admin Manages Lifecycle (Priority: P0)

An admin transitions a hackathon through its lifecycle states: `draft → lobby → checkin → active → frozen → ended → archived`. Each transition has validation (e.g., cannot start without at least 1 team checked in, cannot freeze if not active). The admin dashboard shows the current state prominently with available transition actions.

**Why this priority**: P0 — The lifecycle state machine drives the entire competition flow.

**Independent Test**: Admin opens hackathon detail → sees current state badge → clicks "Open Registration" (draft→lobby) → sees lobby state → clicks "Start Check-in" → clicks "Start Competition" → sees timer running → clicks "Freeze Scoreboard" → clicks "End Competition" → sees final results.

**Acceptance Scenarios**:

1. **Given** a `draft` hackathon, **When** the admin clicks "Open Registration", **Then** status becomes `lobby` and participants can register teams.
2. **Given** a `lobby` hackathon with 5 registered teams, **When** the admin clicks "Start Check-in", **Then** status becomes `checkin` and team captains see a "Check In" button.
3. **Given** a `checkin` hackathon with 3/5 teams checked in, **When** the admin clicks "Start Competition", **Then** status becomes `active`, the timer starts, and only checked-in teams appear on the scoreboard.
4. **Given** an `active` hackathon, **When** the admin clicks "Freeze Scoreboard", **Then** status becomes `frozen`, participants see a "FROZEN" banner, but can still submit.
5. **Given** a `frozen` hackathon, **When** the admin clicks "End & Reveal", **Then** status becomes `ended`, the scoreboard unfreezes with a reveal animation, and final rankings are displayed.
6. **Given** an `ended` hackathon, **When** the admin clicks "Archive", **Then** status becomes `archived` and it moves to the historical section.

---

### User Story A3 — Admin Monitors Live Dashboard (Priority: P1)

During an active competition, the admin sees a real-time monitoring dashboard showing: team activity (last submission time, current problem), submission feed (all verdicts streaming in), team status grid (online/offline/idle), and aggregate statistics (total submissions, acceptance rate, problems solved distribution).

**Why this priority**: P1 — Admins need visibility into what's happening during the competition.

**Independent Test**: During an active hackathon, admin opens the monitoring dashboard → sees real-time submission feed updating as teams submit → sees team status grid → sees aggregate stats.

**Acceptance Scenarios**:

1. **Given** an active hackathon with 10 teams, **When** admin opens the monitoring dashboard, **Then** they see a grid of all 10 teams with their last activity timestamp and current problem.
2. **Given** team "Alpha" submits code, **When** the verdict comes back "AC", **Then** the admin sees the event appear in the live submission feed within 2 seconds.
3. **Given** a team has been inactive for 15+ minutes, **When** admin views the team grid, **Then** that team shows an "idle" indicator.
4. **Given** 50 total submissions across all teams, **When** admin views aggregate stats, **Then** they see: total submissions (50), acceptance rate (e.g., 40%), problems solved distribution chart.

---

### User Story A4 — Admin Makes Announcements (Priority: P1)

Admins can broadcast announcements to all participants in real-time. Announcements appear as a prominent banner/toast in every participant's UI and are stored for later reference. Admins can pin important announcements.

**Why this priority**: P1 — Essential for communicating rule changes, time extensions, or technical issues during competition.

**Independent Test**: Admin types an announcement → clicks "Broadcast" → all connected participants see a notification banner with the message.

**Acceptance Scenarios**:

1. **Given** an active hackathon, **When** admin types "Problem B test case corrected" and clicks Broadcast, **Then** all connected participants see a banner notification within 2 seconds.
2. **Given** a broadcasted announcement, **When** a participant views the announcements panel, **Then** they see all past announcements ordered by newest first.
3. **Given** an announcement, **When** the admin clicks "Pin", **Then** it stays visible at the top of the announcements panel.

---

### User Story A5 — Admin Handles Clarifications (Priority: P1)

Admins see a queue of clarification requests from teams. Each request is tagged to a specific problem or "general". Admins can respond privately (to the requesting team only) or broadcast the response to all teams. Admins can also mark requests as "No response needed".

**Why this priority**: P1 — Standard ICPC feature, essential for fair competition.

**Independent Test**: Team asks "Is the input 0-indexed?" for Problem A → Admin sees it in the queue → responds "Yes, 0-indexed" with broadcast → all teams see the clarification.

**Acceptance Scenarios**:

1. **Given** 3 pending clarification requests, **When** admin opens the clarifications panel, **Then** they see all 3 sorted by newest, each with team name, problem label, and question text.
2. **Given** a clarification request, **When** admin responds with "broadcast to all", **Then** every connected participant receives the response in their clarification panel.
3. **Given** a clarification request, **When** admin responds with "private", **Then** only the requesting team sees the response.
4. **Given** a spam/duplicate clarification, **When** admin clicks "No Response Needed", **Then** the request is marked as resolved without sending a response.

---

### User Story A6 — Admin Triggers Rejudge (Priority: P2)

When a problem's test cases are corrected, an admin can trigger a rejudge for that problem (re-evaluates all teams' submissions). The rejudge process: queues all relevant submissions to the judge-worker, waits for results, then atomically updates the scoreboard. Admin sees rejudge progress in real-time.

**Why this priority**: P2 — Important for fairness but infrequent use case.

**Independent Test**: Admin corrects test cases for Problem C → clicks "Rejudge Problem C" → sees progress bar as 15 submissions are re-evaluated → scoreboard updates with new results.

**Acceptance Scenarios**:

1. **Given** Problem C with 15 team submissions, **When** admin clicks "Rejudge Problem C", **Then** 15 judge-worker jobs are queued.
2. **Given** a rejudge in progress, **When** admin views the rejudge panel, **Then** they see a progress bar (e.g., "8/15 completed").
3. **Given** a rejudge completes, **When** Team Alpha's previously-WA submission now passes, **Then** their scoreboard entry updates to show Problem C as solved with the original submission time.
4. **Given** a rejudge completes, **When** results differ from pre-rejudge, **Then** the scoreboard re-ranks all teams atomically.

---

### User Story A7 — Admin Manages Teams (Priority: P2)

Admins can view all teams, their members, and manage them: disqualify a team (removes from scoreboard), force-add/remove a member, reset a team's submissions for a problem, and view detailed team analytics.

**Why this priority**: P2 — Needed for handling disputes and rule violations.

**Independent Test**: Admin views team list → sees all teams with members → clicks "Disqualify" on a team → team disappears from participant scoreboard.

**Acceptance Scenarios**:

1. **Given** 10 teams in a hackathon, **When** admin opens team management, **Then** they see all 10 teams with member names, roles, check-in status, and solved count.
2. **Given** a team suspected of cheating, **When** admin clicks "Disqualify", **Then** the team is removed from the public scoreboard and cannot submit further.
3. **Given** a disqualified team, **When** admin clicks "Reinstate", **Then** the team returns to the scoreboard with their original score.

---

### User Story A8 — Admin Views Audit Log (Priority: P3)

All admin actions are logged in an audit trail: lifecycle transitions, rejudges, disqualifications, announcement broadcasts, clarification responses. The audit log shows who did what, when, with details.

**Why this priority**: P3 — Important for accountability but not blocking for launch.

**Independent Test**: Admin performs various actions → opens audit log → sees chronological list of all actions with actor, action type, timestamp, and details.

**Acceptance Scenarios**:

1. **Given** an admin transitions hackathon to "active", **When** they view the audit log, **Then** an entry shows: "[Admin Name] started competition at [timestamp]".
2. **Given** multiple admin actions, **When** viewing the audit log, **Then** entries are sorted newest first with pagination.
3. **Given** the audit log, **When** filtering by action type "rejudge", **Then** only rejudge-related entries are shown.

---

### User Story A9 — Admin Runs Anti-Plagiarism Analysis (Priority: P3)

After a hackathon ends, an admin can trigger an anti-plagiarism scan that compares all submissions per problem using AST-based similarity analysis. Flagged pairs (similarity > threshold) are shown in a review interface where the admin can view both solutions side-by-side.

**Why this priority**: P3 — Post-competition feature, not needed during live event.

**Independent Test**: Admin clicks "Run Plagiarism Scan" for Problem A → sees progress → results show 2 flagged pairs with 85% similarity → admin views side-by-side comparison.

**Acceptance Scenarios**:

1. **Given** an ended hackathon, **When** admin clicks "Run Plagiarism Scan" for Problem A, **Then** all accepted submissions for Problem A are compared pairwise.
2. **Given** a completed scan, **When** two teams' submissions have >80% AST similarity, **Then** they appear in the flagged pairs list with similarity percentage.
3. **Given** a flagged pair, **When** admin clicks "Review", **Then** they see both solutions side-by-side with highlighted similar sections.

---

### User Story A10 — Admin Configures Freeze & Unfreeze (Priority: P1)

Admin can set and modify the freeze time (when the scoreboard freezes), and trigger the unfreeze/reveal sequence. The unfreeze is a dramatic, row-by-row reveal starting from the lowest rank, resolving pending submissions one at a time.

**Why this priority**: P1 — Core ICPC ceremony feature.

**Independent Test**: Admin sets freeze at T-30min → at freeze time, participants see "FROZEN" → at end, admin clicks "Reveal" → scoreboard animates from bottom to top, resolving each team's pending submissions.

**Acceptance Scenarios**:

1. **Given** `freezeAt` set to 30 minutes before end, **When** the time is reached, **Then** participants' scoreboard stops updating and shows "FROZEN" banner.
2. **Given** a frozen scoreboard, **When** a team submits and gets AC, **Then** participants see no change, but the admin scoreboard updates.
3. **Given** an ended hackathon, **When** admin clicks "Start Reveal", **Then** the scoreboard animates from last place upward, resolving each team's frozen submissions one at a time with suspense animation.

---

### User Story A11 — Admin Exports Results (Priority: P3)

Admin can export hackathon results as CSV/JSON including: final rankings, team details, per-problem solve times, penalty details, and submission statistics.

**Why this priority**: P3 — Post-event reporting, not blocking.

**Independent Test**: Admin clicks "Export Results" → selects CSV → downloads a file with all team rankings, solve times, and penalties.

**Acceptance Scenarios**:

1. **Given** an ended hackathon, **When** admin clicks "Export CSV", **Then** a CSV file is downloaded with columns: Rank, Team, Solved, Penalty, and per-problem status.
2. **Given** an ended hackathon, **When** admin clicks "Export JSON", **Then** a JSON file is downloaded with full team details, member lists, and submission history.

---

### User Story P1 — Participant Browses & Joins Hackathons (Priority: P0)

A participant visits the hackathons page and sees: ongoing hackathons (with countdown timer), upcoming hackathons (with registration button), and past hackathons (with results). They can view hackathon details (rules, problems count, team policy) and either create a team (becoming captain) or join an existing team via invite code.

**Why this priority**: P0 — Entry point for all participants.

**Independent Test**: User visits `/hackathon` → sees list of hackathons by status → clicks "Register" on a lobby hackathon → creates a team → sees team lobby page.

**Acceptance Scenarios**:

1. **Given** 2 active, 1 lobby, and 3 ended hackathons, **When** a user visits `/hackathon`, **Then** they see 3 sections: Ongoing (2), Upcoming (1), Finished (3).
2. **Given** a `lobby` hackathon, **When** user clicks "Register" and enters a team name, **Then** a team is created with the user as captain.
3. **Given** a team with joinCode "ABC123", **When** another user enters "ABC123", **Then** they join the team as a participant.
4. **Given** a team at max capacity (3/3), **When** a user tries to join, **Then** they see "Team is full" error.
5. **Given** the user is already in a team for this hackathon, **When** they try to create another team, **Then** they see "Already registered" error.

---

### User Story P2 — Captain Manages Team (Priority: P1)

The team captain can: invite members (share join code), view the team roster, remove members (before competition starts), and check in the team during the `checkin` phase.

**Why this priority**: P1 — Captains need team management before competition starts.

**Independent Test**: Captain sees team page → shares join code → member joins → captain sees updated roster → during check-in phase, captain clicks "Check In" → team is marked as checked-in.

**Acceptance Scenarios**:

1. **Given** a team with 2/3 members, **When** captain views team page, **Then** they see member list with roles and a shareable join code.
2. **Given** the hackathon is in `lobby` phase, **When** captain clicks "Remove" on a member, **Then** the member is removed from the team.
3. **Given** the hackathon is in `active` phase, **When** captain tries to remove a member, **Then** the action is blocked ("Cannot modify team during competition").
4. **Given** the hackathon is in `checkin` phase, **When** captain clicks "Check In", **Then** the team is marked as checked-in and the admin sees the updated count.

---

### User Story P3 — Participant Solves Problems (Priority: P0)

During an active hackathon, participants see the problem list with difficulty and status (unsolved/attempted/solved). They click on a problem to open the coding workspace: problem description on the left, Monaco code editor on the right, test execution below. They can run test cases and submit solutions. Verdicts (AC, WA, TLE, RE, CE) appear in real-time.

**Why this priority**: P0 — This is the core activity of the competition.

**Independent Test**: Participant opens Problem A → reads description → writes code → clicks "Run" → sees test results → clicks "Submit" → verdict appears → scoreboard updates.

**Acceptance Scenarios**:

1. **Given** an active hackathon with 5 problems, **When** participant opens the problems view, **Then** they see problems A-E with difficulty badges and status icons (✓ solved, ✗ attempted, — untouched).
2. **Given** problem A is selected, **When** participant writes correct code and clicks "Submit", **Then** the verdict "Accepted" appears within 10 seconds and the problem status changes to ✓.
3. **Given** an incorrect submission for Problem B, **When** the verdict is "Wrong Answer", **Then** the attempt count increments and 20min penalty is recorded (but only applied if eventually solved).
4. **Given** participant submits to Problem A after 45 minutes with 2 prior wrong attempts, **When** it's accepted, **Then** penalty = 45 + (2 × 20) = 85 minutes.
5. **Given** the hackathon has ended, **When** participant tries to submit, **Then** they see "Competition has ended" error.

---

### User Story P4 — Team Collaborates in Real-Time (Priority: P1)

Team members can simultaneously edit the same code file using real-time collaborative editing. Each member's cursor is visible with their name tag (different colors). Changes propagate within 100ms. Awareness indicators show who's working on which problem.

**Why this priority**: P1 — Key differentiator for team competition.

**Independent Test**: Member A and Member B open Problem C → both see each other's cursors → A types on line 5, B sees it instantly → B types on line 10, A sees it.

**Acceptance Scenarios**:

1. **Given** 2 team members open the same problem, **When** Member A types code, **Then** Member B sees the changes within 200ms with Member A's cursor visible.
2. **Given** 3 team members editing simultaneously, **When** all type at different positions, **Then** no conflict occurs and all changes merge correctly (CRDT guarantee).
3. **Given** a team member navigates to a different problem, **When** another member views the team awareness panel, **Then** they see "Member A is working on Problem C".
4. **Given** a team member disconnects and reconnects, **When** they reopen the editor, **Then** they see the latest state and can resume editing.

---

### User Story P5 — Team Uses Chat (Priority: P1)

Team members can communicate via a real-time text chat panel within the hackathon workspace. Messages support code snippet formatting. Chat history is persisted for the duration of the hackathon.

**Why this priority**: P1 — Essential for team coordination during competition.

**Independent Test**: Member A sends "try using BFS" → Member B sees it instantly → Member B sends a code snippet → it renders with syntax highlighting.

**Acceptance Scenarios**:

1. **Given** 3 team members in a hackathon, **When** Member A sends a message, **Then** Members B and C see it within 1 second.
2. **Given** a member sends a message with triple backtick code block, **When** others view it, **Then** the code is rendered with syntax highlighting.
3. **Given** 50 messages in chat history, **When** a member scrolls up, **Then** they can see all previous messages.
4. **Given** a member disconnects and reconnects, **When** they open chat, **Then** they see all messages sent while they were away.

---

### User Story P6 — Participant Views Real-Time Scoreboard (Priority: P0)

Participants see a live ICPC-style scoreboard showing: rank, team name, total solved, total penalty, and per-problem status cells. Status cells show: green (solved, with time + attempts), red (attempted, with attempt count), gray (unattempted). First blood (first team to solve a problem) gets a special flame icon. The scoreboard updates in real-time via WebSocket.

**Why this priority**: P0 — Central UI of any programming competition.

**Independent Test**: Participant views scoreboard → sees all teams ranked → Team Alpha solves Problem C → scoreboard updates within 2 seconds → first blood flame icon appears.

**Acceptance Scenarios**:

1. **Given** 10 teams in a hackathon, **When** participant opens scoreboard, **Then** teams are ranked by (1) most solved, (2) least penalty, with rank numbers.
2. **Given** Team Alpha solves Problem C at minute 45 on first attempt, **When** scoreboard updates, **Then** Team Alpha's Problem C cell shows green with "45" and no attempt indicator.
3. **Given** Team Beta fails Problem D twice then solves it, **When** scoreboard updates, **Then** Problem D cell shows green with time and "(3)" for 3 total attempts.
4. **Given** Team Alpha is the first to solve Problem C, **When** scoreboard updates, **Then** Problem C cell shows a 🔥 flame icon (first blood).
5. **Given** the scoreboard is frozen, **When** participant views it, **Then** they see a "SCOREBOARD FROZEN" banner and no further updates.

---

### User Story P7 — Participant Requests Clarification (Priority: P1)

During a competition, a participant can submit a clarification request tagged to a specific problem or "general". They see their own past requests with admin responses. Broadcast clarifications from admins appear as notifications.

**Why this priority**: P1 — Standard competitive programming feature.

**Independent Test**: Participant clicks "Ask Clarification" for Problem B → types question → submits → sees it in their clarifications list → admin responds → participant sees the response.

**Acceptance Scenarios**:

1. **Given** an active hackathon, **When** participant submits a clarification for Problem B, **Then** it appears in their clarifications list as "Pending".
2. **Given** the admin responds privately, **When** participant views clarifications, **Then** the response appears under their question.
3. **Given** the admin broadcasts a clarification, **When** any participant views the clarifications panel, **Then** they see the broadcasted answer.

---

### User Story P8 — Participant Sees Announcements (Priority: P1)

Admin announcements appear as prominent banners/toasts in the participant's workspace. Participants can view all announcements in a dedicated panel. Pinned announcements stay visible.

**Why this priority**: P1 — Participants must be aware of admin communications.

**Independent Test**: Admin broadcasts "Problem B test case updated" → participant sees a toast notification → clicks "Announcements" → sees the full list.

**Acceptance Scenarios**:

1. **Given** an active hackathon, **When** admin broadcasts an announcement, **Then** participant sees a toast notification within 2 seconds.
2. **Given** 5 past announcements, **When** participant opens the announcements panel, **Then** all 5 are listed newest first.
3. **Given** a pinned announcement, **When** participant views the panel, **Then** the pinned announcement appears at the top regardless of date.

---

### User Story P9 — Participant Views Team Dashboard (Priority: P2)

Participants see a team dashboard showing: team progress (problems solved per member), submission history for their team, and individual contribution stats.

**Why this priority**: P2 — Enhances team coordination but not critical for competition.

**Independent Test**: Participant opens team dashboard → sees who submitted what → sees team progress chart.

**Acceptance Scenarios**:

1. **Given** a team with 3 members, **When** participant opens team dashboard, **Then** they see each member's submission count and which problems they worked on.
2. **Given** the team has solved 3/5 problems, **When** viewing progress, **Then** a progress bar shows 3/5 with per-problem status.

---

### User Story P10 — Participant Views Post-Hackathon Results (Priority: P2)

After a hackathon ends, participants can view: final rankings with reveal animation (if they missed it), their team's detailed statistics, per-problem analysis (time taken, attempts, comparison to median), and earned badges/achievements.

**Why this priority**: P2 — Important for engagement but not blocking.

**Independent Test**: After hackathon ends, participant navigates to the hackathon page → sees final results → clicks their team → sees detailed stats and per-problem breakdown.

**Acceptance Scenarios**:

1. **Given** an ended hackathon, **When** participant visits the results page, **Then** they see final rankings with their team highlighted.
2. **Given** the team solved 4/6 problems, **When** viewing detailed stats, **Then** they see per-problem: time to solve, attempts, and comparison to fastest team.
3. **Given** the team achieved first blood on Problem A, **When** viewing results, **Then** a "First Blood" badge is highlighted for that problem.
