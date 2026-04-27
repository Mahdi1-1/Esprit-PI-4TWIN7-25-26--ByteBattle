# Tasks: Judge Worker Architecture Migration

**Input**: Design documents from `/specs/007-judge-worker-architecture/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend API**: `backend/src/`
- **Judge Worker**: `judge-worker/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create `judge-worker` NestJS application skeleton at repository root
- [ ] T002 Add `bullmq` and `@nestjs/bullmq` dependencies to both `backend` and `judge-worker`
- [ ] T003 [P] Add Docker sandbox images build script integration to `judge-worker`
- [ ] T004 Copy `.env` configuration template for Redis to both projects

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Move `sandbox.service.ts` and `sandbox.module.ts` from `backend` to `judge-worker`
- [ ] T006 Setup `PrismaModule` and connection in `judge-worker/src/prisma/`
- [ ] T007 Configure `BullModule.forRootAsync` with Redis connection in `backend/src/app.module.ts`
- [ ] T008 Configure `BullModule.forRootAsync` with Redis connection in `judge-worker/src/app.module.ts`
- [ ] T009 Run `npx prisma generate` in `backend` to ensure schema updates for `jobId` are applied

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Asynchronous Code Submission (P1) 🎯 MVP

**Goal**: Submissions are enqueued immediately rather than blocking the HTTP request.

**Independent Test**: API responds with `status: "queued"` immediately upon code submission.

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create Queue queue configuration in `backend/src/queue/queue.module.ts`
- [ ] T011 [P] [US1] Implement `QueueService.addCodeExecutionJob` in `backend/src/queue/queue.service.ts`
- [ ] T012 [US1] Update Prisma schema (`schema.prisma`) to add `jobId` to `Submission` model, and change default verdict to "queued"
- [ ] T013 [US1] Refactor `SubmissionsService.create` to enqueue job instead of awaiting execution dynamically in `backend/src/submissions/submissions.service.ts`
- [ ] T014 [US1] Add REST endpoint `GET /submissions/:id/status` in `backend/src/submissions/submissions.controller.ts`

**Checkpoint**: Backend now enqueues jobs and returns immediately. Jobs accumulate in Redis.

---

## Phase 4: User Story 5 - Isolated Code Execution in Judge Worker (P1)

**Goal**: Separate worker process executes code strictly inside Docker containers with configurable concurrency.

**Independent Test**: Judge Worker pulls a job from Redis, executes it, updates the database, and deletes the job.

### Tests for User Story 5

- [ ] T015 [P] [US5] Unit test for SandboxService simulating Docker response (`jest.mock('dockerode')`) in `judge-worker/src/sandbox/sandbox.service.spec.ts`

### Implementation for User Story 5

- [ ] T016 [P] [US5] Create `JudgeModule` with `bullmq` queue registration in `judge-worker/src/judge/judge.module.ts`
- [ ] T017 [US5] Implement `JudgeService.executeAndEvaluate` calling the Sandbox service in `judge-worker/src/judge/judge.service.ts`
- [ ] T018 [US5] Implement BullMQ `@Processor` in `judge-worker/src/judge/judge.processor.ts` mapping jobs to execution logic
- [ ] T019 [US5] Wire database update functionality inside `judge.service.ts` to set final submission score/verdict
- [ ] T020 [US5] Implement retry logic (attempts=3) and job priority handling (duel > solo) in queue configuration

**Checkpoint**: End-to-end asynchronous submission testing now works via database querying.

---

## Phase 5: User Story 4 - WebSocket Submission Status (P1)

**Goal**: Users receive real-time updates for queued, executing, and completed status.

**Independent Test**: Frontend receives Socket.io events mimicking the submission lifecycle.

### Implementation for User Story 4

- [ ] T021 [P] [US4] Create `SubmissionsGateway` in `backend/src/submissions/submissions.gateway.ts` managing `user:{id}` rooms
- [ ] T022 [US4] Update `QueueService.addCodeExecutionJob` to emit `submission_queued` via gateway
- [ ] T023 [US4] Provide a lightweight REST webhook or Redis pub-sub to allow Judge Worker to trigger events on the Backend API (since worker sits on different process)
- [ ] T024 [US4] Update Judge Worker processor to emit `submission_executing` and `submission_completed` events
- [ ] T025 [US4] Refactor `frontend/src/pages/Problem.tsx` to handle WebSocket state updates (queued, executing, results)

**Checkpoint**: Full real-time UX is complete for standard code execution.

---

## Phase 6: User Story 2 - Real-Time Leaderboard via Redis (P2)

**Goal**: Switch global leaderboard to use Redis ZSET for fast rank queries.

**Independent Test**: ELO updates instantly reflect in ZREVRANK queries.

### Implementation for User Story 2

- [ ] T026 [P] [US2] Create `redis-leaderboard.service.ts` in `backend/src/leaderboard/` to manage ZSET `leaderboard:elo`
- [ ] T027 [US2] Update `leaderboard.controller.ts` to expose fast top 50 endpoint
- [ ] T028 [US2] Write one-time initialization routine to hydrate Redis ZSET from MongoDB `User` collection on startup
- [ ] T029 [US2] Update `JudgeService.updateDuelState` (in worker) and `DuelsService` (backend) to sync ELO changes into Redis ZSET

---

## Phase 7: User Story 3 - Data Caching Layer (P3)

**Goal**: Frequently accessed data is cached to reduce MongoDB load.

**Independent Test**: User profile queries hit Redis instead of MongoDB for 10 minutes.

### Implementation for User Story 3

- [ ] T030 [P] [US3] Create `CacheModule` and `CacheService` in `backend/src/cache/` using `ioredis`
- [ ] T031 [US3] Wrap `UsersService.getProfile` with cache get/set logic
- [ ] T032 [US3] Wrap `ChallengesService.findOne` with cache get/set logic
- [ ] T033 [US3] Add cache invalidation triggers on User profile update and Challenge edit endpoints

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T034 [P] Implement `GET /health` metrics endpoint (FR-013) on Judge Worker exposing queue depth and success rate
- [ ] T035 [P] Verify horizontal scaling (FR-014) logic by testing with two concurrent Judge Worker instances locally
- [ ] T036 Refactor "Run" code mode (non-submission) to use `SubmissionsService.runCode` synchronously as originally planned
- [ ] T037 Perform manual E2E validation of Duel match with asynchronous submission

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational Phase
- **US5 (Phase 4)**: Depends on US1 (queue must exist)
- **US4 (Phase 5)**: Depends on US5 (events hook into worker execution)
- **US2 (Phase 6)**: Independent from Submission execution
- **US3 (Phase 7)**: Independent from Submission execution

### Parallel Opportunities

- Redis Cache (US3) and Redis Leaderboard (US2) can be worked on completely in parallel with the Submission Queue changes.
- Setting up the Judge Worker shell (T016) can be done while the backend queue logic is being wired (T011).

## Implementation Strategy

### MVP First

1. Complete Setup and Foundation.
2. Complete US1 (Backend Queue) and US5 (Judge Worker Process).
3. At this stage, submissions execute silently in background, user refreshes page to see verdict.

### Incremental Delivery

4. Add US4 (WebSockets) to give real-time feedback.
5. Add US2 (Leaderboard) and US3 (Caching) for performance scaling.
