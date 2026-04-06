# REST API Contract: Notification System

**Feature**: 011-notification-system
**Date**: 2026-03-31
**Base URL**: `/api/notifications`
**Auth**: All endpoints require JWT Bearer token (`JwtAuthGuard`)

---

## 1. GET /api/notifications

**Summary**: Get paginated notifications for the current user

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number (1-indexed) |
| `limit` | number | `20` | Items per page (max 50) |
| `category` | string? | — | Filter by category: `hackathon`, `duel`, `discussion`, `submission`, `canvas`, `achievement`, `system` |
| `unreadOnly` | boolean? | `false` | If `true`, only return notifications where `isRead = false` |

**Response 200**:
```json
{
  "data": [
    {
      "id": "6650a1b2c3d4e5f6a7b8c9d0",
      "recipientId": "6650a1b2c3d4e5f6a7b8c9d1",
      "type": "hackathon_starting",
      "category": "hackathon",
      "priority": "high",
      "title": "Hackathon Starting! 🏁",
      "message": "CodeStorm 2026 begins in 30 minutes",
      "actionUrl": "/hackathon/6650a1b2c3d4e5f6a7b8c9d2/lobby",
      "entityId": "6650a1b2c3d4e5f6a7b8c9d2",
      "entityType": "Hackathon",
      "senderId": null,
      "senderName": "ByteBattle",
      "senderPhoto": null,
      "isRead": false,
      "readAt": null,
      "isArchived": false,
      "createdAt": "2026-03-31T14:30:00.000Z"
    }
  ],
  "total": 47,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

---

## 2. GET /api/notifications/unread-count

**Summary**: Get the current user's unread notification count

**Response 200**:
```json
{
  "count": 12
}
```

---

## 3. PATCH /api/notifications/:id/read

**Summary**: Mark a single notification as read

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Notification ObjectId |

**Response 200**:
```json
{
  "id": "6650a1b2c3d4e5f6a7b8c9d0",
  "isRead": true,
  "readAt": "2026-03-31T15:00:00.000Z"
}
```

**Response 404**: `{ "message": "Notification not found" }`
**Response 403**: `{ "message": "Not your notification" }`

---

## 4. PATCH /api/notifications/read-all

**Summary**: Mark all unread notifications as read for the current user

**Response 200**:
```json
{
  "updated": 12
}
```

---

## 5. PATCH /api/notifications/:id/archive

**Summary**: Archive a single notification (soft delete — hidden from default view)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Notification ObjectId |

**Response 200**:
```json
{
  "id": "6650a1b2c3d4e5f6a7b8c9d0",
  "isArchived": true
}
```

**Response 404**: `{ "message": "Notification not found" }`
**Response 403**: `{ "message": "Not your notification" }`

---

## 6. PATCH /api/notifications/bulk/read

**Summary**: Mark multiple notifications as read

**Request Body**:
```json
{
  "ids": ["6650a1b2c3d4e5f6a7b8c9d0", "6650a1b2c3d4e5f6a7b8c9d1"]
}
```

**Response 200**:
```json
{
  "updated": 2
}
```

---

## 7. PATCH /api/notifications/bulk/archive

**Summary**: Archive multiple notifications

**Request Body**:
```json
{
  "ids": ["6650a1b2c3d4e5f6a7b8c9d0", "6650a1b2c3d4e5f6a7b8c9d1"]
}
```

**Response 200**:
```json
{
  "updated": 2
}
```

---

## 8. GET /api/notifications/preferences

**Summary**: Get the current user's notification preferences (returns defaults if no document exists)

**Response 200**:
```json
{
  "hackathon": true,
  "duel": true,
  "discussion": true,
  "submission": true,
  "canvas": true,
  "achievement": true,
  "system": true,
  "inApp": true,
  "email": false,
  "push": false,
  "quietStart": "22:00",
  "quietEnd": "08:00"
}
```

---

## 9. PUT /api/notifications/preferences

**Summary**: Create or update the current user's notification preferences (upsert)

**Request Body**:
```json
{
  "hackathon": true,
  "duel": true,
  "discussion": false,
  "submission": true,
  "canvas": true,
  "achievement": true,
  "system": true,
  "inApp": true,
  "email": false,
  "push": false,
  "quietStart": "22:00",
  "quietEnd": "08:00"
}
```

**Validation**:
- All category booleans are optional (defaults apply if omitted)
- `quietStart` and `quietEnd` must both be present or both null
- `quietStart`/`quietEnd` format: `"HH:mm"` (24-hour, e.g., `"22:00"`, `"08:30"`)

**Response 200**:
```json
{
  "id": "6650a1b2c3d4e5f6a7b8c9d5",
  "userId": "6650a1b2c3d4e5f6a7b8c9d1",
  "hackathon": true,
  "duel": true,
  "discussion": false,
  "submission": true,
  "canvas": true,
  "achievement": true,
  "system": true,
  "inApp": true,
  "email": false,
  "push": false,
  "quietStart": "22:00",
  "quietEnd": "08:00",
  "updatedAt": "2026-03-31T15:30:00.000Z"
}
```

---

## Error Responses (common)

| Status | Body | When |
|--------|------|------|
| 401 | `{ "message": "Unauthorized" }` | Missing or invalid JWT |
| 403 | `{ "message": "Not your notification" }` | Attempting to modify another user's notification |
| 404 | `{ "message": "Notification not found" }` | Invalid notification ID |
| 400 | `{ "message": [...] }` | Validation errors (class-validator) |
