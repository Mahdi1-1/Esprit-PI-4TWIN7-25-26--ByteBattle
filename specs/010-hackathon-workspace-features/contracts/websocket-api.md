# WebSocket API Contracts: Hackathon Workspace

**Feature**: 010-hackathon-workspace-features  
**Date**: 2026-03-31  
**Namespace**: `/hackathons`

## Connection

```
Client → ws://localhost:4000/hackathons
Headers: { authorization: "Bearer <jwt>" }
   or
Auth: { token: "Bearer <jwt>" }
```

**On connect**: Server extracts `userId` from JWT, stores `socketId → userId` mapping.  
**On disconnect**: Server removes mapping.

---

## Client → Server Events

### `join_hackathon`

Join the hackathon broadcast room to receive status changes, scoreboard updates, announcements.

```json
{ "hackathonId": "65f1..." }
```

**Room joined**: `hackathon:{hackathonId}`

---

### `join_team`

Join the team room for chat messages and submission verdicts. Optionally join admin room.

```json
{
  "hackathonId": "65f1...",
  "teamId": "65f2...",
  "isAdmin": false
}
```

**Rooms joined**: `team:{teamId}` (always), `admin:{hackathonId}` (if `isAdmin: true`)

---

### `team_message`

Send a chat message to the team.

```json
{
  "hackathonId": "65f1...",
  "teamId": "65f2...",
  "content": "try BFS approach",
  "codeSnippet": "function bfs(graph) { ... }",
  "codeLanguage": "javascript"
}
```

**Server behavior**:
1. Validates sender is a team member via `HackathonChatService.sendMessage()`
2. Persists message to `HackathonMessage` collection
3. Enriches with sender `username` from User model (Q4)
4. Broadcasts `team:message` to `team:{teamId}` room

---

### `anticheat_event`

Report an anti-cheat violation from the client.

```json
{
  "hackathonId": "65f1...",
  "teamId": "65f2...",
  "eventType": "tab_switch",
  "details": { "timestamp": 1711900800000 }
}
```

**Valid `eventType` values**: `tab_switch`, `blur`, `copy_attempt`, `paste_attempt`, `devtools_attempt`

**Server behavior**:
1. Increments `HackathonTeam.anticheatViolations` atomically (Q3)
2. Logs warning: `🚨 ANTICHEAT [eventType] User=X Team=Y Hackathon=Z`
3. Emits `admin:anticheat_alert` to `admin:{hackathonId}` room
4. Emits `anticheat:violation_count` back to the reporting client

---

## Server → Client Events

### `team:message`

Broadcast to `team:{teamId}` when a team member sends a chat message.

```json
{
  "id": "65f3...",
  "hackathonId": "65f1...",
  "teamId": "65f2...",
  "userId": "65f0...",
  "content": "try BFS approach",
  "codeSnippet": null,
  "codeLanguage": null,
  "sentAt": "2026-03-31T10:02:00.000Z",
  "username": "mahdi_dev"
}
```

---

### `submission:verdict`

Broadcast to `team:{teamId}` when a submission verdict is received from the judge worker.

```json
{
  "id": "65f4...",
  "hackathonId": "65f1...",
  "teamId": "65f2...",
  "challengeId": "65f5...",
  "verdict": "AC",
  "testsPassed": 5,
  "testsTotal": 5,
  "timeMs": 120.5,
  "memMb": 32.1,
  "penaltyMinutes": 15,
  "isFirstBlood": true
}
```

**Frontend behavior**: If `verdict === 'AC'`, reload challenges list after 500ms to unlock next problem.

---

### `hackathon:status_change`

Broadcast to `hackathon:{hackathonId}` when admin transitions hackathon status.

```json
{
  "hackathonId": "65f1...",
  "oldStatus": "active",
  "newStatus": "ended"
}
```

**Frontend behavior**: If `newStatus === 'ended'`, navigate to results page.

---

### `admin:anticheat_alert`

Broadcast to `admin:{hackathonId}` room when any participant triggers an anti-cheat violation.

```json
{
  "userId": "65f0...",
  "teamId": "65f2...",
  "eventType": "tab_switch",
  "details": { "timestamp": 1711900800000 },
  "timestamp": "2026-03-31T10:05:00.000Z",
  "totalViolations": 3
}
```

---

### `anticheat:violation_count`

Sent back to the specific client that reported a violation, confirming the persisted count.

```json
{
  "totalViolations": 3
}
```

**Frontend behavior**: Sync `violationsRef.current` and `setViolations()` with the server-confirmed count.

---

## Room Architecture

```
hackathon:{hackathonId}     ← all participants + admins
  ├── team:{teamId_1}       ← team 1 members
  ├── team:{teamId_2}       ← team 2 members
  ├── ...
  └── admin:{hackathonId}   ← admin users only
```

| Room | Events Received |
|------|-----------------|
| `hackathon:{id}` | `hackathon:status_change`, `scoreboard:update`, `announcement:new`, `clarification:response` (broadcast) |
| `team:{teamId}` | `team:message`, `submission:verdict`, `clarification:response` (team-specific), `collab:sync`, `collab:awareness` |
| `admin:{id}` | `admin:anticheat_alert`, `admin:submission_feed`, `admin:team_activity` |
