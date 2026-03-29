# Tasks: Fix & Configure Leaderboard

**Input**: Design documents from `/specs/001-fix-leaderboard-config/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/leaderboard-api.md, quickstart.md

**Tests**: No test framework is currently configured. Tests are deferred until Jest/Vitest are set up.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/prisma/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema changes and constants that all user stories depend on

- [ ] T001 Add `player1Language` and `player2Language` optional String fields to the `Duel` model in `backend/prisma/schema.prisma`
- [ ] T002 Run `npx prisma generate` in `backend/` to regenerate Prisma client with new Duel fields
- [ ] T003 [P] Create scoring constants file `backend/src/duels/duels.constants.ts` with named constants: `ELO_WIN_GAIN = 25`, `ELO_LOSS_PENALTY = 15`, `XP_WIN = 100`, `XP_LOSS = 25`, `XP_DRAW = 50`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Refactor `endDuel()` to use atomic transactions and persist language — MUST be complete before leaderboard changes

**⚠️ CRITICAL**: Leaderboard data depends on correct duel completion flow

- [ ] T004 Refactor `updatePlayerStats()` in `backend/src/duels/duels.service.ts` to return a Prisma update operation object instead of executing it directly — import constants from `duels.constants.ts`
- [ ] T005 Refactor `endDuel()` in `backend/src/duels/duels.service.ts` to wrap duel update + both player stat updates in a single `prisma.$transaction([...])` call — include `player1Language` and `player2Language` from Redis state in the duel update data

**Checkpoint**: Duel completion now uses atomic transactions and persists language data. Verify via Prisma Studio that completed duels have `player1Language`/`player2Language` populated.

---

## Phase 3: User Story 1 — Correct Score & Win Rate Display (Priority: P1) 🎯 MVP

**Goal**: The leaderboard displays accurate wins, losses, and Win Rate for every player using the canonical formula `(Won / (Won + Lost)) * 100`.

**Independent Test**: Load `http://localhost:3000/leaderboard`, verify wins/losses/Win Rate match Prisma Studio values for at least 2 users.

### Implementation for User Story 1

- [ ] T006 [US1] Update `getGlobal()` in `backend/src/leaderboard/leaderboard.service.ts` — add `duelsWon`, `duelsLost`, `duelsTotal` to the `select` clause and compute `winRate` for each user using the formula `(duelsWon / (duelsWon + duelsLost)) * 100` (return `0.0` when denominator is 0). Round to 1 decimal place.
- [ ] T007 [US1] Add `winRate` sort option in `getGlobal()` in `backend/src/leaderboard/leaderboard.service.ts` — when `sort=winRate`, sort in-memory by computed `winRate` descending after fetching users
- [ ] T008 [US1] Update `getGlobal()` Swagger decorators in `backend/src/leaderboard/leaderboard.controller.ts` — add `winRate` to the `sort` description: `'elo|xp|level|winRate'`
- [ ] T009 [US1] Fix field mapping in `frontend/src/pages/Leaderboard.tsx` — replace `u.wins` → `u.duelsWon`, `u.losses` → `u.duelsLost` in the `fetchLeaderboard` effect, and use `u.winRate` from API instead of client-side computation
- [ ] T010 [US1] Fix Win Rate display in the table in `frontend/src/pages/Leaderboard.tsx` — replace `Math.round((entry.wins / (entry.wins + entry.losses)) * 100)` with `entry.winRate.toFixed(1)` (already computed by API), add division-by-zero guard in `PodiumCard` component
- [ ] T011 [US1] Update `LeaderboardEntry` TypeScript interface in `frontend/src/pages/Leaderboard.tsx` — rename `wins` → `duelsWon`, `losses` → `duelsLost`, add `duelsTotal: number` and `winRate: number` fields

**Checkpoint**: Leaderboard global tab shows correct wins, losses, and Win Rate with 1 decimal place. No NaN or division-by-zero errors for users with 0 duels.

---

## Phase 4: User Story 2 — Current User Ranking Position (Priority: P1)

**Goal**: The "Your Position" card shows the logged-in user's rank, username, avatar, ELO, wins, losses, and Win Rate.

**Independent Test**: Log in, visit leaderboard, verify "Your Position" card shows correct data matching Prisma Studio.

### Implementation for User Story 2

