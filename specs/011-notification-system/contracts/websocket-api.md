# WebSocket API Contract: Notification System

**Feature**: 011-notification-system
**Date**: 2026-03-31
**Namespace**: `/notifications`
**Transport**: Socket.IO 4.x
**Auth**: JWT token via `handshake.auth.token` or `handshake.headers.authorization`

---

## Connection

### Client → Server: Connect

```typescript
import { io } from 'socket.io-client';

const socket = io(`${API_URL}/notifications`, {
  auth: { token: jwtToken },
  transports: ['websocket', 'polling'],
});
```

**On successful connection**:
- Server adds client to user-specific tracking map (`clientMaps.set(userId, [socketId])`)
- Server logs: `Client connected to /notifications: {socketId} (User: {userId})`

**On auth failure**:
- Server disconnects the client
- Server logs: `WS Connection error for {socketId}: {errorMessage}`

---

## Server → Client Events

### Event: `notification:new`

**Description**: Pushed to a specific user when a new notification is created for them. Only sent if:
1. User has the notification category enabled in preferences
2. Priority is `critical` (always sent) OR current time is outside quiet hours
3. User has at least one active WebSocket connection

**Payload**:
```json
{
  "id": "6650a1b2c3d4e5f6a7b8c9d0",
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
  "createdAt": "2026-03-31T14:30:00.000Z"
}
```

**Frontend handling**:
```typescript
socket.on('notification:new', (notification: Notification) => {
  // 1. Add to notifications state
  setNotifications(prev => [notification, ...prev]);
  
  // 2. Increment unread count
  setUnreadCount(prev => prev + 1);
  
  // 3. Show toast if high or critical priority
  if (notification.priority === 'high' || notification.priority === 'critical') {
    addToast(notification);
  }
});
```

**Delivery semantics**:
- **Unicast**: Sent to all socket connections of the target user (supports multi-tab)
- **Broadcast**: For `system_announcement` type, emitted to ALL connected sockets in the `/notifications` namespace via `server.emit()`
- **At-most-once**: No retry or ack mechanism. Missed notifications are available via REST `GET /api/notifications`

---

### Event: `notification:count-update`

**Description**: Pushed to a specific user when their unread count changes due to an external action (e.g., admin bulk-marking notifications, or another tab marking all as read). This is a lightweight sync event.

**Payload**:
```json
{
  "unreadCount": 5
}
```

**Frontend handling**:
```typescript
socket.on('notification:count-update', (data: { unreadCount: number }) => {
  setUnreadCount(data.unreadCount);
});
```

**When emitted**:
- After `markAllRead()` completes (syncs other tabs)
- After `bulkMarkRead()` completes
- After archiving notifications that were unread

---

## Reconnection Behavior

**Client-side**:
- Socket.IO auto-reconnect is enabled by default
- On reconnect, client MUST call `GET /api/notifications/unread-count` to sync badge state
- Notifications received during disconnection are NOT replayed — they are available via REST

**Implementation**:
```typescript
socket.on('connect', () => {
  // Re-sync unread count on reconnect
  notificationsService.getUnreadCount().then(count => {
    setUnreadCount(count);
  });
});
```

---

## Migration from Current Events

| Current Event | New Event | Notes |
|--------------|-----------|-------|
| `new-notification` | `notification:new` | Event name changed to follow `namespace:action` convention |

**Backward compatibility**: The `new-notification` event is REMOVED. Frontend `notificationsService.ts` must be updated to listen for `notification:new` instead.
