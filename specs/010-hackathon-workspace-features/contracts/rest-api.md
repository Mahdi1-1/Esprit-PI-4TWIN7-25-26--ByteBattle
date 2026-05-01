# REST API Contracts: Hackathon Workspace

**Feature**: 010-hackathon-workspace-features  
**Date**: 2026-03-31

## GET /api/hackathons/:id/challenges

**Description**: Returns the ordered list of hackathon challenges with sequential lock/unlock state for a team.

**Auth**: JWT Bearer token required  
**Controller**: `HackathonsController.getChallenges()`  
**Service**: `HackathonsService.getHackathonChallenges()`

### Request

| Param | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | URL path | ObjectId | Yes | Hackathon ID |
| `teamId` | Query | ObjectId | No | Team ID for sequential unlock logic. If omitted, returns admin view (all unlocked) |

### Response 200 OK

```json
[
  {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "order": 0,
    "label": "A",
    "title": "Two Sum",
    "difficulty": "easy",
    "descriptionMd": "Given an array of integers...",
    "tags": ["array", "hash-table"],
    "constraints": { "time": "2s", "memory": "256MB" },
    "hints": ["Consider using a hash map"],
    "examples": [
      { "input": "[2,7,11,15], target=9", "expectedOutput": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9" }
    ],
    "tests": [
      { "input": "[2,7,11,15]\n9", "expectedOutput": "[0,1]" }
    ],
    "allowedLanguages": ["javascript", "python", "cpp"],
    "category": "algorithms",
    "timeLimitMinutes": 15,
    "locked": false,
    "solved": false,
    "startedAt": "2026-03-31T10:00:00.000Z"
  },
  {
    "id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "order": 1,
    "label": "B",
    "title": "Problem B",
    "difficulty": "medium",
    "descriptionMd": "",
    "tags": [],
    "constraints": null,
    "hints": [],
    "examples": [],
    "tests": [],
    "allowedLanguages": ["javascript", "python"],
    "category": "algorithms",
    "timeLimitMinutes": 25,
    "locked": true,
    "solved": false,
    "startedAt": null
  }
]
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 404 | Hackathon not found | `{ "message": "Hackathon not found" }` |
| 404 | Team not found (if teamId given) | `{ "message": "Team not found" }` |

---

## POST /api/hackathons/:id/teams/:teamId/submit

**Description**: Submit code for judging during a hackathon.

**Auth**: JWT Bearer token required  
**Controller**: `HackathonsController.submitCode()`  
**Service**: `HackathonSubmissionService.submitCode()`

### Request Body

```json
{
  "challengeId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "code": "function twoSum(nums, target) { ... }",
  "language": "javascript"
}
```

### Response 201 Created

```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0e1",
  "hackathonId": "...",
  "teamId": "...",
  "challengeId": "...",
  "userId": "...",
  "code": "...",
  "language": "javascript",
  "verdict": "queued",
  "testsPassed": 0,
  "testsTotal": 5,
  "attemptNumber": 1,
  "penaltyMinutes": 0,
  "isFirstBlood": false,
  "jobId": "bull-job-id",
  "submittedAt": "2026-03-31T10:05:00.000Z"
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Not active/frozen phase | `{ "message": "Submissions only allowed during active or frozen phases" }` |
| 400 | Team disqualified | `{ "message": "Your team has been disqualified" }` |
| 400 | Already solved (Q7) | `{ "message": "This problem is already solved. No re-submissions allowed." }` |
| 400 | Sequential violation (Q1) | `{ "message": "You must solve the previous problems first before submitting to this one." }` |
| 400 | Challenge not in hackathon | `{ "message": "Challenge is not part of this hackathon" }` |
| 400 | Rate limited | `{ "message": "Rate limited. Please wait N seconds before submitting again for this problem." }` |
| 404 | Hackathon not found | `{ "message": "Hackathon not found" }` |
| 404 | Team not found | `{ "message": "Team not found" }` |
| 404 | Challenge not found | `{ "message": "Challenge not found" }` |

---

## GET /api/hackathons/:id/teams/:teamId/messages

**Description**: Get team chat messages with cursor-based pagination. Messages are enriched with sender `username` (Q4).

**Auth**: JWT Bearer token required  
**Controller**: `HackathonsController.getTeamMessages()`  
**Service**: `HackathonChatService.getMessages()`

### Request

| Param | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | URL path | ObjectId | Yes | Hackathon ID |
| `teamId` | URL path | ObjectId | Yes | Team ID |
| `before` | Query | ISO 8601 | No | Cursor: fetch messages before this timestamp |
| `limit` | Query | Int | No | Max messages to return (default: 50) |

### Response 200 OK

```json
[
  {
    "id": "65f1a2b3c4d5e6f7a8b9c0f1",
    "hackathonId": "...",
    "teamId": "...",
    "userId": "65f1a2b3c4d5e6f7a8b9c001",
    "content": "try BFS approach",
    "codeSnippet": null,
    "codeLanguage": null,
    "sentAt": "2026-03-31T10:02:00.000Z",
    "username": "mahdi_dev"
  }
]
```