- [ ] T012 [US2] Update `getUserRank()` in `backend/src/leaderboard/leaderboard.service.ts` — add `username`, `profileImage`, `duelsWon`, `duelsLost`, `duelsTotal` to the user select clause and compute `winRate`
- [ ] T013 [US2] Fix `myRank` mapping in `frontend/src/pages/Leaderboard.tsx` — update the `myRankRes` handler to use the correct fields from the updated API response (`eloRank` → `rank`, `duelsWon`, `duelsLost`, `winRate`, `username`, `profileImage`)
- [ ] T014 [US2] Add Win Rate display to the "Your Position" card in `frontend/src/pages/Leaderboard.tsx` — show Win Rate alongside the W/L display

**Checkpoint**: "Your Position" card shows correct rank, username, avatar, ELO, wins, losses, and Win Rate. Card is hidden when not logged in.

---

## Phase 5: User Story 3 — Language Filter (Priority: P2)

**Goal**: Users can filter the leaderboard by programming language used in duels.

**Independent Test**: Click "By Language" tab, select a language, verify filtered results show only players who used that language in duels.

### Implementation for User Story 3

- [ ] T015 [US3] Create `getAvailableLanguages()` method in `backend/src/leaderboard/leaderboard.service.ts` — query distinct `player1Language` and `player2Language` from completed Duels, deduplicate, sort alphabetically, return as string array
- [ ] T016 [US3] Add `GET /leaderboard/languages` endpoint in `backend/src/leaderboard/leaderboard.controller.ts` — public endpoint with Swagger decorators, calls `getAvailableLanguages()`
- [ ] T017 [US3] Add language filter logic to `getGlobal()` in `backend/src/leaderboard/leaderboard.service.ts` — accept optional `language` query param, when provided: query completed Duels for that language, aggregate per-user wins/losses for that language, return filtered leaderboard with per-language stats
- [ ] T018 [US3] Add `language` query param to `getGlobal()` in `backend/src/leaderboard/leaderboard.controller.ts` — add `@ApiQuery` decorator and pass to service
- [ ] T019 [P] [US3] Add `getLanguages()` method and `language` param to `getGlobal()` in `frontend/src/services/leaderboardService.ts`
- [ ] T020 [US3] Implement "By Language" tab UI in `frontend/src/pages/Leaderboard.tsx` — add language dropdown (populated from `getLanguages()` API), on selection re-fetch leaderboard with `language` param, show empty state when no results

**Checkpoint**: "By Language" tab shows language dropdown, selecting a language filters the leaderboard, empty state shown for languages with no data. Switching back to "Global" removes the filter.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and UX improvements

- [ ] T021 [P] Create feature documentation at `docs/features/leaderboard.md` — document all endpoints, Win Rate formula, language filter behavior, and data flow
- [ ] T022 [P] Update Swagger API descriptions for all modified/new endpoints in `backend/src/leaderboard/leaderboard.controller.ts` — add response examples and parameter descriptions
- [ ] T023 Run quickstart.md verification steps — test all 4 API endpoints via Swagger and verify frontend display at `http://localhost:3000/leaderboard`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (schema + constants) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 — backend fix then frontend fix
- **User Story 2 (Phase 4)**: Depends on Phase 2 — can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Phase 2 — can run in parallel with US1 and US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Phase 2 — Independent of US1
- **User Story 3 (P2)**: Can start after Phase 2 — Independent of US1/US2

### Within Each User Story

- Backend service changes before controller changes
- Controller changes before frontend changes
- All backend done before frontend starts (for that story)

### Parallel Opportunities

- T001 and T003 can run in parallel (different files)
- T006 and T007 in sequence (same file), but T008 can run in parallel (different file)
- T012 and T015 can run in parallel (same file but different methods — proceed with caution)
- T019 can run in parallel with T017/T018 (frontend vs backend)
- T021 and T022 can run in parallel (different files)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T005)
3. Complete Phase 3: User Story 1 (T006–T011)
4. **STOP and VALIDATE**: Leaderboard shows correct wins/losses/Win Rate
5. Verify with at least 2 users in Prisma Studio

### Incremental Delivery

1. Setup + Foundational → Schema and transactions ready
2. Add User Story 1 → Correct scores displayed → **MVP!**
3. Add User Story 2 → User rank card functional
4. Add User Story 3 → Language filter working
5. Polish → Documentation complete, Swagger updated

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks included — test framework not yet configured (Constitution TODO)
- Win Rate formula is mandated by Constitution Principle VIII
- Atomic transactions mandated by Constitution Principle VIII
- Commit after each phase completion
