# Tasks: Interview AI — Professional Domain Restructure

**Input**: Design documents from `/specs/003-interview-ai-domains/`
**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema changes and prompt infrastructure that all user stories depend on

- [x] T001 Add `InterviewDomain` and `InterviewLanguage` enums to `backend/prisma/schema.prisma`
- [x] T002 Extend `InterviewSession` model with `domain`, `language`, `verdict` fields in `backend/prisma/schema.prisma`
- [x] T003 Run `npx prisma generate` to regenerate Prisma Client
- [x] T004 [P] Create `DomainPromptConfig` interface and barrel file in `backend/src/ai/prompts/index.ts`
- [x] T005 [P] Update `StartInterviewDto` with `domain` and `language` fields in `backend/src/interviews/dto/interview.dto.ts`

---

## Phase 2: Foundational (Domain Prompt Files)

**Purpose**: Create all 8 domain prompt files — MUST be complete before any user story implementation

**⚠️ CRITICAL**: The AI interview service depends on these prompt configs to generate domain-specific content.

- [x] T006 [P] Create Cloud Computing prompts in `backend/src/ai/prompts/cloud-computing.ts`
- [x] T007 [P] Create Software Engineering prompts in `backend/src/ai/prompts/software-engineering.ts`
- [x] T008 [P] Create Cybersecurity prompts in `backend/src/ai/prompts/cybersecurity.ts`
- [x] T009 [P] Create Data Science & AI/ML prompts in `backend/src/ai/prompts/data-science-ai.ts`
- [x] T010 [P] Create Frontend Engineering prompts in `backend/src/ai/prompts/frontend-engineering.ts`
- [x] T011 [P] Create Backend Engineering prompts in `backend/src/ai/prompts/backend-engineering.ts`
- [x] T012 [P] Create DevOps & SRE prompts in `backend/src/ai/prompts/devops-sre.ts`
- [x] T013 [P] Create Mobile Development prompts in `backend/src/ai/prompts/mobile-development.ts`

**Checkpoint**: All 8 prompt config files exist and export valid `DomainPromptConfig` objects.

---

## Phase 3: User Story 1 — Domain & Difficulty Selection Screen (Priority: P1) 🎯 MVP

**Goal**: Users can select a domain, difficulty, and language on a visual setup screen and start an interview with those parameters.

**Independent Test**: Navigate to AI Interview page → see 8 domain cards → select domain/difficulty/language → click Start → session begins with correct parameters.

### Backend (US1)

- [] T014 [US1] Refactor `generateInitialPrompt()` in `backend/src/ai/ai-interview.service.ts` to accept `domain`, `difficulty`, `language` and build domain-specific system prompt
- [] T015 [US1] Add `getDomains()` method returning domain metadata in `backend/src/interviews/interviews.service.ts`
- [] T016 [US1] Update `start()` to pass `domain` and `language` to AI service in `backend/src/interviews/interviews.service.ts`
- [] T017 [US1] Add `GET /interviews/domains` endpoint in `backend/src/interviews/interviews.controller.ts`
- [] T018 [US1] Update `POST /interviews/start` to accept new DTO fields in `backend/src/interviews/interviews.controller.ts`

### Frontend (US1)

- [] T019 [P] [US1] Replace `interviewTopics` with `interviewDomains` (8 domains with metadata) in `frontend/src/data/interviewData.ts`
- [] T020 [P] [US1] Update `InterviewSession` interface to add `domain`, `language` fields in `frontend/src/data/interviewData.ts`
- [] T021 [US1] Add `getDomains()` method to `frontend/src/services/interviewsService.ts`
- [] T022 [US1] Update `startInterview()` to send `domain` + `language` in body in `frontend/src/services/interviewsService.ts`
- [] T023 [US1] Redesign the setup view in `frontend/src/pages/AIInterviewPage.tsx` with 3-step selection flow (domain cards → difficulty → language)
- [] T024 [US1] Wire Start button to call `startInterview({ domain, difficulty, language })` in `frontend/src/pages/AIInterviewPage.tsx`

**Checkpoint**: Full selection flow works. User can choose domain/difficulty/language and start an interview. AI introduces itself in the correct domain persona and language.

---

## Phase 4: User Story 2 — Realistic AI Interviewer Behavior (Priority: P1)

**Goal**: AI behaves like a real professional interviewer — domain-specific questions, follow-ups, difficulty-calibrated behavior, language-consistent output.

**Independent Test**: Start any domain interview → verify AI persona, question relevance, follow-up behavior, and language consistency.

- [] T025 [US2] Refactor `generateResponse()` in `backend/src/ai/ai-interview.service.ts` to include domain context, follow-up rules, and language directive
- [] T026 [US2] Refactor `reviewCode()` in `backend/src/ai/ai-interview.service.ts` to include domain-specific evaluation criteria
- [] T027 [US2] Update `sendMessage()` in `backend/src/interviews/interviews.service.ts` to pass `domain` and `language` to AI service
- [] T028 [US2] Update `sendVoiceMessage()` in `backend/src/interviews/interviews.service.ts` to pass `domain` and `language` to AI service

**Checkpoint**: AI generates domain-relevant questions, adapts follow-up behavior to difficulty level, and maintains the selected language throughout.

---

## Phase 5: User Story 3 — Interview Scoring & Report (Priority: P2)

**Goal**: Enhanced post-interview report with per-competency scores, verdict (Hire/Maybe/No Hire), and recommended resources.

