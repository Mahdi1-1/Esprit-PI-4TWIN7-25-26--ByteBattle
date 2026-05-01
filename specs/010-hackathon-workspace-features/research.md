# Research: Hackathon Workspace Features

**Feature**: 010-hackathon-workspace-features  
**Date**: 2026-03-31  
**Status**: Complete — all unknowns resolved

## R1: Sequential Problem Unlock — Server-Side Enforcement

**Decision**: Backend enforces sequential order at both read (API) and write (submit) levels.

**Rationale**: Client-side enforcement alone is bypassable via direct API calls. The backend's `getHackathonChallenges()` strips content from locked problems, and `submitCode()` validates that all preceding challenges have AC verdicts before accepting a submission.

**Alternatives considered**:
- Client-only enforcement: Rejected — trivially bypassable via curl/Postman
- Middleware-based enforcement: Rejected — submission logic is tightly coupled to challenge ordering; inline validation is clearer

**Implementation**:
- `hackathons.service.ts` → `getHackathonChallenges(hackathonId, teamId)` returns `locked: true` with empty content for problems beyond `firstUnsolvedIndex`
- `hackathon-submission.service.ts` → `submitCode()` checks `hackathon.challengeIds` ordering and verifies all preceding challenges have AC verdicts for the team

## R2: Anti-Cheat — Client-Side Detection + Server-Side Persistence

**Decision**: 6 client-side event listeners detect violations, a 500ms debounce prevents blur/tab_switch double-firing, violations are persisted atomically to `HackathonTeam.anticheatViolations` field, and admins receive real-time alerts.

**Rationale**: Browser-based anti-cheat cannot be 100% tamper-proof, but logging + admin alerts provide accountability. Server-side persistence ensures violation count survives page refreshes.

**Alternatives considered**:
- Browser extension for anti-cheat: Rejected — requires user installation, poor UX
- Proctoring camera integration: Rejected — out of scope, privacy concerns
- Auto-disqualification at N violations: Rejected by user — manual admin control preferred

**Implementation**:
- Frontend `HackathonWorkspace.tsx` → 6 event listeners with `reportViolation()` function, 500ms debounce via `lastViolationTimeRef`
- Backend `hackathons.gateway.ts` → `handleAnticheatEvent()` uses `prisma.hackathonTeam.update({ data: { anticheatViolations: { increment: 1 } } })`
- Schema `HackathonTeam` → `anticheatViolations Int @default(0)`

## R3: Team-Wide Problem Timer — Backend-Managed Start Times

**Decision**: Problem start times are stored server-side on `HackathonTeam.problemStartTimes` (JSON field). When `getHackathonChallenges()` is called and the current problem has no start time, the backend auto-sets it. All team members see the same `startedAt` value.

**Rationale**: Client-local timers are not synchronized across team members. Server-side storage ensures all members see identical countdowns.

**Alternatives considered**:
- Client-local `useState` timer: Rejected — different members see different start times; timer resets on page refresh
- Redis-based timer with TTL: Rejected — over-engineered for informational timers; MongoDB JSON field is sufficient
- Separate `ProblemTimer` collection: Rejected — adds unnecessary complexity; embedded JSON on HackathonTeam is simpler

**Implementation**:
- Schema `HackathonTeam` → `problemStartTimes Json?` stores `{ "challengeId": "ISO timestamp" }`
- `hackathons.service.ts` → `getHackathonChallenges()` auto-sets start time for current unlocked problem, returns `startedAt` per challenge
- Frontend `ProblemTimer` component uses `new Date(currentProblem.startedAt).getTime()` instead of local state

## R4: Chat Username Enrichment

**Decision**: Backend enriches messages with the sender's `username` from the User model. Both `sendMessage()` and `getMessages()` perform user lookups.

**Rationale**: The `HackathonMessage` model stores only `userId`. Displaying "Teammate" is a poor UX. A server-side join avoids N+1 queries on the client.

**Alternatives considered**:
- Store username on HackathonMessage model: Rejected — data denormalization; username changes would require backfilling
- Frontend lookup via separate API: Rejected — N+1 pattern; chat with many messages would make many requests
- Include username in WebSocket payload only: Rejected — REST history endpoint also needs usernames

**Implementation**:
- `hackathon-chat.service.ts` → `sendMessage()` fetches user after create, returns `{ ...message, username }`
- `hackathon-chat.service.ts` → `getMessages()` batch-fetches all unique userIds, builds usernameMap, enriches all messages

## R5: Solved Problems Read-Only

**Decision**: Once a team has an AC verdict for a challenge, re-submissions are blocked at both backend and frontend.

**Rationale**: Re-submissions to solved problems waste judge resources and could potentially alter scoring.

**Alternatives considered**:
- Allow re-submissions but ignore: Rejected — wastes compute on judge-worker
- Frontend-only block: Rejected — bypassable via direct API calls

**Implementation**:
- `hackathon-submission.service.ts` → `submitCode()` checks for existing AC before accepting
- `HackathonWorkspace.tsx` → solved problems show "Solved — Read Only" banner, editor is `readOnly`, Run/Submit buttons are disabled

## R6: Difficulty-Based Time Limits

**Decision**: Time limits are computed server-side using a fixed map: `{ easy: 15, medium: 25, hard: 40 }` (minutes). Default fallback is 25 minutes.

**Rationale**: Time limits per problem are a user requirement. Server-side computation ensures consistency.

**Alternatives considered**:
- Admin-configurable per-problem time limits: Rejected — user specified difficulty-based; fixed map is simpler
- No time limits (hackathon endTime only): Rejected — contradicts the user requirement "la durée des problèmes sera selon le niveau"

**Implementation**:
- `hackathons.service.ts` → `TIME_LIMITS` constant map, applied in `getHackathonChallenges()` as `timeLimitMinutes`
- Frontend `ProblemTimer` component renders countdown, pulses yellow at < 2min, shows "TIME UP" at 0
