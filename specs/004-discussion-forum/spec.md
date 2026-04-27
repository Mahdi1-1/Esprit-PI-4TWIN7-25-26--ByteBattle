# Feature Specification: Discussion Forum

**Feature Branch**: `004-discussion-forum`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Implement full backend logic and connect the existing frontend of ByteBattle2's Discussion Forum. The frontend page already exists at /discussion with categories, popular tags, search bar, and NEW POST button. Modify the frontend as needed to connect everything."

## Clarifications

### Session 2026-03-25

- Q: Should the forum enforce rate limits on user actions (post creation, commenting, voting)? → A: Yes — basic rate limits: max 5 posts/hour, 30 comments/hour, 60 votes/hour per user.
- Q: Should the forum include content moderation? → A: Yes — both community flagging (users report content; auto-hide after N reports pending review) and admin tools (admins can delete/hide any post or comment).
- Q: How long should notifications be retained? → A: Keep last 100 notifications per user; oldest beyond that are auto-deleted.
- Q: What is the maximum length for post content? → A: 10,000 characters (~2-3 pages of detailed technical content).
- Q: How should concurrent edit conflicts be handled? → A: Last write wins — the most recent save overwrites without warning.

## User Scenarios & Testing

### User Story 1 — Browse & Search Posts (Priority: P1)

Users land on the discussion page and see a list of real posts fetched from the database. They can search by keyword, filter by category or tag, sort by trending/newest/most-voted, and paginate through results. Forum statistics (total posts, active users, solved threads, posts this week) are calculated dynamically.

**Why this priority**: This is the foundational read experience — the page must display real data before any write operations are useful.

**Independent Test**: Navigate to `/discussion` → see posts loaded from API, search for a keyword → results update, click a category → posts filter, click a tag → posts filter, verify stats show real numbers from the database.

**Acceptance Scenarios**:

1. **Given** posts exist in the system, **When** a user visits the discussion page, **Then** they see a paginated list of posts (20 per page) with title, author, vote count, view count, comment count, tags, category, and solved status.
2. **Given** 3 posts contain the word "recursion" in title or content, **When** a user types "recursion" in the search bar, **Then** exactly those 3 posts appear.
3. **Given** posts exist in categories "Help" and "Algorithms", **When** user clicks "Help" in the sidebar, **Then** only Help posts are shown.
4. **Given** posts exist with various tags, **When** user clicks "Dynamic Programming" in Popular Tags, **Then** only posts tagged "Dynamic Programming" are shown.
5. **Given** 100 posts exist, **When** user visits the page, **Then** stats bar shows: Total Posts = 100, Active Users = users who posted in last 7 days, Solved Threads = posts marked solved, This Week = posts created in the current week.

---

### User Story 2 — Create, Edit & Delete Posts (Priority: P1)

Users can create new discussion posts via a modal/form with title, content (supporting rich text formatting), category selection, and tag input (1-5 tags with autocomplete from existing tags). Authors can edit or delete their own posts. Authors can mark their own post as "Solved".

**Why this priority**: Without post creation, the forum has no user-generated content.

**Independent Test**: Click "New Post" → fill in the form → submit → see the post in the list. Navigate to your own post → click Edit → change the title → save → verify updated. Click Delete → confirm → post disappears. Click "Mark as Solved" on your own post → solved badge appears.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they click "New Post" and submit a valid form (title, content, 1 category, 1-5 tags), **Then** the post appears at the top of the list.
2. **Given** a post authored by the current user, **When** they click Edit and change the title, **Then** the title updates.
3. **Given** a post authored by the current user, **When** they click Delete and confirm, **Then** the post and all its comments are removed.
4. **Given** an unsolved post authored by the current user, **When** they click "Mark as Solved", **Then** the post shows a green "Solved" badge.
5. **Given** a post authored by another user, **When** the current user views it, **Then** Edit/Delete/Solve buttons are not visible.

---

### User Story 3 — Vote on Posts (Priority: P1)

Users can upvote or downvote any post (except their own). Each user gets exactly 1 vote per post. They can toggle their vote off or switch between up/down. The net score (upvotes − downvotes) is displayed.

**Why this priority**: Voting is core engagement and drives content ranking.

**Independent Test**: On any post card, click the upvote arrow → net score increases by 1, arrow turns green. Click again → vote removed, score decreases. Click downvote → score decreases, arrow turns red. Try voting on your own post → voting is disabled/prevented.

**Acceptance Scenarios**:

1. **Given** a post with 5 upvotes and 2 downvotes, **When** user views it, **Then** the displayed score is 3.
2. **Given** a user who has not voted, **When** they click upvote, **Then** the score increments by 1 and the upvote button shows as active (green).
3. **Given** a user who already upvoted, **When** they click upvote again, **Then** the vote is removed and score decrements by 1.
4. **Given** a user who upvoted, **When** they click downvote, **Then** the upvote is removed and a downvote is added (net change: −2).
5. **Given** a user viewing their own post, **When** they try to vote, **Then** the vote buttons are disabled or not clickable.

---

### User Story 4 — View Post Detail with Comments & Replies (Priority: P1)

