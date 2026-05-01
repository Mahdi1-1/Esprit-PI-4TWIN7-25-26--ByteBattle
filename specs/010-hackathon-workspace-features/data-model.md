# Data Model: Hackathon Workspace Features

**Feature**: 010-hackathon-workspace-features  
**Date**: 2026-03-31

## Entities Modified

### HackathonTeam (Modified)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `hackathonId` | ObjectId | — | FK → Hackathon |
| `name` | String | — | Team display name |
| `members` | HackathonTeamMember[] | — | Embedded array of team members |
| `joinCode` | String | — | 6-char alphanumeric join code |
| `isCheckedIn` | Boolean | `false` | Whether team checked in |
| `isDisqualified` | Boolean | `false` | Whether team is disqualified by admin |
| **`anticheatViolations`** | **Int** | **`0`** | **NEW (Q3): Server-persisted count of anti-cheat violations. Incremented atomically via `{ increment: 1 }` on each violation event.** |
| **`problemStartTimes`** | **Json?** | **`null`** | **NEW (Q5): Team-wide timer sync. Format: `{ "challengeId": "ISO-8601 timestamp", ... }`. Auto-set by backend when team first accesses an unlocked problem.** |
| `solvedCount` | Int | `0` | Number of distinct solved challenges |
| `penaltyTime` | Int | `0` | Total penalty minutes |
| `score` | Int | `0` | Computed score: `solvedCount * 1000 - penaltyTime` |
| `type` | String | — | `"open"` or `"enterprise"` |
| `companyId` | ObjectId? | null | Enterprise company reference |
| `createdAt` | DateTime | `now()` | Creation timestamp |

**Indexes**: `@@index([hackathonId])`

### HackathonMessage (Unmodified — enriched at query time)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `hackathonId` | ObjectId | — | FK → Hackathon |
| `teamId` | ObjectId | — | FK → HackathonTeam |
| `userId` | ObjectId | — | Sender user ID |
| `content` | String | — | Message text |
| `codeSnippet` | String? | null | Optional code block |
| `codeLanguage` | String? | null | Language for code highlighting |
| `sentAt` | DateTime | `now()` | Sent timestamp |

**Note**: The `username` field is NOT stored on the model. It is enriched at query time by joining the User model in `HackathonChatService.sendMessage()` and `getMessages()`.

**Indexes**: `@@index([hackathonId, teamId, sentAt])`

## Virtual/Computed Entities

### ChallengeResponse (returned by `getHackathonChallenges`)

This is NOT a Prisma model — it's a computed response shape returned by the API.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `id` | String | Challenge.id | Challenge identifier |
| `order` | Int | index in challengeIds | 0-based position |
| `label` | String | computed | `A`, `B`, `C`... (`String.fromCharCode(65 + i)`) |
| `title` | String | Challenge.title / masked | Full title if unlocked, `"Problem X"` if locked |
| `difficulty` | String | Challenge.difficulty | `easy`, `medium`, `hard` |
| `descriptionMd` | String | Challenge.descriptionMd / empty | Full Markdown if unlocked, `""` if locked |
| `tags` | String[] | Challenge.tags / empty | Tags if unlocked, `[]` if locked |
| `constraints` | Json? | Challenge.constraints / null | Constraints if unlocked, `null` if locked |
| `hints` | String[] | Challenge.hints / empty | Hints if unlocked, `[]` if locked |
| `examples` | Json[] | Challenge.examples / empty | Examples if unlocked, `[]` if locked |
| `tests` | Json[] | Challenge.tests (non-hidden) / empty | Visible test cases if unlocked, `[]` if locked |
| `allowedLanguages` | String[] | Challenge.allowedLanguages | Always visible |
| `category` | String | Challenge.category | Always visible |
| `timeLimitMinutes` | Int | computed | `{ easy: 15, medium: 25, hard: 40 }[difficulty]` or 25 |
| `locked` | Boolean | computed | `true` if `index > firstUnsolvedIndex` |
| `solved` | Boolean | computed | `true` if team has AC for this challenge |
| `startedAt` | String? | HackathonTeam.problemStartTimes[id] | ISO timestamp when timer started for this problem, null if not started |

## State Transitions

### Problem Lock State (per team per challenge)

```
┌──────────┐     team solves     ┌──────────┐
│  LOCKED  │ ──── previous ────→ │ UNLOCKED │
│          │     challenge       │ (current) │
└──────────┘                     └─────┬─────┘
                                       │
                                  team gets AC
                                       │
                                       ▼
                                 ┌──────────┐
                                 │  SOLVED  │
                                 │(read-only)│
                                 └──────────┘
```

### Anti-Cheat Violation Flow

```
Browser Event (tab_switch | blur | copy | paste | devtools)
    │
    ├─ [debounce 500ms for blur/tab_switch]
    │
    ▼
reportViolation(eventType)
    │
    ├─ violationsRef.current++ (local)
    ├─ setShowWarning(true)
    └─ socket.emit('anticheat_event', {...})
         │
         ▼
    Gateway: handleAnticheatEvent()
         │
         ├─ prisma.hackathonTeam.update({ anticheatViolations: { increment: 1 } })
         ├─ server.emit('admin:anticheat_alert', event) → admin room
         └─ client.emit('anticheat:violation_count', { totalViolations })
              │
              ▼
         Frontend: sync violationsRef from server
```

## Validation Rules

| Rule | Layer | Implementation |
|------|-------|----------------|
| Team must solve all preceding challenges before submitting | Backend | `submitCode()` checks `challengeIds` ordering vs team AC verdicts |
| No re-submission to solved problems | Backend | `submitCode()` checks for existing AC verdict |
| Rate limit: 1 submission/problem/minute/team | Backend | `submitCode()` checks `submittedAt >= 1 minute ago` |
| Chat: only team members can send | Backend | `sendMessage()` validates `team.members.some(m => m.userId === userId)` |
| Anti-cheat: clipboard blocked outside `.chat-panel` | Frontend | Event handler checks `target.closest('.chat-panel')` |
| Anti-cheat: devtools shortcuts blocked | Frontend | Keydown handler checks F12, Ctrl+Shift+I/J/C, Ctrl+U |
