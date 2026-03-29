# Research: Hackathon System

**Date**: 2026-03-28  
**Feature**: 009-hackathon-system

## Resolved Decisions

### 1. Hackathon Lifecycle State Machine

**Decision**: 7-state lifecycle: `draft → lobby → checkin → active → frozen → ended → archived`  
**Rationale**: ICPC competitions follow a strict ceremony: registration opens (lobby), participants confirm presence (check-in), competition starts (active), scoreboard freezes near the end (frozen), results revealed (ended), then archived for historical records. Extending the current 4-state enum (`draft/active/frozen/ended`) with `lobby`, `checkin`, and `archived` covers all real-world scenarios.  
**Alternatives considered**: Keeping 4 states and overloading `draft` for lobby+checkin → rejected because it prevents proper UI state transitions and role-specific behavior per phase.

### 2. Scoring Algorithm — ICPC Style

**Decision**: ICPC scoring: rank by (1) most problems solved, (2) least total penalty time. Penalty = time of accepted submission from start + 20 min per wrong attempt on solved problems.  
**Rationale**: This is the universally adopted competitive programming scoring system (ACM-ICPC, Codeforces). The user explicitly requested ICPC scoring. Simple to compute, well-understood by competitive programmers.  
**Alternatives considered**: IOI scoring (partial points) → rejected per user requirement. Custom hybrid → over-engineered for v1.

### 3. Collaborative Editing — Yjs CRDT

**Decision**: Use Yjs CRDT library with a custom `y-websocket` provider running on the NestJS backend for real-time collaborative code editing within teams.  
**Rationale**: Yjs is the industry-standard CRDT for collaborative editing (used by Jupyter, AFFiNE, Hocuspocus). It integrates natively with Monaco Editor (which is already used in the project). The CRDT approach guarantees eventual consistency without operational transform complexity. The NestJS gateway acts as the awareness + sync provider.  
**Alternatives considered**: (1) ShareDB (OT-based) → more complex, worse offline behavior; (2) Firepad → Firebase lock-in; (3) No real-time co-editing, just shared submissions → rejected per user requirement.

### 4. Team Chat Architecture

**Decision**: Socket.IO rooms per team within the `/hackathons` namespace. Messages stored in embedded `HackathonMessage` model. No file attachments for v1.  
**Rationale**: Reuses the existing Socket.IO infrastructure pattern (same as `/duels`). Embedding messages in MongoDB with team room isolation is simple and performant for the expected scale (< 100 messages per team per hackathon). Code snippets are supported via a `codeSnippet` field.  
**Alternatives considered**: (1) Separate chat microservice → over-engineered for v1; (2) Using the existing Discussion/Comment model → wrong abstraction, hackathon chat is ephemeral.

### 5. Scoreboard Freeze Mechanism

**Decision**: At `freezeAt` time, the scoreboard continues computing internally but serves the frozen snapshot to participants. Admins see the real-time scoreboard at all times. On `unfreeze`, a dramatic reveal animation shows the final standings.  
**Rationale**: This is the standard ICPC freeze behavior. Keeping the internal scoreboard up-to-date means no recalculation is needed on unfreeze. The reveal animation creates excitement and engagement.  
**Alternatives considered**: Stop accepting submissions after freeze → rejected, teams should still submit during freeze.

### 6. WebSocket Namespace

**Decision**: Single `/hackathons` namespace with room-based isolation: `hackathon:{id}` for scoreboard events, `team:{teamId}` for chat + co-editing, `admin:{hackathonId}` for admin monitoring.  
**Rationale**: One namespace simplifies connection management. Socket.IO rooms provide adequate isolation. JWT auth on connection (same pattern as `/duels` gateway). Reduces the number of WebSocket connections per client.  
**Alternatives considered**: Multiple namespaces (`/hackathon-scoreboard`, `/hackathon-chat`, `/hackathon-collab`) → rejected because a participant needs all three, resulting in 3 separate connections.

### 7. Anti-Plagiarism Strategy

