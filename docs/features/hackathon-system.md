# Hackathon System

**Spec**: `specs/009-hackathon-system/`  
**Status**: Implemented  

## Overview

A complete hackathon management system supporting the full lifecycle from creation to archival. Supports ICPC-style competitive programming hackathons with real-time scoreboard, team collaboration, and administrative tools.

## Lifecycle State Machine

```
                        ┌──────────┐
              ┌─────────│  draft    │
              │         └────┬─────┘
              │ (unpublish,  │ (publish)
              │  0 teams)    ▼
              │         ┌──────────┐
              └─────────│  lobby   │──────────┐
                        └────┬─────┘          │
                             │ (30min before  │ (cancel)
                             │  start / manual)│
                             ▼                ▼
                        ┌──────────┐    ┌───────────┐
                        │ checkin  │───▶│ cancelled  │
                        └────┬─────┘    └───────────┘
                             │ (≥1 checked-in team,
                             │  at startTime / manual)
                             ▼
                        ┌──────────┐
                ┌───────│  active  │──────┐
                │       └────┬─────┘      │
      (unfreeze)│            │ (at        │ (end manual)
                │            │ freezeAt)  │
                ▼            ▼            ▼
           ┌──────────┐                ┌──────────┐
           │  frozen   │──────────────▶│  ended   │
           └──────────┘  (at endTime/  └────┬─────┘
                          manual)           │ (archive)
                                            ▼
                                       ┌──────────┐
                                       │ archived │
                                       └──────────┘
```

**8 States**: `draft`, `lobby`, `checkin`, `active`, `frozen`, `ended`, `archived`, `cancelled`

## Scoring (ICPC-style)

- **Ranking**: Sorted by `solved DESC`, `penalty ASC`
- **Penalty**: Sum of (AC time in minutes) + (20 × wrong attempts before AC) for each solved problem
- **Ties**: Same rank assigned to teams with equal solved count and penalty
- **First Blood**: Tracked per problem — first AC gets a special marker
- **Freeze**: Scoreboard cached to Redis at freeze time; participants see frozen, admins see live
- **Reveal**: Sequential reveal of pending submissions after competition ends

## Key Decisions

| # | Decision | Resolution |
|---|----------|------------|
| 13 | Solo join shortcut | Auto-create single-member team with `Solo-{username}` name |
| 14 | Captain succession | Oldest member (by `joinedAt`) auto-promoted when captain leaves |
| 15 | Concurrent participation | One active hackathon per user at a time |
| 16 | Rejudge scoring | Recalculate from scratch; earliest AC wins |
| 19 | Rate limiting | 60-second cooldown between submissions per team |
| 22 | Admin freeze override | Admins can unfreeze (frozen→active) for corrections |
| 23 | Enterprise scope | Forces solo teams (maxSize: 1), validates CompanyMember |
| 24 | Deletion rules | draft=hard delete, lobby/checkin=cancel, active/frozen=forbidden, ended=archive |

## API Endpoints

### Public / Participant

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hackathons` | List hackathons (paginated, filterable) |
| GET | `/hackathons/:id` | Get hackathon details |
| POST | `/hackathons/:id/teams` | Create team |
| POST | `/hackathons/:id/teams/join` | Join team by code |
| POST | `/hackathons/:id/teams/solo` | Solo join shortcut |
| POST | `/hackathons/:id/teams/:teamId/checkin` | Check in team |
| POST | `/hackathons/:id/teams/:teamId/leave` | Leave team |
| POST | `/hackathons/:id/teams/:teamId/submissions` | Submit code |
| POST | `/hackathons/:id/teams/:teamId/run` | Run code (no verdict) |
| GET | `/hackathons/:id/teams/:teamId/submissions` | Get team submissions |
| GET | `/hackathons/:id/scoreboard` | Get scoreboard (frozen for participants) |
| POST | `/hackathons/:id/teams/:teamId/messages` | Send team chat message |
| GET | `/hackathons/:id/teams/:teamId/messages` | Get team chat messages |
| POST | `/hackathons/:id/clarifications` | Submit clarification question |
| GET | `/hackathons/:id/clarifications` | Get clarifications |
| GET | `/hackathons/:id/announcements` | Get announcements |

### Admin (requires `admin` role)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/hackathons` | Create hackathon |
| PATCH | `/hackathons/:id` | Update hackathon |
| POST | `/hackathons/:id/transition` | Transition status |
| POST | `/hackathons/:id/cancel` | Cancel hackathon |
| DELETE | `/hackathons/:id` | Delete hackathon (status-dependent) |
| DELETE | `/hackathons/:id/teams/:teamId/members/:userId` | Remove team member |
| POST | `/hackathons/:id/teams/:teamId/disqualify` | Disqualify team |
| POST | `/hackathons/:id/teams/:teamId/reinstate` | Reinstate team |
| GET | `/hackathons/:id/scoreboard/admin` | Live admin scoreboard |
| GET | `/hackathons/:id/export` | Export results (CSV/JSON) |
| POST | `/hackathons/:id/announcements` | Create announcement |
| POST | `/hackathons/:id/announcements/:announcementId/pin` | Toggle pin |
| POST | `/hackathons/:id/clarifications/:clarificationId/answer` | Answer clarification |
| GET | `/hackathons/:id/monitoring` | Get monitoring data |
| GET | `/hackathons/:id/audit-log` | Get audit log |
| POST | `/hackathons/:id/rejudge/problem/:challengeId` | Rejudge problem |
| POST | `/hackathons/:id/rejudge/team/:teamId` | Rejudge team |
| GET | `/hackathons/:id/plagiarism/:challengeId` | Run plagiarism check |

