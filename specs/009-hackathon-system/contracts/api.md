# API Contracts: Hackathon System

**Date**: 2026-03-28  
**Feature**: 009-hackathon-system

---

## 1. Public Hackathon Endpoints

### GET /api/hackathons
List hackathons with pagination and status filter.

**Auth**: Public  
**Query Params**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| status | string | — | Filter by status: draft, lobby, checkin, active, frozen, ended, archived, cancelled |

**Response 200**:
```json
{
  "data": [
    {
      "id": "665abc...",
      "title": "ByteBattle Spring 2026",
      "description": "Solve 6 problems in 5 hours",
      "startTime": "2026-04-01T10:00:00Z",
      "endTime": "2026-04-01T15:00:00Z",
      "status": "lobby",
      "scope": "public",
      "teamCount": 12,
      "problemCount": 6,
      "bannerUrl": "/images/hackathon-banner.jpg"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

### GET /api/hackathons/:id
Get hackathon details.

**Auth**: Public  
**Response 200**:
```json
{
  "id": "665abc...",
  "title": "ByteBattle Spring 2026",
  "description": "Solve 6 problems in 5 hours",
  "startTime": "2026-04-01T10:00:00Z",
  "endTime": "2026-04-01T15:00:00Z",
  "status": "active",
  "freezeAt": "2026-04-01T14:30:00Z",
  "rulesMd": "## Rules\n1. ICPC scoring...",
  "scope": "public",
  "teamPolicy": { "minSize": 1, "maxSize": 3 },
  "challengeIds": ["66a...", "66b...", "66c...", "66d...", "66e...", "66f..."],
  "challenges": [
    { "id": "66a...", "title": "Two Sum", "difficulty": "easy", "index": "A" }
  ],
  "teams": [
    { "id": "t1...", "name": "Team Alpha", "memberCount": 3, "isCheckedIn": true }
  ],
  "teamCount": 12,
  "userTeam": { "id": "t1...", "name": "Team Alpha", "role": "captain" }
}
```

---

### GET /api/hackathons/:id/scoreboard
Get ICPC-style scoreboard.

**Auth**: Required (user role)  
**Response 200**:
```json
{
  "isFrozen": false,
  "frozenAt": "2026-04-01T14:30:00Z",
  "problems": ["A", "B", "C", "D", "E", "F"],
  "teams": [
    {
      "rank": 1,
      "teamId": "t1...",
      "teamName": "Team Alpha",
      "solved": 5,
      "penalty": 342,
      "problems": {
        "A": { "status": "solved", "time": 12, "attempts": 1, "isFirstBlood": true },
        "B": { "status": "solved", "time": 45, "attempts": 3, "isFirstBlood": false },
        "C": { "status": "attempted", "time": null, "attempts": 2, "isFirstBlood": false },
        "D": { "status": "solved", "time": 78, "attempts": 1, "isFirstBlood": false },
        "E": { "status": "unattempted", "time": null, "attempts": 0, "isFirstBlood": false },
        "F": { "status": "solved", "time": 120, "attempts": 2, "isFirstBlood": false }
      }
    }
  ],
  "lastUpdated": "2026-04-01T12:34:56Z"
}
```

---

### GET /api/hackathons/:id/announcements
Get hackathon announcements.

**Auth**: Required (user role)  
**Response 200**:
```json
[
  {
    "id": "ann1...",
    "content": "Problem B test case corrected. Rejudge in progress.",
    "isPinned": true,
    "adminName": "Admin User",
    "createdAt": "2026-04-01T11:30:00Z"
  }
]
```

---

### GET /api/hackathons/:id/clarifications
Get clarifications visible to current user's team + all broadcast clarifications.

**Auth**: Required (user role)  
**Response 200**:
```json
[
  {
    "id": "clar1...",
    "question": "Is the input 0-indexed?",
    "answer": "Yes, all indices are 0-based.",
    "problemLabel": "B",
    "status": "answered",
    "isBroadcast": true,
    "askedBy": "Team Alpha",
    "createdAt": "2026-04-01T11:00:00Z",
    "answeredAt": "2026-04-01T11:05:00Z"
  }
]
```

---

## 2. Team Endpoints

### POST /api/hackathons/:id/teams
Create a team (caller becomes captain).

**Auth**: Required (user role)  
**Precondition**: Hackathon status = `lobby`. User not already in a HackathonTeam for this hackathon. User not already participating in ANY other active hackathon (Decision #15: no concurrent participation). For enterprise scope: user must be CompanyMember, max 1 HackathonTeam allowed (Decision #23).  
**Body**:
```json
{
  "name": "Team Alpha"
}
```
**Response 201**:
```json
{
  "id": "t1...",
  "name": "Team Alpha",
  "joinCode": "X7K9P2",
  "members": [
    { "userId": "u1...", "role": "captain", "joinedAt": "2026-03-28T..." }
  ]
}
```

---

### POST /api/hackathons/:id/teams/join
Join an existing team via join code.

**Auth**: Required (user role)  
**Precondition**: Hackathon status = `lobby`. Team not full. User not already in a HackathonTeam. User not in any other active hackathon (Decision #15).  
**Body**:
```json
{
  "joinCode": "X7K9P2"
}
```
**Response 200**: Team object with updated members.

---

### POST /api/hackathons/:id/join-solo
Join as a solo participant (auto-creates a HackathonTeam of 1).

**Auth**: Required (user role)  
**Precondition**: Hackathon status = `lobby`. `teamPolicy.minSize <= 1`. User not already in a HackathonTeam. User not in any other active hackathon (Decision #15).  
**Response 201**:
```json
{
  "id": "t2...",
  "name": "alice (solo)",
  "joinCode": "M3Q8R1",
  "members": [
    { "userId": "u1...", "role": "captain", "joinedAt": "2026-03-28T..." }
  ]
}
```
**Error 400**: `{ "message": "Solo participation not allowed: minimum team size is 2" }` (when `teamPolicy.minSize > 1`)

---

### POST /api/hackathons/:id/teams/:teamId/checkin
Captain checks in the team.

**Auth**: Required (captain role in this team)  
**Precondition**: Hackathon status = `checkin`.  
**Response 200**:
```json
{
  "id": "t1...",
  "name": "Team Alpha",
  "isCheckedIn": true
}
```

---

### GET /api/hackathons/:id/teams/:teamId
Get team details with members.

**Auth**: Required (team member or admin)  
**Response 200**:
```json
{
  "id": "t1...",
  "name": "Team Alpha",
  "joinCode": "X7K9P2",
  "isCheckedIn": true,
  "isDisqualified": false,
  "solvedCount": 3,
  "penaltyTime": 185,
  "members": [
    { "userId": "u1...", "username": "alice", "role": "captain", "joinedAt": "..." },
    { "userId": "u2...", "username": "bob", "role": "member", "joinedAt": "..." }
  ]
}
```

---

### DELETE /api/hackathons/:id/teams/:teamId/members/:userId
Captain removes a team member.

**Auth**: Required (captain)  
**Precondition**: Hackathon status = `lobby` or `checkin`. Cannot remove self (captain).  
**Response 200**: Updated team object.

---

### POST /api/hackathons/:id/teams/:teamId/leave
Member leaves the team. **Captain succession**: if the leaving user is captain, the oldest member (by `joinedAt`) is auto-promoted to captain (Decision #14). If no members remain, the HackathonTeam is dissolved.

**Auth**: Required (team member)  
**Precondition**: Hackathon status = `lobby` or `checkin`.  
**Response 200**: `{ "message": "Left team successfully", "newCaptain": "u2..." }` (newCaptain is null if team dissolved)

---

## 3. Submission Endpoints

### POST /api/hackathons/:id/submit
Submit code for a problem.

**Auth**: Required (team member in active hackathon)  
**Precondition**: Hackathon status = `active` or `frozen`. Team not disqualified. Language must be in challenge's `allowedLanguages` (Decision #18).  
**Rate Limit**: 1 submission per problem per minute per team (Decision #19). Returns `429 Too Many Requests` with `Retry-After` header if exceeded.  
**Body**:
```json
{
  "challengeId": "66a...",
  "code": "function solve(input) { ... }",
  "language": "javascript"
}
```
**Response 201**:
```json
{
  "id": "sub1...",
  "verdict": "queued",
  "attemptNumber": 3,
  "submittedAt": "2026-04-01T12:34:56Z"
}
```
**Error 429**:
```json
{
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

---

### POST /api/hackathons/:id/run
Run code against test cases without submitting (the "Run" button).

**Auth**: Required (team member in active hackathon)  
**Body**:
```json
{
  "challengeId": "66a...",
  "code": "function solve(input) { ... }",
  "language": "javascript"
}
```
**Response 200**:
```json
{
  "results": [
    { "input": "1 2", "expected": "3", "actual": "3", "passed": true, "timeMs": 12 },
    { "input": "5 7", "expected": "12", "actual": "12", "passed": true, "timeMs": 8 }
  ]
}
```

---

### GET /api/hackathons/:id/teams/:teamId/submissions
Get all submissions for a team.

**Auth**: Required (team member or admin)  
**Query Params**: `challengeId` (optional filter)  
**Response 200**:
```json
[
  {
    "id": "sub1...",
    "challengeId": "66a...",
    "problemLabel": "A",
    "userId": "u1...",
    "username": "alice",
    "language": "javascript",
    "verdict": "AC",
    "testsPassed": 10,
    "testsTotal": 10,
    "timeMs": 45.2,
    "attemptNumber": 2,
    "penaltyMinutes": 65,
    "isFirstBlood": false,
    "submittedAt": "2026-04-01T12:34:56Z"
  }
]
```

---

## 4. Clarification Endpoints

### POST /api/hackathons/:id/clarifications
Submit a clarification request.

**Auth**: Required (team member in active/frozen hackathon)  
**Body**:
```json
{
  "challengeId": "66a...",
  "question": "Is the input guaranteed to be sorted?"
}
```
**Response 201**: Clarification object with status "pending".

---

## 5. Chat Endpoints

### GET /api/hackathons/:id/teams/:teamId/messages
Get team chat history.

**Auth**: Required (team member)  
**Query Params**: `before` (cursor for pagination, DateTime), `limit` (default 50)  
**Response 200**:
```json
{
  "messages": [
    {
      "id": "msg1...",
      "userId": "u1...",
      "username": "alice",
      "content": "Try BFS for problem C",
      "codeSnippet": null,
      "codeLanguage": null,
      "sentAt": "2026-04-01T12:00:00Z"
    }
  ],
  "hasMore": true
}
```

---

### POST /api/hackathons/:id/teams/:teamId/messages
Send a chat message.

**Auth**: Required (team member in active/frozen hackathon)  
**Body**:
```json
{
  "content": "I think we should use DP",
  "codeSnippet": "const dp = new Array(n).fill(0);",
  "codeLanguage": "javascript"
}
```
**Response 201**: Message object.

---

## 6. Admin Endpoints

### POST /api/hackathons (Admin)
Create a new hackathon.

**Auth**: Required (admin role)  
**Body**:
```json
{
  "title": "ByteBattle Spring 2026",
  "description": "5-hour ICPC-style competition",
  "startTime": "2026-04-01T10:00:00Z",
  "endTime": "2026-04-01T15:00:00Z",
  "freezeAt": "2026-04-01T14:30:00Z",
  "challengeIds": ["66a...", "66b...", "66c..."],
  "rulesMd": "## Rules\n...",
  "scope": "public",
  "teamPolicy": { "minSize": 1, "maxSize": 3 },
  "bannerUrl": "/images/banner.jpg"
}
```
**Response 201**: Hackathon object with status `draft`.  
**Note**: If `scope: "enterprise"`, `teamPolicy` is forced to `{ minSize: 1, maxSize: 1 }` and `companyId` is required (Decision #23).

---

### PATCH /api/hackathons/:id (Admin)
Update hackathon details. Only allowed when status is `draft` or `lobby`.

**Auth**: Required (admin role)  
**Body**: Partial hackathon fields.  
**Response 200**: Updated hackathon object.

---

### PATCH /api/hackathons/:id/status (Admin)
Transition hackathon status.

**Auth**: Required (admin role)  
**Body**:
```json
{
  "status": "lobby"
}
```
**Validation** (full 8-state machine):
- `draft → lobby`: Always allowed (publish)
- `lobby → draft`: Only if 0 teams registered (unpublish)
- `lobby → checkin`: Auto 30min before startTime, or manual (at least 1 team)
- `checkin → active`: Auto at startTime, or manual (at least 1 checked-in team)
- `active → frozen`: Auto at `freezeAt` or manual admin override (Decision #22)
- `frozen → active`: Admin unfreeze override only (Decision #22)
- `active → ended`: Manual end early
- `frozen → ended`: Auto at endTime, or manual
- `ended → archived`: Always allowed
- `lobby → cancelled` / `checkin → cancelled`: Via `POST .../cancel` (with reason + notifications)
- `draft`: Use `DELETE` endpoint for hard delete
- `active → cancelled` / `frozen → cancelled`: **Forbidden** (403)

**Response 200**: Updated hackathon with new status.
**Error 400**: `{ "message": "Invalid transition from 'active' to 'lobby'" }`

---

### POST /api/hackathons/:id/announcements (Admin)
Broadcast an announcement.

**Auth**: Required (admin role)  
**Body**:
```json
{
  "content": "Problem B test case corrected",
  "isPinned": false
}
```
**Response 201**: Announcement object. Emits `announcement:new` WebSocket event to all participants.

---

### PATCH /api/hackathons/:id/announcements/:announcementId (Admin)
Update an announcement (toggle pin).

**Auth**: Required (admin role)  
**Body**: `{ "isPinned": true }`  
**Response 200**: Updated announcement.

---

### POST /api/hackathons/:id/clarifications/:clarificationId/answer (Admin)
Respond to a clarification.

**Auth**: Required (admin or moderator role)  
**Body**:
```json
{
  "answer": "Yes, the input is 0-indexed.",
  "isBroadcast": true
}
```
**Response 200**: Updated clarification. Emits WebSocket event to target team (or all teams if broadcast).

---

### POST /api/hackathons/:id/rejudge (Admin)
Trigger rejudge for a problem or team.

**Auth**: Required (admin role)  
**Body**:
```json
{
  "challengeId": "66a...",
  "teamId": null
}
```
One of `challengeId` or `teamId` must be provided.  
**Response 200**: `{ "jobsQueued": 15, "rejudgeId": "rj1..." }`

---

### PATCH /api/hackathons/:id/teams/:teamId/disqualify (Admin)
Disqualify a team.

**Auth**: Required (admin role)  
**Body**: `{ "reason": "Plagiarism detected" }`  
**Response 200**: Updated team with `isDisqualified: true`.

---

### PATCH /api/hackathons/:id/teams/:teamId/reinstate (Admin)
Reinstate a disqualified team.

**Auth**: Required (admin role)  
**Response 200**: Updated team with `isDisqualified: false`.

---

### GET /api/hackathons/:id/admin/monitoring (Admin)
Real-time monitoring data.

**Auth**: Required (admin role)  
**Response 200**:
```json
{
  "stats": {
    "totalSubmissions": 156,
    "acceptanceRate": 0.42,
    "activeTeams": 8,
    "idleTeams": 2,
    "problemsSolvedDistribution": { "A": 8, "B": 5, "C": 3, "D": 1, "E": 0, "F": 0 }
  },
  "recentSubmissions": [
    { "teamName": "Alpha", "problem": "C", "verdict": "WA", "submittedAt": "..." }
  ],
  "teamActivity": [
    { "teamId": "t1", "teamName": "Alpha", "lastActivity": "...", "currentProblem": "C", "status": "active" }
  ]
}
```

---

### GET /api/hackathons/:id/admin/audit-log (Admin)
View audit log.

**Auth**: Required (admin role)  
**Query Params**: `action` (optional filter), `page`, `limit`  
**Response 200**:
```json
{
  "data": [
    {
      "id": "log1...",
      "actorName": "Admin User",
      "action": "lifecycle_change",
      "details": { "from": "lobby", "to": "checkin" },
      "createdAt": "2026-04-01T09:45:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20
}
```

---

### GET /api/hackathons/:id/admin/scoreboard (Admin)
Admin scoreboard — always shows real-time data even during freeze.

**Auth**: Required (admin role)  
**Response 200**: Same format as public scoreboard, but `isFrozen: false` always.

---

### POST /api/hackathons/:id/export (Admin)
Export results as CSV or JSON.

**Auth**: Required (admin role)  
**Body**: `{ "format": "csv" }`  
**Response 200**: File download (CSV or JSON).

---

### POST /api/hackathons/:id/plagiarism-scan (Admin)
Trigger anti-plagiarism analysis.

**Auth**: Required (admin role)  
**Body**: `{ "challengeId": "66a..." }`  
**Response 200**: `{ "scanId": "scan1...", "submissionsToCompare": 15 }`

---

### GET /api/hackathons/:id/plagiarism-scan/:scanId (Admin)
Get plagiarism scan results.

**Auth**: Required (admin role)  
**Response 200**:
```json
{
  "scanId": "scan1...",
  "status": "completed",
  "flaggedPairs": [
    {
      "team1": { "id": "t1", "name": "Alpha" },
      "team2": { "id": "t2", "name": "Beta" },
      "similarity": 0.87,
      "team1Code": "...",
      "team2Code": "..."
    }
  ]
}
```

---

### DELETE /api/hackathons/:id (Admin)
Delete a hackathon. Behavior depends on current status (Decision #24):
- **draft**: Hard delete (permanently removed). Returns 204.
- **lobby / checkin**: Soft delete → status set to `cancelled`. All teams dissolved, participants notified. Returns 200 with cancelled hackathon.
- **active / frozen**: **Forbidden** — cannot delete during competition. Returns 403.
- **ended**: Soft delete → status set to `archived`. Returns 200 with archived hackathon.
- **cancelled / archived**: Already soft-deleted. Returns 404.

**Auth**: Required (admin role)  
**Response 204**: (for draft — hard deleted, no body)  
**Response 200**: `{ "id": "...", "status": "cancelled", "cancelledReason": "Deleted by admin" }` or `{ "status": "archived" }`  
**Error 403**: `{ "message": "Cannot delete hackathon during active competition" }`

---

### POST /api/hackathons/:id/cancel (Admin)
Cancel a hackathon with a reason. Dissolves all teams and notifies participants.

**Auth**: Required (admin role)  
**Precondition**: Status must NOT be `active` or `frozen` (403 if so).  
**Body**:
```json
{
  "reason": "Insufficient registrations"
}
```
**Response 200**:
```json
{
  "id": "665abc...",
  "status": "cancelled",
  "cancelledReason": "Insufficient registrations"
}
```
**Error 403**: `{ "message": "Cannot cancel hackathon during active competition. End it first." }`

---

## 7. WebSocket Events

**Namespace**: `/hackathons`

### Connection
Client connects with JWT auth (same pattern as `/duels`). On connection, server maps `socketId → userId`.

### Rooms
- `hackathon:{id}` — All participants of a hackathon (scoreboard events, announcements)
- `team:{teamId}` — Team-specific (chat, co-editing, clarification responses)
- `admin:{hackathonId}` — Admin-only (monitoring feed, all submissions)

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join_hackathon` | `{ hackathonId }` | Join the hackathon room |
| `join_team` | `{ hackathonId, teamId }` | Join the team room (verified server-side) |
| `team_message` | `{ teamId, content, codeSnippet?, codeLanguage? }` | Send team chat message |
| `collab_sync` | `{ teamId, challengeId, update: Uint8Array }` | Yjs CRDT document sync |
| `collab_awareness` | `{ teamId, challengeId, state }` | Cursor/awareness update |
| `submit_code` | `{ hackathonId, challengeId, code, language }` | Submit solution (alternative to REST) |

### Server → Client Events

| Event | Room | Payload | Description |
|-------|------|---------|-------------|
| `scoreboard:update` | `hackathon:{id}` | Scoreboard delta | Scoreboard changed (new solve, rank change) |
| `scoreboard:frozen` | `hackathon:{id}` | `{ frozenAt }` | Scoreboard is now frozen |
| `scoreboard:reveal` | `hackathon:{id}` | Reveal sequence data | Unfreeze reveal animation data |
| `announcement:new` | `hackathon:{id}` | Announcement object | New admin announcement |
| `clarification:response` | `team:{teamId}` | Clarification object | Response to team's clarification |
| `clarification:broadcast` | `hackathon:{id}` | Clarification object | Broadcast clarification |
| `team:message` | `team:{teamId}` | Message object | New chat message |
| `team:member_joined` | `team:{teamId}` | `{ userId, username }` | New member joined team |
| `team:member_left` | `team:{teamId}` | `{ userId }` | Member left team |
| `submission:verdict` | `team:{teamId}` | Submission result | Verdict received for team's submission |
| `hackathon:status_change` | `hackathon:{id}` | `{ status, oldStatus }` | Lifecycle state changed |
| `collab:sync` | `team:{teamId}` | `{ challengeId, update }` | Yjs document sync propagation |
| `collab:awareness` | `team:{teamId}` | `{ challengeId, states }` | Cursor awareness updates |
| `admin:submission_feed` | `admin:{hackathonId}` | Submission object | Real-time submission feed (admin only) |
| `admin:team_activity` | `admin:{hackathonId}` | Activity update | Team activity update (admin only) |
