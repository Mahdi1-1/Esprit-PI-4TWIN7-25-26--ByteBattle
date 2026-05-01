# Quickstart: Judge Worker Architecture

The Judge Worker migration introduces asynchronous code execution and Redis-backed state to `ByteBattle2`. Development now requires running Redis and two NestJS processes.

## 1. Prerequisites

You must have **Redis** and **Docker** running locally.

### Start local Redis
```bash
# If using Docker
docker run -d --name redis-bb2 -p 6379:6379 redis:alpine
```

### Build Sandbox Images
The Judge Worker needs the language Docker images to execute code.
```bash
# From repository root
cd backend/src/sandbox/scripts
./build-images.sh
```

## 2. Environment Variables

Ensure BOTH `.env` files (for `backend` and `judge-worker`) contain the Redis configuration:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Judge Worker specific (in judge-worker/.env)
JUDGE_WORKER_CONCURRENCY=5
```

## 3. Running the Stack

You now need to run two applications during development to test code submissions:

### Terminal 1: Backend API
```bash
cd backend
pnpm install
pnpm run start:dev
```

### Terminal 2: Judge Worker
```bash
cd judge-worker
pnpm install
pnpm run start:dev
```

### Terminal 3: Frontend
```bash
cd frontend
pnpm install
pnpm run dev
```

## 4. Verification

1. Log into the local application.
2. Go to a Challenge and submit code.
3. Observe Terminal 1 (Backend API): It instantly queues the job and returns HTTP 201.
4. Observe Terminal 2 (Judge Worker): It picks up the job, runs it in Docker, and completes.
5. Observe Frontend: The UI updates perfectly via WebSocket events (`submission_queued` → `submission_executing` → `submission_completed`).