Users can click on a post to see its full content, all comments (sorted by most recent/oldest/most-liked), and nested replies (max 2 levels deep). They can add comments, reply to specific comments (with @username tag), edit/delete their own comments, and vote on comments.

**Why this priority**: Comments are the primary interaction mechanism for discussions.

**Independent Test**: Click a post → see full content + comments from API. Type a comment → submit → it appears. Click Reply on a comment → type → submit → reply appears indented below the parent. Vote on a comment → score updates. Edit/Delete own comment → works.

**Acceptance Scenarios**:

1. **Given** a post with 5 comments (3 top-level, 2 nested), **When** user clicks the post, **Then** all 5 comments are displayed with replies indented under their parents.
2. **Given** a logged-in user on the post detail page, **When** they type a comment and click Submit, **Then** the comment appears and the comment count increments.
3. **Given** a top-level comment, **When** user clicks Reply, **Then** a reply input appears with "@username " pre-filled, and the submitted reply appears indented beneath the parent.
4. **Given** a nested reply on a comment, **When** user tries to reply to the nested reply, **Then** the reply button is not available (max 2 levels).
5. **Given** a comment authored by the current user, **When** they click Edit/Delete, **Then** the comment is updated/removed.
6. **Given** a comment authored by another user, **When** the current user votes on it, **Then** the vote score updates (same vote logic as posts).

---

### User Story 5 — "Best Answer" Marking (Priority: P2)

The post author can mark one comment as the "Best Answer". This comment gets highlighted visually and appears at the top of the comments list. Only the post author can mark/unmark best answer.

**Why this priority**: Adds quality signal for other users browsing questions.

**Independent Test**: On your own post, click "Best Answer" on a comment → it moves to the top and gets a green highlight. Click again to unmark.

**Acceptance Scenarios**:

1. **Given** a post with 3 comments, **When** the post author clicks "Best Answer" on comment #2, **Then** comment #2 gets a green badge and moves to the top of the list.
2. **Given** a comment marked as best answer, **When** the post author clicks "Unmark Best Answer", **Then** the badge is removed and the comment returns to its normal position.
3. **Given** a user who is NOT the post author, **When** they view comments, **Then** the "Mark as Best Answer" button is not visible.

---

### User Story 6 — Real-Time Notifications (Priority: P2)

Users receive real-time notifications when someone interacts with their content: likes on their posts/comments, new comments on their posts, replies to their comments, their comment marked as Best Answer. Notifications appear via a bell icon in the navbar with an unread count badge. Users can view, mark as read, or mark all as read.

**Why this priority**: Notifications drive re-engagement and real-time awareness.

**Independent Test**: User A creates a post. User B comments on it. User A sees a notification badge on the bell icon → clicks it → sees "User B commented on your post" → marks as read → badge disappears.

**Acceptance Scenarios**:

1. **Given** User A has a post, **When** User B comments on it, **Then** User A sees a notification in real-time (within 2 seconds) with a badge counter on the bell icon.
2. **Given** 3 unread notifications, **When** the user clicks the bell icon, **Then** a dropdown shows all 3 notifications with distinct icons (👍 like, 💬 comment, ↩️ reply, ✅ best answer).
3. **Given** an unread notification, **When** the user clicks "Mark as Read", **Then** the badge counter decrements by 1.
4. **Given** multiple unread notifications, **When** the user clicks "Mark All as Read", **Then** all notifications are marked as read and the badge disappears.

---

### User Story 7 — "My Posts" Dashboard (Priority: P3)

Users can view all their own posts in a dedicated dashboard with statistics (likes, comments, views per post), filter by solved/unsolved status, and access quick edit/delete actions.

**Why this priority**: Personal analytics and content management — nice but not essential for core forum function.

**Independent Test**: Navigate to "My Posts" → see all posts authored by the current user with real stats. Filter by "Unsolved" → only unsolved posts show. Click Edit → navigate to edit form.

**Acceptance Scenarios**:

1. **Given** a user with 5 posts, **When** they navigate to "My Posts", **Then** all 5 posts are displayed with individual like count, comment count, and view count.
2. **Given** 3 solved and 2 unsolved posts, **When** user filters by "Unsolved", **Then** only the 2 unsolved posts appear.
3. **Given** a post in "My Posts", **When** user clicks Edit, **Then** they can modify the post title, content, category, and tags.

---

### Edge Cases