**Independent Test**: Complete an interview → end it → verify review screen shows verdict, competency breakdown, and resources.

### Backend (US3)

- [] T029 [US3] Update `InterviewFeedback` interface to add `verdict`, `competencyScores`, `recommendedResources` in `backend/src/ai/ai-interview.service.ts`
- [] T030 [US3] Refactor `generateFinalFeedback()` to accept `domain` and `language`, output enhanced JSON with verdict in `backend/src/ai/ai-interview.service.ts`
- [] T031 [US3] Update `endInterview()` to store `verdict` field in `backend/src/interviews/interviews.service.ts`

### Frontend (US3)

- [] T032 [P] [US3] Update `InterviewSummary` interface with `verdict`, `competencyScores`, `recommendedResources` in `frontend/src/data/interviewData.ts`
- [] T033 [US3] Enhance `ReviewView` component in `frontend/src/pages/AIInterviewPage.tsx` — add verdict badge, competency chart, resources list

**Checkpoint**: Completed interviews display a full report with hiring verdict, per-competency scores, and learning resources.

---

## Phase 6: User Story 4 — Domain-Specific Question Bank (Priority: P2)

**Goal**: AI draws from domain sub-topics to ensure breadth across different areas within a single interview.

**Independent Test**: Run 2+ interviews in different domains → verify questions cover ≥3 sub-topics per session.

- [] T034 [US4] Add sub-topic tracking to system prompt construction in `backend/src/ai/ai-interview.service.ts` — instruct AI to cover different sub-topics across questions
- [] T035 [US4] Enrich each domain prompt file with 15-20 reference questions per difficulty level in `backend/src/ai/prompts/*.ts`

**Checkpoint**: AI questions span multiple sub-topics within a domain. No single-topic interviews.

---

## Phase 7: User Story 5 — Behavioral/STAR Questions (Priority: P3)

**Goal**: Medium/Hard interviews include behavioral STAR questions. Hard adds leadership questions.

**Independent Test**: Run a Hard interview → verify at least 1 STAR behavioral question appears.

- [] T036 [US5] Add STAR method instruction block to system prompts for Medium and Hard levels in `backend/src/ai/prompts/index.ts`
- [] T037 [US5] Add leadership/conflict resolution question examples to Hard-level prompt sections in each domain prompt file `backend/src/ai/prompts/*.ts`

**Checkpoint**: Hard interviews contain behavioral and leadership questions. Easy interviews remain purely technical.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and verification across all stories.

- [] T038 [P] Create feature documentation in `docs/features/interview-domains.md`
- [] T039 [P] Add Swagger decorators for new/modified endpoints in `backend/src/interviews/interviews.controller.ts`
- [] T040 Validate Prisma schema with `npx prisma validate` and regenerate
- [ ] T041 Run backend build (`pnpm run build` in `backend/`)
- [ ] T042 Run frontend build (`npx vite build` in `frontend/`)
- [ ] T043 Manual end-to-end verification: domain selection → full interview → review screen

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T004 (prompt interface) — all 8 files are parallelizable
- **US1 (Phase 3)**: Depends on Phase 1 + Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 3 (needs working session with domain/language)
- **US3 (Phase 5)**: Depends on Phase 3 (needs working interview to end)
- **US4 (Phase 6)**: Depends on Phase 2 (enriches prompt files)
- **US5 (Phase 7)**: Depends on Phase 2 (enriches prompt files)
- **Polish (Phase 8)**: Depends on all desired stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Setup + Foundational — no other story dependencies
- **US2 (P1)**: Depends on US1 (needs session with domain/language params)
- **US3 (P2)**: Depends on US1 (needs working interview to generate feedback)
- **US4 (P2)**: Independent of US1/US2/US3 — enriches prompt files only
- **US5 (P3)**: Independent of US1/US2/US3 — enriches prompt files only

### Parallel Opportunities

- T006–T013 (all 8 domain prompts) can run in parallel
- T019–T020 (frontend data types) can run in parallel with T014–T018 (backend)
- T032 (frontend types for US3) can run in parallel with T029–T031 (backend US3)
- US4 and US5 can run in parallel with US2 and US3

---

## Parallel Example: Phase 2 (Foundation)

```
# All 8 domain prompt files at once:
Task T006: Cloud Computing prompts
Task T007: Software Engineering prompts
Task T008: Cybersecurity prompts
Task T009: Data Science & AI/ML prompts
Task T010: Frontend Engineering prompts
Task T011: Backend Engineering prompts
Task T012: DevOps & SRE prompts
Task T013: Mobile Development prompts
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundation — 8 prompt files (T006–T013)
3. Complete Phase 3: US1 — Selection screen + session start (T014–T024)
4. **STOP and VALIDATE**: Test domain selection → interview start flow
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundation → Prompt infrastructure ready
2. US1 → Domain selection works → **MVP!**
3. US2 → AI behavior is domain-specific
4. US3 → Enhanced scoring with verdict
5. US4+US5 → Question breadth + behavioral questions
6. Polish → Documentation + builds

---

## Notes

- All prompt files follow the same `DomainPromptConfig` interface — copy one as template for the rest
- The existing `Difficulty` enum (`easy`, `medium`, `hard`) is reused — no changes needed
- Frontend `interviewData.ts` is the single source of truth for domain metadata on the frontend
- Commit after each phase checkpoint for clean rollback points
