# Discussion Forum Feature

## Overview

The Discussion Forum is a full-featured Q&A platform that allows users to create discussions, post comments, vote on content, mark best answers, and receive real-time notifications.

## Features

### 1. Browse & Search Discussions
- View all discussions with pagination
- Filter by category (General, Help, Ideas, Showcases, Bugs, Off-Topic)
- Filter by tags
- Search by keyword (title and content)
- Sort by: trending, newest, most-voted, most-commented, unsolved
- Real-time forum statistics (total posts, active users, solved threads, posts this week)

### 2. Create & Manage Posts
- Create new discussions with title, content, category, and tags
- Edit own posts
- Delete own posts
- Mark posts as solved/unsolved
- View post statistics (views, comments, votes)

### 3. Comments & Nested Replies
- Add comments to discussions
- Reply to comments (max 2 levels deep)
- Edit own comments
- Delete own comments and their replies
- Real-time comment count updates

### 4. Voting System
- Upvote/downvote discussions
- Upvote/downvote comments
- Toggle votes on/off
- Switch between upvote and downvote
- Self-voting prevention

### 5. Best Answer Marking
- Post authors can mark one comment as "Best Answer"
- Marked answer appears highlighted (green border)
- Automatically marks discussion as solved
- Creates notification for the comment author

### 6. Real-Time Notifications
- Receive notifications for:
  - New likes on posts
  - New likes on comments
  - New comments on your posts
  - Replies to your comments
  - Best answer marking
- Bell icon in navbar with unread count badge
- Mark individual or all notifications as read

### 7. My Posts Dashboard
- View all your own posts
- Filter by status: All, Unsolved, Solved
- Quick access to manage your discussions

### 8. Content Moderation
- Flag inappropriate posts or comments
- Auto-hide content with 5+ flags
- Admin moderation capabilities

## API Endpoints

### Discussions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/discussions` | List discussions (pagination, filters, search) |
| GET | `/api/discussions/stats` | Get forum statistics |
| GET | `/api/discussions/tags/popular` | Get top 10 popular tags |
| GET | `/api/discussions/:id` | Get discussion with comments |
| POST | `/api/discussions` | Create new discussion |
| PATCH | `/api/discussions/:id` | Update own discussion |
| DELETE | `/api/discussions/:id` | Delete own discussion |
| POST | `/api/discussions/:id/vote` | Vote on discussion |
| PATCH | `/api/discussions/:id/solve` | Toggle solved status |
| POST | `/api/discussions/:id/flag` | Flag a discussion |
| GET | `/api/discussions/my-posts` | Get current user's posts |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/discussions/:id/comments` | Add comment |
| PATCH | `/api/discussions/comments/:commentId` | Edit own comment |
| DELETE | `/api/discussions/comments/:commentId` | Delete own comment |
| POST | `/api/discussions/comments/:commentId/vote` | Vote on comment |
| PATCH | `/api/discussions/comments/:commentId/best-answer` | Mark/unmark best answer |
| POST | `/api/discussions/comments/:commentId/flag` | Flag a comment |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get all notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |

## Data Model

### Discussion
```prisma
model Discussion {
  id                   String   @id @default(auto()) @map("_id") @db.ObjectId
  title                String
  content              String
  category             String   @default("general")
  authorId             String   @db.ObjectId
  tags                 String[]
  upvotes              String[] @db.ObjectId
  downvotes            String[] @db.ObjectId
  commentCount         Int      @default(0)
  views                Int      @default(0)
  isSolved             Boolean  @default(false)
  bestAnswerCommentId  String?  @db.ObjectId
  flags                String[] @db.ObjectId
  isHidden             Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

### Comment
```prisma
model Comment {
  id              String     @id @default(auto()) @map("_id") @db.ObjectId
  content         String
  authorId        String     @db.ObjectId
  discussionId    String     @db.ObjectId
  parentCommentId String?    @db.ObjectId
  upvotes         String[]   @db.ObjectId
  downvotes       String[]   @db.ObjectId
  isBestAnswer    Boolean    @default(false)
  flags           String[]   @db.ObjectId
  isHidden        Boolean    @default(false)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}
```

### Notification
```prisma
model Notification {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  recipientId String   @db.ObjectId
  actorId     String   @db.ObjectId
  type        String   // "like-post" | "like-comment" | "new-comment" | "reply-comment" | "best-answer"
  targetId    String   @db.ObjectId
  targetType  String   // "discussion" | "comment"
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

## Frontend Components

### DiscussionPage
Main listing page with search, filters, sorting, and pagination.

### DiscussionDetailPage
Full discussion view with comments, voting, and actions.

### NotificationBell
Real-time notification bell with dropdown panel.

### DiscussionService
API client for all discussion-related operations.

### NotificationsService
API client with Socket.IO for real-time notifications.

## Socket.IO Events

### Namespace: `/notifications`

#### Client → Server
- `join` - Join user's notification room (authenticated)

#### Server → Client
- `new-notification` - New notification received
- `notification-read` - Notification marked as read

## Usage Guide

### Creating a Discussion
```typescript
const discussion = await discussionsService.create({
  title: 'How to solve binary tree problems?',
  content: 'I\'m struggling with...',
  tags: ['algorithms', 'trees'],
  category: 'help'
});
```

### Adding a Comment
```typescript
const comment = await discussionsService.addComment(discussionId, {
  content: 'Try using recursion...',
  parentCommentId: undefined // for top-level comment
});
```

### Marking Best Answer
```typescript
const result = await discussionsService.bestAnswer(commentId);
// Automatically marks discussion as solved
```

### Subscribing to Notifications
```typescript
// Connect with JWT token
notificationsService.connect(token);

// Subscribe to new notifications
const unsubscribe = notificationsService.onNewNotification((notification) => {
  console.log('New notification:', notification);
  // Update UI with new notification
});

// Cleanup on unmount
unsubscribe();
notificationsService.disconnect();
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:4001` |

## Dependencies

### Backend
- `@nestjs/common`
- `@nestjs/core`
- `@prisma/client`
- `socket.io`

### Frontend
- `react`
- `socket.io-client`
- `lucide-react`
