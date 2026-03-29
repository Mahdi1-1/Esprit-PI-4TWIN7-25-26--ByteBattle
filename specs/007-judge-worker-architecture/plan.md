# Implementation Plan: Judge Worker Architecture Migration

**Branch**: `007-judge-worker-architecture` | **Date**: 2026-03-27 | **Spec**: [spec.md](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/specs/007-judge-worker-architecture/spec.md)
**Input**: Feature specification from `/specs/007-judge-worker-architecture/spec.md`

## Summary

Migrate the current synchronous, blocking code execution model to an asynchronous, queue-based architecture using Redis and BullMQ. A separate Judge Worker process will execute user code in isolated Docker containers. The architecture will also introduce a Redis-backed ZSET leaderboard for sub-millisecond ranking queries, a Redis caching layer, and real-time WebSocket updates for submission status.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js
**Primary Dependencies**: NestJS 10.x, Prisma 6.x, Socket.IO 4.x, BullMQ (`@nestjs/bullmq` and `bullmq`), Redis (ioredis)
**Storage**: MongoDB (via Prisma) for persistent data, Redis for queues/cache/leaderboard
**Testing**: Jest (Backend), Vitest (Frontend)
**Target Platform**: Scalable backend architecture with separate API and Worker processes
**Project Type**: Web Service + Background Worker
**Performance Goals**: <200ms API response for submissions, <5ms leaderboard queries
**Constraints**: Judge Worker Docker containers must be hard-limited to 256MB RAM and 10s execution. Concurrency must be configurable (default 5).
**Scale/Scope**: Support for 100+ concurrent submissions, extensible language support (6 languages at launch).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Modular Architecture**: Queue and Cache will be distinct NestJS modules. Judge Worker will be a separate application/module.
- [x] **TypeScript Strictness**: Interfaces will be defined for Job payloads, exact return types for evaluation results.
- [x] **Testing Discipline**: Unit tests required for queue service, leaderboard service, and worker processor. (Docker interactions in the SandboxService will be tested via unit tests with a mocked `Dockerode` client to ensure CI/CD reliability).
- [x] **Documentation & Naming**: Kebab-case filenames (`queue.service.ts`), proper Swagger documentation for new endpoints.
- [x] **Real-Time Standards**: Submission updates follow the verb-noun pattern (`submission-queued`, `submission-completed`) and use `@WebSocketGateway`.
- [x] **Game Metrics & Scoring Rules**: Score updates in `JudgeService` MUST use Prisma transactions, strictly adhering to the Win Rate formula.

## Project Structure

### Documentation (this feature)

```text
specs/007-judge-worker-architecture/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── quickstart.md        # Phase 1 output
```

### Source Code

```text
backend/
├── src/
│   ├── cache/                  # Redis caching layer
│   │   ├── cache.module.ts
│   │   └── cache.service.ts
│   ├── queue/                  # BullMQ integration
│   │   ├── queue.module.ts
│   │   └── queue.service.ts
│   ├── leaderboard/            # Redis ZSET additions
│   │   └── redis-leaderboard.service.ts
│   └── submissions/            # Updated submission flow + WebSocket
│       ├── submissions.controller.ts
│       ├── submissions.service.ts
│       └── submissions.gateway.ts

judge-worker/                   # New separate application
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── judge/                  # Processor and execution logic
│   │   ├── judge.module.ts
│   │   ├── judge.processor.ts
│   │   └── judge.service.ts
│   ├── sandbox/                # Moved from backend
│   │   ├── sandbox.module.ts
│   │   └── sandbox.service.ts
│   └── prisma/                 # Database access
│       └── prisma.service.ts
```

**Structure Decision**: A new `judge-worker` application will be created at the root level alongside `backend` and `frontend`. The `backend` core will receive new `queue` and `cache` modules, and the `submissions` module will be refactored to use them.

## Complexity Tracking

No constitution violations. BullMQ and Redis are necessary additions to achieve the non-blocking execution and sub-millisecond leaderboard requirements outlined in the spec.
