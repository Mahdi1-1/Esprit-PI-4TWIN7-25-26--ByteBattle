# Implementation Plan: Hackathon Workspace — Sequential Problems, Anti-Cheat, Chat & Difficulty Timers

**Branch**: `007-judge-worker-architecture` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-hackathon-workspace-features/spec.md`

## Summary

Implement a full hackathon workspace experience with 5 core features: (1) full problem statement display with Markdown, examples, constraints, and hints; (2) sequential problem unlock (solve A → unlock B); (3) difficulty-based per-problem timers (easy=15min, medium=25min, hard=40min) synchronized team-wide via backend; (4) 6-measure anti-cheat system with server-side violation persistence and admin real-time alerts; (5) working team chat via WebSocket with REST history and username enrichment. All features are implemented across the NestJS backend (service + gateway + controller) and the React frontend (workspace page + socket hooks).

## Technical Context

**Language/Version**: TypeScript 5.x (backend + frontend)  
**Primary Dependencies**: NestJS 10.x (backend), React 18.x + Vite 6.x (frontend), Socket.IO 4.x (real-time), Prisma 6.x (ORM)  
**Storage**: MongoDB via Prisma ORM  
**Testing**: Jest (backend), Vitest (frontend) — TODO(TEST_FRAMEWORK): not yet fully configured  
**Target Platform**: Linux server (backend), Modern browsers (frontend)  
**Project Type**: Full-stack web application (monorepo: backend + frontend + judge-worker)  
**Performance Goals**: WebSocket message delivery < 1s, challenge list API < 200ms, anti-cheat event logging < 100ms  
**Constraints**: All hackathon state changes are server-authoritative; anti-cheat is client-side + server-logged (not tamper-proof); timers are informational only (hackathon `endTime` is the hard deadline)  
**Scale/Scope**: 50 concurrent teams, 200 concurrent users per hackathon

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Modular Architecture** | ✅ PASS | All changes contained within `hackathons/` NestJS module (service, gateway, controller, chat service) and frontend `pages/`, `services/`, `hooks/` directories |
| **II. Naming Conventions** | ✅ PASS | Backend: `kebab-case` files (`hackathon-chat.service.ts`), `PascalCase` classes. Frontend: `PascalCase` components (`HackathonWorkspace.tsx`), `camelCase` hooks (`useHackathonSocket.ts`) |
| **III. TypeScript Strictness** | ⚠️ PARTIAL | Some `any` types in DTOs and WebSocket payloads. Acceptable for gateway event data — typed where critical (service methods, Prisma queries) |
| **IV. Testing Discipline** | ❌ VIOLATION | No unit tests added for new service methods. Justified: feature already implemented + manually tested; automated tests tracked for resolution in tasks phase |
| **V. Documentation-First** | ✅ PASS | Full spec in `specs/010-hackathon-workspace-features/spec.md` with 5 user stories, 40+ acceptance scenarios, technical design |
| **VI. Real-Time & WebSocket** | ✅ PASS | Gateway uses `@WebSocketGateway` with namespace `/hackathons`; events follow conventions; Socket.IO managed via `useHackathonSocket` hook |
| **VII. Internationalization** | ⚠️ PARTIAL | Hardcoded English strings in workspace UI. Not blocking — i18n keys deferred (pre-existing pattern) |
| **VIII. Game Metrics & Scoring** | ✅ PASS | Scoreboard uses atomic Prisma queries; penalty computation deterministic; violations use `{ increment: 1 }` for atomicity |

**Gate Decision**: **PASS** — Two partial violations (TypeScript `any`, i18n) are pre-existing patterns. Testing violation resolved (57 tests added 2026-03-31).

## Project Structure

### Documentation (this feature)

```text
specs/010-hackathon-workspace-features/
├── plan.md              # This file
├── spec.md              # Feature specification (5 user stories, WS1-WS5)
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: entity model
├── quickstart.md        # Phase 1: quick-start guide
├── tasks.md             # Phase 2: implementation task breakdown (55 tasks, all ✅)
└── contracts/           # Phase 1: API contracts
    ├── rest-api.md      # REST endpoint contracts
    └── websocket-api.md # WebSocket event contracts
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   └── schema.prisma                                    # HackathonTeam: +anticheatViolations, +problemStartTimes
├── src/hackathons/
│   ├── hackathons.service.ts                            # getHackathonChallenges() — sequential unlock + team-wide timer
│   ├── hackathons.service.getHackathonChallenges.spec.ts # ✅ 28 tests — WS2/WS3/Q5 coverage
│   ├── hackathon-submission.service.ts                  # submitCode() — Q1 sequential enforcement + Q7 read-only guard
│   ├── hackathon-submission.service.spec.ts             # ✅ 17 tests — Q1/Q7/T025/rate-limit coverage
│   ├── hackathon-chat.service.ts                        # sendMessage/getMessages — Q4 username enrichment
│   ├── hackathons.gateway.ts                            # Q3 anticheat persistence + PrismaService injection
│   ├── hackathons.gateway.spec.ts                       # ✅ 12 tests — handleAnticheatEvent() coverage
│   └── hackathons.controller.ts                         # GET /hackathons/:id/challenges?teamId= endpoint

frontend/
├── src/pages/
│   └── HackathonWorkspace.tsx                           # Full workspace: 3-panel, anti-cheat, chat, timer, read-only solved
│                                                        # TODO(i18n): hardcoded EN strings — Constitution VII debt
│                                                        # TODO(WS_NAMING): snake_case events — Constitution VI debt
├── src/services/
│   └── hackathonsService.ts                             # getHackathonChallenges() API method
└── src/hooks/
    └── useHackathonSocket.ts                            # WebSocket hook (existing, consumed by workspace)
```

**Structure Decision**: Web application — backend + frontend in monorepo. No new modules or directories created; all changes are additions to the existing `hackathons` module.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| i18n deferred (`TODO(i18n)`) | Feature fully implemented; i18n is pre-existing project-wide debt | Adding `useTranslation` to 12+ strings is a mechanical refactor tracked separately |
| WS event naming (`TODO(WS_NAMING)`) | `team_message`/`anticheat_event` match existing gateway conventions | Renaming to kebab-case is a breaking change requiring coordinated BE+FE deploy |
| `any` in gateway payloads | Socket.IO event data varies per event type | Full DTO validation on every WS event was considered but rejected for performance |
