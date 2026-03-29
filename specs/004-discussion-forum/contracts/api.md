# API Contracts: Discussion Forum

**Date**: 2026-03-25  
**Feature**: 004-discussion-forum

## Discussions API

### POST /api/discussions
Create a new discussion post.

**Auth**: Required (user role)  
**Body**:
```json
{
  "title": "string (max 200 chars, required)",
  "content": "string (max 10,000 chars, required)",
  "category": "string (one of: general, help, algorithms, challenge, showcase, feedback)",
  "tags": ["string"] ,
  "challengeId": "string? (optional ObjectId)"
}
```
**Response 201**: Discussion object with author populated.

---

### GET /api/discussions
List discussions with pagination, search, and filters.

**Auth**: Public  
**Query Params**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| category | string | — | Filter by category |
| tags | string | — | Filter by tags (comma-separated) |
| search | string | — | Full-text search in title + content |
| sort | string | "newest" | One of: newest, oldest, popular, most-voted, most-commented, unsolved |

**Response 200**:
```json
{
  "data": [Discussion],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### GET /api/discussions/stats
Dynamic forum statistics.

**Auth**: Public  
**Response 200**:
```json
{
  "totalPosts": 1247,
  "activeUsers": 389,
  "solvedThreads": 876,
  "thisWeek": 56
}
```

---

### GET /api/discussions/tags/popular
Top 10 tags by post count.

**Auth**: Public  
**Response 200**:
```json
[
  { "tag": "Algorithms", "count": 45 },
  { "tag": "TypeScript", "count": 32 }
]
```

---

### GET /api/discussions/my-posts
Current user's posts with statistics.

**Auth**: Required  
**Query Params**: `status` (optional: "solved" | "unsolved")  
**Response 200**: Same format as GET /api/discussions

---

### GET /api/discussions/:id
Get discussion detail with nested comments.

**Auth**: Public  
**Response 200**: Discussion object with comments nested (parent → children), author populated in both discussion and comments. View count incremented.

---

### PATCH /api/discussions/:id
Update own discussion.

**Auth**: Required (author only)  
**Body**: Partial `{ title?, content?, category?, tags? }`  
**Response 200**: Updated discussion.

---

### DELETE /api/discussions/:id
Delete own discussion and cascade-delete all comments.

**Auth**: Required (author only)  
**Response 200**: `{ deleted: true }`

---

### POST /api/discussions/:id/vote
Vote on a discussion.

**Auth**: Required (non-author)  
**Body**: `{ "type": "upvote" | "downvote" }`  
**Response 200**:
```json
{
  "upvotes": 10,
  "downvotes": 2,
  "userVote": "upvote" | "downvote" | null
}
```

---

### PATCH /api/discussions/:id/solve
Toggle solved status (author only).

**Auth**: Required (author only)  
**Response 200**: `{ isSolved: true | false }`

---

### POST /api/discussions/:id/flag
Flag a discussion for moderation.

**Auth**: Required  
**Response 200**: `{ flagCount: 3, isHidden: false }`

---

## Comments API

### POST /api/discussions/:id/comments
Add a comment (or reply) to a discussion.

**Auth**: Required  
**Body**:
```json
{
  "content": "string (required)",
  "parentCommentId": "string? (ObjectId, optional — for nested replies)"
}
```
**Response 201**: Comment object with author populated.

---

### PATCH /api/discussions/comments/:id
Edit own comment.

**Auth**: Required (author only)  
**Body**: `{ "content": "string" }`  
**Response 200**: Updated comment.

---

### DELETE /api/discussions/comments/:id
Delete own comment and its replies.

**Auth**: Required (author only)  
**Response 200**: `{ deleted: true }`

---

### POST /api/discussions/comments/:id/vote
Vote on a comment.

**Auth**: Required (non-author)  
**Body**: `{ "type": "upvote" | "downvote" }`  
**Response 200**: `{ upvotes, downvotes, userVote }`

---

### PATCH /api/discussions/comments/:id/best-answer
Toggle best answer status (post author only).

**Auth**: Required (post author only)  
**Response 200**: `{ isBestAnswer: true | false }`

---

### POST /api/discussions/comments/:id/flag
Flag a comment for moderation.

**Auth**: Required  
**Response 200**: `{ flagCount, isHidden }`

---

## Notifications API

### GET /api/notifications
Get user's notifications (newest first, max 100).

**Auth**: Required  
**Response 200**:
```json
[
  {
    "id": "...",
    "type": "new-comment",
    "actor": { "id": "...", "username": "alice", "profileImage": "..." },
    "targetId": "...",
    "targetType": "discussion",
    "isRead": false,
    "createdAt": "2026-03-25T..."
  }
]
```

---

### GET /api/notifications/unread-count
Get unread notification count.

**Auth**: Required  
**Response 200**: `{ count: 5 }`

---

### PATCH /api/notifications/:id/read
Mark one notification as read.

**Auth**: Required (recipient only)  
**Response 200**: `{ isRead: true }`

---

### PATCH /api/notifications/read-all
Mark all notifications as read.

**Auth**: Required  
**Response 200**: `{ updated: 12 }`

---

## WebSocket: Notifications Gateway

**Namespace**: `/notifications`  
**Auth**: JWT token via `handshake.auth.token` or `Authorization` header

### Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `new-notification` | Server → Client | `{ id, type, actorUsername, actorProfileImage, targetId, targetType, createdAt }` |
