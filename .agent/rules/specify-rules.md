# ByteBattle2-officiel Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-27

## Active Technologies
- TypeScript 5.x (backend & frontend) + NestJS 10.x, React 18.x, Prisma 6.x, @monaco-editor/react 4.7.x, Sharp, Multer, bcryptjs, class-validator (005-user-profile-settings)
- MongoDB (via Prisma ORM) + filesystem (`uploads/avatars/`) (005-user-profile-settings)
- TypeScript 5.x on Node.js + NestJS 10.x, Prisma 6.x, Socket.IO 4.x, BullMQ (`@nestjs/bullmq` and `bullmq`), Redis (ioredis) (007-judge-worker-architecture)
- MongoDB (via Prisma) for persistent data, Redis for queues/cache/leaderboard (007-judge-worker-architecture)

- TypeScript 5.x + NestJS 10.x (backend), React 18.x (frontend), Prisma 6.x (ORM) (001-fix-leaderboard-config)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x: Follow standard conventions

## Recent Changes
- 007-judge-worker-architecture: Added TypeScript 5.x on Node.js + NestJS 10.x, Prisma 6.x, Socket.IO 4.x, BullMQ (`@nestjs/bullmq` and `bullmq`), Redis (ioredis)
- 005-user-profile-settings: Added TypeScript 5.x (backend & frontend) + NestJS 10.x, React 18.x, Prisma 6.x, @monaco-editor/react 4.7.x, Sharp, Multer, bcryptjs, class-validator
- 001-fix-leaderboard-config: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
