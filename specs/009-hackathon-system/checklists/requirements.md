# Quality Checklist: Hackathon System

**Date**: 2026-03-28  
**Feature**: 009-hackathon-system

## Requirements Traceability

### Admin User Stories

| Story | Priority | Description | Spec | Data Model | API | Tasks |
|-------|----------|-------------|------|------------|-----|-------|
| US-A1 | P0 | Create Hackathon (7-step wizard) | ✅ | ✅ Hackathon model | ✅ POST /hackathons | ✅ T020-T021, T116-T123 |
| US-A2 | P0 | Manage Lifecycle | ✅ | ✅ HackathonStatus enum (8 states) | ✅ PATCH /status, POST /cancel, DELETE | ✅ T018-T019d, T124-T125 |
| US-A3 | P1 | Live Monitoring Dashboard | ✅ | ✅ Via aggregation | ✅ GET /admin/monitoring | ✅ T061, T086, T126 |
| US-A4 | P1 | Announcements | ✅ | ✅ HackathonAnnouncement | ✅ POST+GET /announcements | ✅ T044-T046, T081-T083, T127 |
| US-A5 | P1 | Clarifications | ✅ | ✅ HackathonClarification | ✅ POST /answer | ✅ T041-T043, T077-T078, T128 |
| US-A6 | P2 | Rejudge | ✅ | ✅ Via HackathonSubmission | ✅ POST /rejudge | ✅ T062-T063, T084, T131 |
| US-A7 | P2 | Team Management | ✅ | ✅ HackathonTeam.isDisqualified | ✅ PATCH /disqualify | ✅ T028, T085, T129 |
| US-A8 | P3 | Audit Log | ✅ | ✅ HackathonAuditLog | ✅ GET /audit-log | ✅ T022, T064, T087, T130 |
| US-A9 | P3 | Anti-Plagiarism | ✅ | ✅ Scan results | ✅ POST /plagiarism-scan | ✅ T066, T090, T132 |
| US-A10 | P1 | Freeze & Unfreeze | ✅ | ✅ Hackathon.freezeAt | ✅ In scoreboard | ✅ T036-T038, T111 |
| US-A11 | P3 | Export Results | ✅ | ✅ Via scoreboard | ✅ POST /export | ✅ T065, T089, T133 |

### Participant User Stories

| Story | Priority | Description | Spec | Data Model | API | Tasks |
|-------|----------|-------------|------|------------|-----|-------|
| US-P1 | P0 | Browse & Join Hackathons | ✅ | ✅ HackathonTeam (NEW), HackathonTeamMember (NEW) | ✅ POST /teams, /join, /join-solo | ✅ T023-T024, T069b, T096-T097 |
| US-P2 | P1 | Captain Manages Team | ✅ | ✅ HackathonTeamMember.role | ✅ /checkin, /leave, /remove | ✅ T025-T027, T098 |
| US-P3 | P0 | Solve Problems | ✅ | ✅ HackathonSubmission | ✅ POST /submit, /run | ✅ T029-T032, T099-T105 |
| US-P4 | P1 | Collaborative Editing | ✅ | ✅ Via Yjs CRDT + YjsDocumentSnapshot | ✅ WS collab events | ✅ T053-T054, T053b, T095, T102 |
| US-P5 | P1 | Team Chat | ✅ | ✅ HackathonMessage | ✅ GET+POST /messages | ✅ T039-T040, T106-T107 |
| US-P6 | P0 | Real-Time Scoreboard | ✅ | ✅ Via aggregation | ✅ GET /scoreboard | ✅ T033-T037, T108-T110 |
| US-P7 | P1 | Request Clarification | ✅ | ✅ HackathonClarification | ✅ POST /clarifications | ✅ T041, T076, T112 |
| US-P8 | P1 | See Announcements | ✅ | ✅ HackathonAnnouncement | ✅ GET /announcements | ✅ T045, T082, T113 |
| US-P9 | P2 | Team Dashboard | ✅ | ✅ Via aggregation | ✅ GET /submissions | ✅ T075, T105 |
| US-P10 | P2 | Post-Hackathon Results | ✅ | ✅ Via scoreboard | ✅ GET /scoreboard | ✅ T114 |

## Architecture Checklist