- What happens when a user tries to create a post with no tags? → Rejected: minimum 1 tag required.
- What happens when a user tries to add more than 5 tags? → Rejected: maximum 5 tags enforced.
- What happens when a user deletes a post that has comments? → All comments and replies are cascade-deleted.
- What happens when a user deletes a comment that has replies? → All nested replies are also deleted, comment count decremented accordingly.
- How does the system handle concurrent votes on the same post? → Last write wins; the vote arrays ensure atomicity per user.
- What if a user opens 2 tabs and votes differently? → The API enforces 1 vote per user via array membership checks.
- What happens when searching for an empty string? → All posts are returned (no filter applied).
- What if the category filter and tag filter are applied simultaneously? → Results must match BOTH filters (AND logic).
- What happens when a user exceeds rate limits? → The action is rejected with a clear error message indicating how long to wait before retrying.
- What happens when a post/comment receives enough flags? → It is auto-hidden from public view and queued for admin review. The author is notified.
- What happens when two sessions edit the same post simultaneously? → Last write wins; the most recent save overwrites without conflict detection.

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to create posts with title (max 200 chars), content (rich text, max 10,000 chars), exactly 1 category, and 1-5 tags.
- **FR-002**: System MUST allow post authors to edit their own post's title, content, category, and tags.
- **FR-003**: System MUST allow post authors to delete their own post and cascade-delete all associated comments.
- **FR-004**: System MUST allow post authors to toggle a "Solved" status on their posts.
- **FR-005**: System MUST display net vote score (upvotes − downvotes) on each post and comment.
- **FR-006**: System MUST allow 1 vote per user per post/comment (upvote, downvote, toggle off, or switch).
- **FR-007**: System MUST prevent users from voting on their own posts or comments.
- **FR-008**: System MUST allow authenticated users to add comments (replies) to posts.
- **FR-009**: System MUST allow nested replies up to 2 levels deep (post → comment → reply, no further nesting).
- **FR-010**: System MUST auto-prepend "@username" when replying to a specific comment.
- **FR-011**: System MUST allow the post author to mark 1 comment as "Best Answer" and unmark it.
- **FR-012**: System MUST support filtering posts by category.
- **FR-013**: System MUST support filtering posts by tag.
- **FR-014**: System MUST support full-text search in post titles and content.
- **FR-015**: System MUST support sorting posts by: newest, oldest, most-voted, most-commented, unsolved.
- **FR-016**: System MUST paginate posts at 20 per page.
- **FR-017**: System MUST calculate Popular Tags dynamically (top 10 tags by post count).
- **FR-018**: System MUST calculate forum statistics dynamically: total posts, active users (7 days), solved threads, new posts this week.
- **FR-019**: System MUST send real-time notifications for: likes on own posts/comments, new comments on own posts, replies to own comments, best answer marking.
- **FR-020**: System MUST display a bell icon with unread count badge in the navbar.
- **FR-021**: System MUST allow marking individual or all notifications as read.
- **FR-022**: System MUST provide a "My Posts" dashboard showing the current user's posts with statistics.
- **FR-023**: System MUST increment view count when a post detail page is loaded.
- **FR-024**: System MUST enforce rate limits per user: max 5 posts/hour, 30 comments/hour, 60 votes/hour. Exceeding a limit rejects the action with a clear retry-after message.
- **FR-025**: System MUST allow authenticated users to flag/report posts and comments for inappropriate content (1 flag per user per item).
- **FR-026**: System MUST auto-hide a post or comment from public view after it receives a configurable number of flags (default: 5), pending admin review.
- **FR-027**: System MUST allow admin users to delete or hide any post or comment regardless of authorship.
- **FR-028**: System MUST retain a maximum of 100 notifications per user. When a new notification is created and the user already has 100, the oldest notification is automatically deleted.

### Key Entities

- **Discussion (Post)**: Represents a forum post. Key attributes: title, content (rich text), category, tags (1-5), author, upvote/downvote tracking, view count, comment count, solved status, best-answer comment reference.
- **Comment**: Represents a comment or reply on a post. Key attributes: content, author, parent discussion, optional parent comment (for nesting), upvote/downvote tracking, best-answer flag.
- **Notification**: Represents an in-app notification. Key attributes: recipient, actor (who triggered it), type (like/comment/reply/best-answer), target reference (which post or comment), read status, timestamp. Capped at 100 per user.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create, view, and interact with posts and comments within the existing discussion page without navigating away from the platform.
- **SC-002**: Forum statistics on the discussion page reflect real database values and update when posts are created/deleted/marked as solved.
- **SC-003**: Search results appear within 1 second of the user stopping typing.
- **SC-004**: Vote changes are reflected immediately in the UI and persisted reliably.
- **SC-005**: Notifications for interactions (likes, comments, replies) are delivered to the recipient within 3 seconds.
- **SC-006**: The notification bell shows an accurate unread count at all times.
- **SC-007**: All 7 categories from the existing sidebar correctly filter posts when clicked.
- **SC-008**: Popular Tags section shows the top 10 most-used tags calculated from actual usage data.

## Assumptions

- The existing authentication system is reused for all write operations — only logged-in users can create, edit, delete, or vote.
- The existing real-time communication infrastructure is reused for notification delivery.
- The Discussion data model currently lacks a `category` field (only tags exist) — a category field must be added.
- The Discussion data model currently lacks a `solved` status field — the frontend renders it but it always defaults to false.
- A new Notification data entity must be created (none exists currently).
- The frontend discussion pages already exist and are partially wired — they will be updated in-place, not rebuilt from scratch.
- Post content supports rich text formatting; rendering is handled on the client.
- The "My Posts" feature will be a filtered view within the existing discussion page, not a separate standalone page.
- Search input is debounced (300ms delay) to avoid excessive requests while the user types.