**Decision**: Post-hackathon MOSS-style (Measure of Software Similarity) analysis using AST-based comparison. Store all submissions for forensic analysis. Admin can trigger plagiarism scan and review flagged pairs.  
**Rationale**: Real-time plagiarism detection would be too slow and resource-intensive. Post-hoc analysis is standard in competitive programming (Codeforces uses similar approach). AST comparison catches renamed variables and reordered functions.  
**Alternatives considered**: (1) Real-time duplicate detection → too slow; (2) No plagiarism detection → unacceptable for competitive integrity.

### 8. Hackathon Submission vs Regular Submission

**Decision**: Create a dedicated `HackathonSubmission` model rather than reusing the existing `Submission` model.  
**Rationale**: Hackathon submissions have unique fields: `teamId`, `hackathonId`, `penaltyMinutes`, `isFirstBlood`, `attemptNumber`. They also need different indexing (by team+challenge+hackathon). Reusing `Submission` would require nullable hackathon-specific fields polluting the generic model.  
**Alternatives considered**: Adding hackathon fields to existing `Submission` → rejected to keep models clean and queries efficient.

### 9. Admin Hackathon Creation — Wizard vs Single Form

**Decision**: 7-step wizard for hackathon creation: (1) General Info, (2) Rules & Description, (3) Problem Selection, (4) Team Policy, (5) Timing & Freeze, (6) Access & Invitations, (7) Review & Publish.  
**Rationale**: A hackathon has many configuration options (15+ fields). A single form would be overwhelming. A wizard guides the admin step-by-step, validates each section, and allows draft-saving between steps.  
**Alternatives considered**: Single long form with sections → poor UX for complex setup.

### 10. Rejudge System

**Decision**: Admin can trigger rejudge per-problem (re-evaluates all submissions for a specific challenge) or per-team (re-evaluates all submissions for a specific team). Rejudge creates new judge-worker jobs and updates the scoreboard atomically.  
**Rationale**: Rejudge is essential when a problem's test cases are corrected during competition. Per-problem is the most common use case. Per-team handles suspected cheating.  
**Alternatives considered**: Full hackathon rejudge → too expensive, rarely needed.

### 11. Clarification System

**Decision**: Asynchronous Q&A system: participants ask questions tagged to a specific problem or "general". Admins answer with optional broadcast to all teams. Standard ICPC clarification flow.  
**Rationale**: Direct copy of ICPC/Codeforces clarification UX. Prevents spam by limiting to the clarification form. Broadcast answers ensure fairness (if one team gets a clarification, all should).  
**Alternatives considered**: Using team chat for clarifications → rejected because admins need a centralized queue and broadcast capability.

### 12. Check-in System

**Decision**: Captain must confirm team check-in during the `checkin` phase. This validates team readiness and allows admins to see who's actually present before starting.  
**Rationale**: Without check-in, teams that registered but didn't show up would appear on the scoreboard (confusing). Check-in ensures only active teams participate.  
**Alternatives considered**: Auto-check-in (assume all registered teams are present) → rejected for accuracy.

### 13. HackathonTeam vs Team — Separate Models

**Decision**: Create a NEW `HackathonTeam` model completely separate from the existing `Team` model. The existing `Team` model is NOT modified (keeps `session`, `analytics` fields for backward compatibility). No relation between `Team` and `HackathonTeam`.  
**Rationale**: The existing `Team` model is used elsewhere in the system (possibly duels or other features). Hackathon teams have different fields (joinCode, isCheckedIn, isDisqualified) and a different lifecycle. Keeping them separate avoids breaking existing functionality and keeps concerns isolated.  
**Alternatives considered**: (1) Modify existing `Team` model → rejected to avoid breaking changes; (2) Inherit from `Team` → MongoDB/Prisma doesn't support inheritance.

### 14. Captain Succession

**Decision**: If a captain leaves a team, the oldest member (by `joinedAt`) is automatically promoted to captain. If no members remain, the team is dissolved.  
**Rationale**: Teams must always have a captain for check-in and management. Auto-promotion by seniority is the simplest deterministic rule. Dissolving empty teams prevents orphaned records.  
**Alternatives considered**: (1) Admin intervention required → too slow; (2) Any member can claim → race condition risk.

