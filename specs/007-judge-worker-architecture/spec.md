# Feature Specification: Judge Worker Architecture Migration

**Feature Branch**: `007-judge-worker-architecture`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: User description: "Migrate from synchronous code execution to asynchronous queue-based architecture with Redis (Queue + Leaderboard ZSET + Cache) and a separate Judge Worker service that executes user code in isolated Docker containers."

## Clarifications

### Session 2026-03-27

- Q: How many code execution jobs should a single Judge Worker process simultaneously? → A: Configurable via environment variable (default 5)
- Q: Which programming languages must the Judge Worker support at launch? → A: Python, JavaScript, Java, C++, Go, Rust (extended set)
- Q: What level of observability should the Judge Worker and queue system provide? → A: Structured logging + basic metrics (queue depth, job duration, success/failure rate) exposed via endpoint
- Q: Should the architecture support running multiple Judge Worker instances in parallel? → A: Yes, multiple instances supported via BullMQ job locking (scale-ready from day one)
- Q: Should duel submissions have higher priority in the queue than solo practice submissions? → A: Yes, duel submissions get higher priority (time-sensitive, two players waiting)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Asynchronous Code Submission (Priority: P1)

A user submits code for a challenge (solo or duel). Instead of waiting for the backend to finish executing the code, the system immediately acknowledges the submission and processes it in the background via a queue. The user sees real-time status updates: queued → executing → progress → completed.

**Why this priority**: This is the core architectural change. Without it, the backend blocks on every code submission, limiting scalability and degrading the experience under concurrent load.

**Independent Test**: Submit code for a challenge. The HTTP response returns immediately with status "queued". WebSocket events arrive showing progress. Final result appears within seconds.

**Acceptance Scenarios**:

1. **Given** a logged-in user on a challenge page, **When** they click "Submit", **Then** the backend responds in under 200ms with a submission ID and status "queued".
2. **Given** a queued submission, **When** the Judge Worker picks it up, **Then** the user receives a WebSocket event "submission_executing".
3. **Given** an executing submission, **When** each test case completes, **Then** the user receives progress updates via WebSocket (e.g., 25%, 50%, 75%, 100%).
4. **Given** all test cases have been evaluated, **When** the Judge Worker finishes, **Then** the user receives a WebSocket event "submission_completed" with verdict, score, and timing.
5. **Given** the Judge Worker encounters an error or timeout, **When** the job fails, **Then** the system retries up to 3 times with exponential backoff, and the user receives a "submission_failed" event if all retries are exhausted.

---

### User Story 2 - Real-Time Leaderboard via Redis (Priority: P2)

Users view a global leaderboard sorted by ELO. Instead of querying and sorting all users from the database on every request, the system maintains a Redis sorted set (ZSET) that provides sub-millisecond ranking queries.

**Why this priority**: Leaderboard access is one of the most frequent queries in a competitive platform. Performance degrades rapidly with user count when using traditional database queries.

**Independent Test**: Open the leaderboard page. The top 50 players load instantly. A user's rank is returned in under 5ms.

**Acceptance Scenarios**:

1. **Given** the leaderboard page, **When** a user loads it, **Then** the top 50 players are returned in under 5ms (server-side).
2. **Given** a user completes a duel, **When** their ELO changes, **Then** the Redis leaderboard is updated automatically and their new rank is immediately reflected.
3. **Given** a user wants to see their own rank, **When** they query their profile, **Then** the system returns their exact rank among all players in under 5ms.
4. **Given** the Redis leaderboard is empty (first startup), **When** the backend starts, **Then** it initializes the leaderboard from the database automatically.

---

### User Story 3 - Data Caching Layer (Priority: P3)

Frequently accessed data (user profiles, challenge details, forum statistics) is cached in Redis to reduce database load. Cache entries expire automatically and are invalidated when data changes.

**Why this priority**: Caching is an optimization layer that reduces database load and speeds up read-heavy operations. It's valuable but not essential for core functionality.

**Independent Test**: Load a user profile twice within 10 minutes. The second request should be served from cache without hitting the database.