## WebSocket Events

**Namespace**: `/hackathons`

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_hackathon` | `{ hackathonId }` | Join hackathon room |
| `join_team` | `{ hackathonId, teamId }` | Join team room |
| `team_message` | `{ hackathonId, teamId, content }` | Send team chat message |
| `collab_sync` | `{ teamId, challengeId, update }` | Yjs document sync |
| `collab_awareness` | `{ teamId, challengeId, state }` | Cursor/awareness sync |

### Server → Client

| Event | Room | Description |
|-------|------|-------------|
| `scoreboard_update` | `hackathon:{id}` | Scoreboard changed |
| `announcement` | `hackathon:{id}` | New announcement |
| `status_change` | `hackathon:{id}` | Hackathon status transition |
| `clarification_response` | `team:{teamId}` | Clarification answered |
| `submission_verdict` | `team:{teamId}` | Submission judged |
| `team_message` | `team:{teamId}` | New chat message |
| `collab_sync` | `team:{teamId}:collab:{challengeId}` | Yjs update |
| `collab_awareness` | `team:{teamId}:collab:{challengeId}` | Awareness update |
| `admin_feed` | `hackathon:{id}:admin` | Admin-only activity feed |

## Data Models

See `specs/009-hackathon-system/data-model.md` for full schema.

**Key Models** (all prefixed with `Hackathon` to avoid conflicts with existing `Team`/`TeamMember`):

- `Hackathon` — extended with `description`, `bannerUrl`, `cancelledReason`, `createdById`
- `HackathonTeam` — separate from existing `Team` model
- `HackathonTeamMember` — embedded type in `HackathonTeam`
- `HackathonSubmission` — per-team, per-challenge submissions
- `HackathonMessage` — team chat messages
- `HackathonAnnouncement` — admin broadcasts
- `HackathonClarification` — Q&A system
- `HackathonAuditLog` — admin action audit trail
- `YjsDocumentSnapshot` — collaborative editor state persistence

## Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/hackathons` | `Hackathon` | Listing page with 8-status filtering |
| `/hackathon/:id/lobby` | `HackathonLobby` | Team creation, joining, check-in |
| `/hackathon/:id/workspace` | `HackathonWorkspace` | Code editor, problems, chat, submissions |
| `/hackathon/:id/results` | `HackathonResults` | Final scoreboard with podium |
| `/admin/hackathons/create` | `AdminHackathonCreate` | 7-step creation wizard |
| `/admin/hackathons/:id` | `AdminHackathonDetail` | Lifecycle, teams, audit, export |
| `/admin/hackathons/:id/monitoring` | `AdminHackathonMonitoring` | Real-time dashboard |
| `/admin/hackathons/:id/clarifications` | `AdminHackathonClarifications` | Q&A management |

## Keyboard Shortcuts (Workspace)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Submit code |
| `Ctrl+R` | Run code |
| `Ctrl+/` | Toggle chat/clarifications panel |
| `Ctrl+.` | Switch to clarifications panel |

## Backend Services

| Service | Responsibility |
|---------|---------------|
| `HackathonsService` | CRUD, lifecycle state machine, team management |
| `HackathonSubmissionService` | Code submission, run, verdict handling, rejudge |
| `HackathonScoreboardService` | ICPC ranking, freeze/reveal, export |
| `HackathonChatService` | Team chat messages |
| `HackathonClarificationService` | Q&A between teams and admins |
| `HackathonAnnouncementService` | Admin broadcasts |
| `HackathonAuditService` | Action audit logging |
| `HackathonMonitoringService` | Real-time monitoring data |
| `HackathonPlagiarismService` | Code similarity detection (Jaccard 3-gram) |
| `HackathonSchedulerService` | Automatic status transitions (30s interval) |
| `HackathonYjsService` | Yjs document persistence (5s debounce) |
| `HackathonsGateway` | WebSocket gateway (namespace `/hackathons`) |
