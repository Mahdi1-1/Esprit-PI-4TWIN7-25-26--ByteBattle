# Data Model & Interfaces: Judge Worker Architecture

## 1. BullMQ Job Payload (`CodeExecutionJob`)

This interface defines the exact data structure passed from the Backend API to the Redis Queue, which the Judge Worker will pull and process.

```typescript
interface CodeExecutionJob {
  submissionId: string;
  userId: string;
  challengeId: string;
  code: string;
  language: string; // 'python' | 'javascript' | 'java' | 'cpp' | 'go' | 'rust'
  tests: {
    input: string;
    expectedOutput: string;
  }[];
  context: 'solo' | 'duel';
  duelId?: string; // Only present if context === 'duel'
}
```

## 2. Redis Key Structures

### Leaderboard (ZSET)
* **Key**: `leaderboard:elo`
* **Type**: Sorted Set (ZSET)
* **Score**: Player ELO (integer)
* **Member**: User ID (string, e.g., `user_123abc`)

### Cache Entries (String/JSON)
* **User Profile**:
  * **Key**: `user:profile:{userId}`
  * **Value**: JSON string of user profile data
  * **TTL**: 600 seconds (10 mins)
* **Challenge Data**:
  * **Key**: `challenge:{challengeId}`
  * **Value**: JSON string of challenge requirements and hints
  * **TTL**: 3600 seconds (1 hr)

## 3. Prisma Schema Updates

The existing `Submission` model needs to be updated to track the background job ID.

```prisma
// schema.prisma

model Submission {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  userId        String   @db.ObjectId
  challengeId   String   @db.ObjectId
  jobId         String?  // NEW: ID of the BullMQ job for tracking
  
  kind          SubmissionKind
  context       SubmissionContext @default(SOLO)
  
  language      String?
  code          String?
  
  // NOTE: verdict begins as 'queued' when async job is created
  verdict       String   @default("queued") // Changed default from pending
  score         Int      @default(0)
  
  // ... other existing fields
}
```

## 4. WebSocket Event Contracts

The `SubmissionsGateway` will emit the following events to the `user:{userId}` room:

**`submission_queued`**
```json
{
  "submissionId": "sub_123",
  "status": "queued"
}
```

**`submission_executing`**
```json
{
  "submissionId": "sub_123",
  "status": "executing",
  "progress": 0
}
```

**`submission_progress`**
```json
{
  "submissionId": "sub_123",
  "progress": 50
}
```

**`submission_completed`**
```json
{
  "submissionId": "sub_123",
  "status": "completed",
  "verdict": "AC",
  "score": 100,
  "testsPassed": 5,
  "testsTotal": 5,
  "timeMs": 45
}
```

**`submission_failed`** (System error, not code error)
```json
{
  "submissionId": "sub_123",
  "status": "failed",
  "error": "Execution timeout after 3 retries"
}
```