**Acceptance Scenarios**:

1. **Given** a user profile that was recently loaded, **When** the same profile is requested again, **Then** it is served from cache (no database query).
2. **Given** a cached user profile, **When** the user updates their profile, **Then** the cache is invalidated and the next request fetches fresh data.
3. **Given** a challenge page, **When** a user loads the challenge, **Then** the challenge data is cached for subsequent requests.
4. **Given** the cache service is unavailable, **When** a request comes in, **Then** the system falls back gracefully to direct database queries.

---

### User Story 4 - WebSocket Submission Status (Priority: P1)

Users receive real-time feedback about their code submission status through WebSocket events. This replaces the current model where the HTTP response itself carries the result.

**Why this priority**: Real-time feedback is essential for the asynchronous submission model. Without it, users have no way to know when their code finishes executing.

**Independent Test**: Submit code, observe WebSocket events in the browser console: queued → executing → progress updates → completed with results.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they connect to the submissions WebSocket namespace, **Then** they are authenticated via JWT and joined to their user-specific room.
2. **Given** a connected user, **When** they submit code, **Then** they receive events: "submission_queued", "submission_executing", "submission_progress" (multiple), "submission_completed".
3. **Given** a user in a duel, **When** their opponent submits code, **Then** both users see real-time updates about the submission progress.
4. **Given** a user disconnects and reconnects, **When** they query a pending submission, **Then** they can retrieve the current status via REST endpoint.

---

### User Story 5 - Isolated Code Execution in Judge Worker (Priority: P1)

User code is executed in isolated Docker containers by a separate Judge Worker service. The worker enforces strict security boundaries: no network access, limited memory, limited CPU, and a hard timeout.

**Why this priority**: Security and isolation are critical. Executing user-submitted code on the same process as the API server is a security risk and a scalability bottleneck.

**Independent Test**: Submit malicious code (e.g., `import os; os.system("rm -rf /")`) — it should be contained within the Docker sandbox and destroyed after execution without affecting the system.

**Acceptance Scenarios**:

1. **Given** user code submitted in Python, JavaScript, Java, C++, Go, or Rust, **When** the Judge Worker processes the job, **Then** it creates a temporary Docker container with the appropriate runtime.
2. **Given** user code that attempts to access the network, **When** executed in the container, **Then** the network call fails (no internet access).
3. **Given** user code that exceeds the memory limit (256 MB), **When** executed, **Then** the container is killed and the verdict is "MLE" (Memory Limit Exceeded).
4. **Given** user code that runs longer than the timeout (10 seconds), **When** executed, **Then** the container is killed and the verdict is "TLE" (Time Limit Exceeded).
5. **Given** a completed execution, **When** the Judge Worker finishes, **Then** the Docker container is destroyed immediately.

---

### Edge Cases