### 15. Concurrent Hackathon Participation

**Decision**: A user can only participate in ONE active hackathon at a time. They must leave their current team before joining another hackathon.  
**Rationale**: Competing in multiple simultaneous hackathons would split attention and create unfair advantages (sharing solutions across competitions). Single-hackathon focus is standard in competitive programming.  
**Alternatives considered**: Allow multiple → rejected for fairness.

### 16. Submission Rate Limiting

**Decision**: Max 1 submission per problem per minute per team. No global submission cap per hackathon.  
**Rationale**: Per-problem rate limit prevents brute-force spam while allowing teams to iterate on different problems concurrently. One minute cooldown is standard in competitive programming (Codeforces uses similar).  
**Alternatives considered**: (1) No limit → spam risk; (2) Global cap (50 total) → punishes prolific teams unfairly.

### 17. Yjs Document Persistence

**Decision**: Yjs CRDT documents are persisted to MongoDB every 30 seconds. On server restart or reconnect, the document is restored from the last snapshot. Each document is keyed by `{hackathonId}:{teamId}:{challengeId}`.  
**Rationale**: Losing code during a competition is catastrophic. Periodic persistence balances write frequency against data safety. 30s interval means at most 30s of work is lost in a crash — acceptable given the autosave nature.  
**Alternatives considered**: (1) No persistence (in-memory only) → unacceptable risk; (2) Persist every keystroke → too expensive for MongoDB.

### 18. Frozen Scoreboard Storage

**Decision**: Cached in Redis/memory. The scoreboard is computed once when freeze is triggered, stored in cache, and served for all non-admin requests. Falls back to on-the-fly computation (filtering pre-freeze submissions) if cache misses.  
**Rationale**: Computing the scoreboard once is efficient and consistent. Cache avoids repeated aggregation. Redis/memory provides sub-millisecond reads for the high-traffic scoreboard endpoint during competitions.  
**Alternatives considered**: (1) Materialized JSON in MongoDB → extra write, slower reads; (2) Always compute on-the-fly → too expensive under load.

### 19. Hackathon Lifecycle — Extended State Machine

**Decision**: Extended lifecycle with `cancelled` status and nuanced deletion rules:
- `draft → lobby` (publish), `lobby → draft` (unpublish, only if 0 teams)
- `lobby → checkin` (automatic 30min before start, or manual)
- `checkin → active` (automatic at startTime, or manual "Start Now")
- `active → frozen` (automatic at freezeAt, or manual "Freeze Now")
- `active → ended` (manual "End Now"), `frozen → ended` (automatic at endTime, or manual)
- `any (except active/frozen) → cancelled` (admin cancel with notification)
- `ended → archived` (admin action)
- Deletion: `draft` = hard delete, `lobby/checkin` = soft delete to `cancelled` (confirmation required, type hackathon name, notify participants), `active/frozen` = FORBIDDEN, `ended` = soft delete to `archived`.  
**Rationale**: Extends Decision 1 with real-world operational needs. Automatic transitions reduce admin burden. Cancellation with notification respects participants. Forbidding mid-competition deletion prevents data loss. Soft delete preserves historical records.  
**Alternatives considered**: Original 7-state without cancellation → insufficient for operational scenarios.

### 20. Enterprise Scope for Hackathons

**Decision**: If `scope: enterprise` + `companyId` is set, the hackathon is limited to 1 team with 1 member from that company (validated via `CompanyMember`). Enterprise hackathons are primarily used for interview-style coding assessments.  
**Rationale**: Enterprise hackathons serve a different purpose (candidate assessment) than public competitions. Single-team single-member enforces individual evaluation. Company membership is validated against the existing `CompanyMember` model.  
**Alternatives considered**: Allow full team policy for enterprise → over-complex for assessment use case.

## No Outstanding NEEDS CLARIFICATION

All design decisions resolved via clarification sessions on 2026-03-28 and 2026-03-29.
