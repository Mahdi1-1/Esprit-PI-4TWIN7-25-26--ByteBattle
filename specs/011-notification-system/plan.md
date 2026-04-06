# Implementation Plan: Real-Time Notification System

**Branch**: `011-notification-system` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-notification-system/spec.md`

## Summary

Evolve the existing basic notification system (discussion-only, 5 types, actor-based model) into a comprehensive centralized notification engine supporting 32 notification types across 7 categories (hackathon, duel, discussion, submission, canvas, achievement, system). The implementation adds: a `NotificationEmitterService` as the single entry point for all modules, a redesigned Prisma `Notification` model with priority/category/actionUrl/entity tracking, a `NotificationPreference` model with per-category toggles and quiet hours, toast notifications for high/critical events, a full notifications page at `/notifications` with category tabs + pagination + bulk actions, and integration hooks into hackathon scheduler, duel service, and discussion service. The existing `NotificationsGateway`, `NotificationsController`, and `NotificationBell` are refactored — not replaced — to maintain backward compatibility during migration.

## Technical Context

**Language/Version**: TypeScript 5.x (backend + frontend)
**Primary Dependencies**: NestJS 10.x (backend), React 18.x + Vite 6.x (frontend), Socket.IO 4.x (real-time), Prisma 6.x (ORM)
**Storage**: MongoDB via Prisma ORM
**Testing**: Jest (backend), Vitest (frontend)
**Target Platform**: Linux server (backend), Modern browsers (frontend)
**Project Type**: Full-stack web application (monorepo: backend + frontend + judge-worker)
**Performance Goals**: WebSocket notification delivery < 500ms, notifications page < 300ms, broadcast to 1000 users < 5s, preference save < 500ms
**Constraints**: Critical notifications override all preferences; quiet hours suppress push only (not persistence); deduplication within 5s window; max 3 visible toasts
**Scale/Scope**: 1000+ concurrent users, 32 notification types, 7 categories, 4 priority levels

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Modular Architecture** | ✅ PASS | `NotificationsModule` already exists as isolated NestJS module. New `NotificationEmitterService` stays within module; other modules import via `exports: [NotificationsService]` (already exported). Frontend: new components in `components/`, new page `pages/NotificationsPage.tsx`, new context `context/NotificationContext.tsx` |
| **II. Naming Conventions** | ✅ PASS | Backend: `notification-emitter.service.ts`, `notification-preference.service.ts`, `create-notification.dto.ts`. Frontend: `NotificationBell.tsx`, `NotificationsPage.tsx`, `useNotifications.ts`, `NotificationContext.tsx`, `notification.types.ts` |
| **III. TypeScript Strictness** | ✅ PASS | All new DTOs use `class-validator` decorators; notification types defined as TypeScript enum; service return types fully typed; no `any` in new code |
| **IV. Testing Discipline** | ✅ PLANNED | Unit tests for `NotificationEmitterService` (emit, deduplicate, quiet hours, broadcast), `NotificationPreferenceService` (CRUD, defaults), controller endpoints. Gateway integration tests for WebSocket push |
| **V. Documentation-First** | ✅ PASS | Full spec at `specs/011-notification-system/spec.md` (8 user stories, 53 acceptance criteria). Feature docs to be added at `docs/features/notification-system.md`. Swagger decorators on all endpoints |
| **VI. Real-Time & WebSocket** | ✅ PASS | Uses existing `@WebSocketGateway({ namespace: '/notifications' })`. Event `notification:new` follows spec naming. Socket.IO client managed via `notificationsService.ts` (existing service pattern) |
| **VII. Internationalization** | ⚠️ PARTIAL | Notification titles/messages generated server-side in English. Frontend UI labels will use hardcoded strings (pre-existing pattern). TODO(I18N): deferred to dedicated i18n sprint |
| **VIII. Game Metrics & Scoring** | ✅ N/A | No scoring or ELO mutations in notification system. Duel notifications read stats but don't modify them |

**Gate Decision**: **PASS** — One partial violation (i18n) is a pre-existing codebase pattern. All 7 other principles fully satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/011-notification-system/
├── plan.md              # This file
├── spec.md              # Feature specification (8 user stories, US1-US8)
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: entity model
├── quickstart.md        # Phase 1: quick-start guide
├── tasks.md             # Phase 2: task breakdown
└── contracts/
    ├── rest-api.md      # REST endpoint contracts (9 endpoints)
    └── websocket-api.md # WebSocket event contracts (2 events)
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   └── schema.prisma                                          # Notification model refactored + NotificationPreference added
├── src/notifications/
│   ├── notifications.module.ts                                # MODIFIED: add new providers + exports
│   ├── notifications.controller.ts                            # MODIFIED: add pagination, archive, preferences endpoints
│   ├── notifications.service.ts                               # MODIFIED: refactor for new model
│   ├── notifications.gateway.ts                               # MODIFIED: add emitBroadcast()
│   ├── notification-emitter.service.ts                        # NEW: centralized emit()
│   ├── notification-preference.service.ts                     # NEW: CRUD for NotificationPreference
│   └── dto/
│       ├── create-notification.dto.ts                         # NEW
│       ├── notification-query.dto.ts                          # NEW
│       └── notification-preference.dto.ts                     # NEW
├── src/hackathons/hackathons.service.ts                       # MODIFIED: emit lifecycle notifs
├── src/duels/duels.service.ts                                 # MODIFIED: emit duel result notifs
└── src/discussions/discussions.service.ts                      # MODIFIED: emit reply/best-answer notifs

frontend/src/
├── types/notification.types.ts                                # NEW
├── context/NotificationContext.tsx                             # NEW
├── components/
│   ├── NotificationBell.tsx                                   # MODIFIED
│   ├── NotificationToast.tsx                                  # NEW
│   └── NotificationToastContainer.tsx                         # NEW
├── pages/
│   ├── NotificationsPage.tsx                                  # NEW
│   └── Settings.tsx                                           # MODIFIED
├── services/notificationsService.ts                           # MODIFIED
└── routes.tsx                                                 # MODIFIED
```

## Existing Code Inventory

| File | Current State | What Changes |
|------|--------------|--------------|
| `schema.prisma` → `Notification` | 5 discussion types, `actorId` FK, `targetId`/`targetType`, `isRead` | Refactor: add category/priority/title/message/actionUrl/entity/sender snapshot fields, remove actorId FK. Add `NotificationPreference` model |
| `notifications.service.ts` | `create()`, `getAll(take:100)`, `getUnreadCount`, `markRead`, `markAllRead`, `enforceMax100` | Add pagination, archive, bulk actions. Remove enforceMax100 |
| `notifications.gateway.ts` | JWT auth, `clientMaps`, `emitToUser()` | Add `emitBroadcast()` |
| `notifications.controller.ts` | 4 endpoints | Add 5 new endpoints (archive, bulk, preferences) |
| `notificationsService.ts` (frontend) | 5 REST + Socket.IO | Add page/archive/bulk/preferences methods |
| `NotificationBell.tsx` | Badge (9+), all-in-dropdown | 99+ badge, 5 recent, "View all" link |
| `routes.tsx` | `NotificationsPlaceholder` | Replace with `NotificationsPage` |
| `Settings.tsx` | Notifications tab placeholder | Category toggles + quiet hours |

## Complexity Tracking

> No constitution violations requiring justification. Architecture stays within the existing notification module.