- What happens when Redis is temporarily unavailable? → The system should fall back to direct database operations for submissions and leaderboard queries.
- What happens when the Judge Worker crashes mid-execution? → BullMQ retries the job automatically (up to 3 attempts).
- What happens when multiple submissions come in simultaneously for the same user? → Each submission gets its own job in the queue and is processed independently.
- What happens when a duel submission comes in but the duel has already ended? → The Judge Worker checks duel status before updating and skips if the duel is over.
- What happens when the queue is full? → BullMQ handles backpressure; jobs wait in the queue until a worker is available, with configurable concurrency.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enqueue code submissions as asynchronous jobs instead of executing them synchronously within the API request lifecycle.
- **FR-002**: System MUST provide a separate Judge Worker process that consumes jobs from the queue and executes code in Docker containers, with configurable concurrency (default 5 simultaneous jobs, adjustable via environment variable).
- **FR-003**: System MUST send real-time WebSocket events to users at each stage of submission processing (queued, executing, progress, completed, failed).
- **FR-004**: System MUST maintain a Redis sorted set (ZSET) for leaderboard rankings, updated after each duel or rated submission.
- **FR-005**: System MUST initialize the Redis leaderboard from the database on first startup or when the leaderboard ZSET is empty.
- **FR-006**: System MUST provide a caching layer for frequently accessed data (user profiles, challenges) with configurable TTL and automatic invalidation on writes.
- **FR-007**: System MUST retry failed code execution jobs up to 3 times with exponential backoff before marking the submission as failed.
- **FR-008**: System MUST enforce Docker container resource limits: max 256 MB RAM, max 10 seconds execution time, no network access.
- **FR-009**: System MUST expose a REST endpoint for querying the current status of a submission (for users who reconnect after disconnecting from WebSocket).
- **FR-010**: System MUST support a "Run" mode (quick execution without submission) that continues to work synchronously for fast feedback.
- **FR-011**: System MUST update duel state in Redis when a duel submission completes, so both players see the result in real time.
- **FR-012**: System MUST fall back gracefully to direct database operations if Redis is unavailable.
- **FR-013**: System MUST provide structured logging and expose basic operational metrics (queue depth, average job duration, success/failure rate) via a health/metrics endpoint.
- **FR-014**: System MUST support running multiple Judge Worker instances concurrently, with BullMQ job locking ensuring no two workers process the same job.
- **FR-015**: System MUST assign higher priority to duel submissions over solo submissions in the queue, ensuring time-sensitive competitive matches are processed first.

### Key Entities

- **Job**: Represents a code execution task in the queue. Contains submission ID, user ID, challenge ID, code, language, test cases, and context (solo/duel).
- **Submission**: Extended with `jobId` field linking to the queue job, and `verdict` updated asynchronously by the Judge Worker.
- **Leaderboard Entry**: A Redis ZSET member mapping user ID to ELO score, enabling O(log N) rank queries.
- **Cache Entry**: A Redis key-value pair with TTL, storing serialized JSON of profiles, challenges, and statistics.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Code submission HTTP responses return in under 200ms (non-blocking), compared to the current 2–10 second synchronous execution.
- **SC-002**: Leaderboard queries for top 50 players complete in under 5ms server-side.
- **SC-003**: User rank lookups complete in under 5ms server-side.
- **SC-004**: The system handles 100+ concurrent code submissions without degradation, with results delivered via WebSocket.
- **SC-005**: Failed jobs are retried automatically up to 3 times, with the user notified of the final outcome.
- **SC-006**: Users see real-time progress updates within 500ms of each test case completing.
- **SC-007**: Cached data reduces database queries for profiles and challenges by at least 70%.
- **SC-008**: Malicious user code is fully contained within Docker containers and never affects the host system or other users.

## Assumptions

- Docker is available on the server where the Judge Worker runs (required for sandbox execution).
- Redis is deployed and accessible from both the Backend API and the Judge Worker on the same network.
- The existing `SandboxService` logic (Docker container management, test evaluation) will be reused in the Judge Worker with minimal changes.
- BullMQ (built on top of Redis) is used as the job queue library, compatible with the existing NestJS ecosystem.
- The Backend API and Judge Worker share the same MongoDB database via Prisma.
- The "Run" mode (quick code execution for testing) remains synchronous for fast interactive feedback.
- WebSocket infrastructure (Socket.IO) already exists in the project for duels and will be extended for submission status.
- The Judge Worker is a separate NestJS application running as its own process, not a microservice with its own API.
- Worker concurrency is configurable via environment variable `JUDGE_WORKER_CONCURRENCY` (default: 5). Each concurrent job uses ~256 MB RAM for its Docker container.
- Supported languages at launch: Python, JavaScript, Java, C++, Go, and Rust. Docker images for each runtime must be pre-built and available on the host.
- Observability: structured logging (JSON format) and basic metrics (queue depth, job duration, success/failure rate) exposed via endpoint. Full distributed tracing (OpenTelemetry) is deferred to a future iteration.
- Horizontal scaling: the Judge Worker supports multiple instances out of the box via BullMQ's built-in job locking. No additional coordination layer is needed.
- Job priority: duel submissions are enqueued with higher priority than solo submissions to minimize wait time during real-time competitive matches.