- [ ] **Modular**: All hackathon logic contained in `backend/src/hackathons/` module with sub-services
- [ ] **No circular deps**: Sub-services injected via module providers, gateway uses services (not the reverse)
- [ ] **Single namespace**: `/hackathons` WebSocket namespace with room-based isolation
- [ ] **Consistent auth**: JWT auth on gateway (same as `/duels`), `@Roles('admin')` on REST endpoints
- [ ] **Dedicated models**: `HackathonSubmission` separate from `Submission`, `HackathonTeam` separate from `Team` (Decision #21: no modification to existing Team model)
- [ ] **ICPC correctness**: Scoring matches official ICPC rules (solved DESC, penalty ASC, +20min per wrong attempt, earliest AC wins after rejudge — Decision #16)
- [ ] **State machine**: All lifecycle transitions validated server-side with preconditions (8-state machine including `cancelled`)
- [ ] **No concurrent participation**: User cannot be in HackathonTeams across multiple active hackathons (Decision #15)
- [ ] **Rate limiting**: 1 submission per problem per minute per team (Decision #19)
- [ ] **Frozen scoreboard**: Cached in Redis/memory, not materialized in MongoDB (Decision #17)
- [ ] **Yjs persistence**: Periodic document snapshots persisted to MongoDB via `YjsDocumentSnapshot` (Decision #20)
- [ ] **Enterprise scope**: Forced to max 1 team, 1 member per company (Decision #23)
- [ ] **Captain succession**: Auto-promote oldest member when captain leaves (Decision #14)

## Security Checklist

- [ ] Team membership validated server-side before allowing: submit, run, chat, collab, view submissions
- [ ] Admin role required for: lifecycle transitions, announcements, clarification answers, rejudge, disqualify, monitoring, audit log, export, plagiarism scan, cancel, delete
- [ ] Captain role required for: check-in, remove member
- [ ] Cannot join team after `lobby` phase
- [ ] Cannot modify team roster after `checkin` phase
- [ ] Cannot submit code after `ended` status
- [ ] Disqualified teams cannot submit
- [ ] Team submissions visible only to team members and admins (not other teams)
- [ ] WebSocket room join validated server-side (cannot join arbitrary team rooms)
- [ ] Cannot delete/cancel hackathon during `active` or `frozen` status (Decision #24)
- [ ] Cannot join multiple active hackathons simultaneously (Decision #15)
- [ ] Rate limit enforced server-side on submissions (Decision #19)
- [ ] Language validated against challenge's `allowedLanguages` (Decision #18)

## Performance Checklist

- [ ] Scoreboard computed with indexed queries (hackathonId + teamId + challengeId index)
- [ ] Scoreboard cached and invalidated on new verdict (not recomputed on every request)
- [ ] Frozen scoreboard snapshot cached in Redis/memory — not materialized in MongoDB (Decision #17)
- [ ] Chat messages use cursor-based pagination (not offset-based)
- [ ] WebSocket events scoped to rooms (not broadcast to all connections)
- [ ] Yjs CRDT sync is relay-only (server does not process document state)
- [ ] Yjs document persistence debounced (5-second timer resets on each sync, Decision #20)
- [ ] Submission rate limit check uses indexed query on last submission timestamp

## Testing Checklist

- [ ] Unit tests for ICPC scoring: various solve/penalty scenarios, earliest-AC-wins after rejudge
- [ ] Unit tests for lifecycle state machine: all 8 states, valid + invalid transitions, deletion rules by status
- [ ] Unit tests for captain succession: captain leaves → oldest member promoted
- [ ] Unit tests for concurrent participation: user cannot join second active hackathon
- [ ] Unit tests for rate limiting: 1 submission/problem/minute
- [ ] Unit tests for enterprise scope: max 1 team, 1 member
- [ ] Integration test: full hackathon flow (create → register → compete → freeze → end)
- [ ] Integration test: cancel hackathon (lobby → cancelled with notifications)
- [ ] WebSocket test: scoreboard update after submission verdict
- [ ] Frontend test: scoreboard renders correctly with mock data
- [ ] Frontend test: rate limit feedback (429 → cooldown timer)

## Data Model Completeness

| Model | Fields | Indexes | Relations | Notes |
|-------|--------|---------|-----------|-------|
| Hackathon (mod) | +4 fields | +2 indexes | +6 relations | bannerUrl, description, createdById, cancelledReason |
| HackathonStatus (mod) | +4 values | — | — | lobby, checkin, archived, cancelled |
| HackathonTeam (NEW) | 13 fields | 2 indexes | 4 relations | Separate from existing Team model (Decision #21) |
| HackathonTeamMember (NEW) | 3 fields | — | — | Separate from existing TeamMember (Decision #21) |
| HackathonSubmission (new) | 16 fields | 3 indexes | 2 relations | Core ICPC submission |
| HackathonMessage (new) | 7 fields | 1 index | 2 relations | Team chat |
| HackathonAnnouncement (new) | 5 fields | 1 index | 1 relation | Admin broadcasts |
| HackathonClarification (new) | 12 fields | 2 indexes | 2 relations | Q&A system |
| HackathonAuditLog (new) | 5 fields | 2 indexes | 1 relation | Admin action trail |
| YjsDocumentSnapshot (new) | 5 fields | 1 unique compound | 1 relation | Periodic Yjs persistence (Decision #20) |

**⚠️ Note**: Existing `Team` and `TeamMember` models are NOT modified. They retain their `session` and `analytics` fields for backward compatibility.
