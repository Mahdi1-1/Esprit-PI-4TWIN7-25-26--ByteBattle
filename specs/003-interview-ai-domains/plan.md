# Implementation Plan: Interview AI — Professional Domain Restructure

## Goal

Transform the existing Interview AI from a generic algorithm-topic interview system into a professional-grade interview simulator organized by **8 domains**, **3 difficulty levels**, and **2 languages**, with domain-specific system prompts and an enhanced scoring/verdict system.

> [!IMPORTANT]
> This plan extends the existing `interviews` module. No new NestJS modules are needed — all changes are additions to the existing `InterviewSession` model, `interviews.service.ts`, `ai-interview.service.ts`, and frontend `AIInterviewPage.tsx`.

## Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modular Architecture | ✅ | Changes stay within `interviews` module + `ai` module |
| II. Naming Conventions | ✅ | All new files follow established patterns |
| III. TypeScript Strictness | ✅ | New enums, typed prompts, no `any` |
| IV. Testing Discipline | ⚠️ | No existing tests found — will add for new service methods |
| V. Documentation-First | ✅ | Will update `docs/features/` |
| VII. i18n | ✅ | FR/EN language support is core to the feature |
| VIII. Scoring Rules | N/A | Interview scoring is separate from duel ELO |

---

## Proposed Changes

### Component 1: Prisma Schema

#### [MODIFY] [schema.prisma](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/prisma/schema.prisma)

Add two new enums and extend the `InterviewSession` model:

```prisma
enum InterviewDomain {
  CLOUD_COMPUTING
  SOFTWARE_ENGINEERING
  CYBERSECURITY
  DATA_SCIENCE_AI
  FRONTEND_ENGINEERING
  BACKEND_ENGINEERING
  DEVOPS_SRE
  MOBILE_DEVELOPMENT
}

enum InterviewLanguage {
  FR
  EN
}
```

Extend `InterviewSession`:
- Add `domain InterviewDomain` (required)
- Add `language InterviewLanguage @default(FR)` (required)
- Add `verdict String?` — stores "HIRE" / "MAYBE" / "NO_HIRE"
- Reuse existing `difficulty Difficulty` enum (already has `easy`, `medium`, `hard`)

Extend `AIMessage` type:
- Add `isVoice Boolean?`
- Add `confidence Float?`

---

### Component 2: Backend Domain Prompts

#### [NEW] [prompts/index.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/ai/prompts/index.ts)

Central barrel file exporting all domain prompts.

#### [NEW] [prompts/cloud-computing.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/ai/prompts/cloud-computing.ts)
#### [NEW] [prompts/software-engineering.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/ai/prompts/software-engineering.ts)
#### [NEW] [prompts/cybersecurity.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/ai/prompts/cybersecurity.ts)
#### [NEW] [prompts/data-science-ai.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/ai/prompts/data-science-ai.ts)
#### [NEW] [prompts/frontend-engineering.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/ai/prompts/frontend-engineering.ts)
#### [NEW] [prompts/backend-engineering.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/ai/prompts/backend-engineering.ts)
#### [NEW] [prompts/devops-sre.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/ai/prompts/devops-sre.ts)
#### [NEW] [prompts/mobile-development.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/ai/prompts/mobile-development.ts)

Each prompt file exports a `DomainPromptConfig` object:
```typescript
export interface DomainPromptConfig {
  domain: string;
  persona: string;           // "Senior Cloud Architect at AWS..."
  subTopics: string[];       // ["EC2/ECS", "Lambda", "S3", ...]
  questionsByLevel: {
    easy: string[];          // 15-20 reference questions
    medium: string[];
    hard: string[];
  };
  evaluationCriteria: string[];
  scoringGuidelines: string;
}
```

---

### Component 3: Backend Service Changes

#### [MODIFY] [ai-interview.service.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/ai/ai-interview.service.ts)

- Refactor `generateInitialPrompt(difficulty, topic)` → `generateInitialPrompt(domain, difficulty, language)`
  - Build a domain-specific system prompt using the prompt configs
  - Include persona introduction, language directive, and difficulty-calibrated behavior
- Refactor `generateResponse(...)` → accept `domain` and `language` parameters
  - System prompt now includes domain context and follow-up behavior rules
- Refactor `generateFinalFeedback(...)` → accept `domain` and `language`
  - JSON output now includes `verdict`, `technicalScore`, `communicationScore`, `problemSolvingScore`, `competencyScores[]`
- Update `InterviewFeedback` interface to include `verdict`, per-competency scores, and recommended resources

#### [MODIFY] [interview.dto.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/interviews/dto/interview.dto.ts)

- Update `StartInterviewDto`:
  - Add `domain: InterviewDomain` (required, validated with `@IsEnum`)
  - Add `language: InterviewLanguage` (required, validated with `@IsEnum`)
  - Keep `difficulty` as-is

#### [MODIFY] [interviews.service.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/interviews/interviews.service.ts)

- Update `start()` to pass `domain` and `language` to `aiInterview.generateInitialPrompt()`
- Update `sendMessage()` / `sendVoiceMessage()` to pass `domain` and `language` to AI service
- Update `endInterview()` to store the `verdict` from the new feedback format
- Add `getDomains()` method returning domain metadata (label, icon, sub-topics, estimated durations)

#### [MODIFY] [interviews.controller.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/interviews/interviews.controller.ts)

- Add `GET /interviews/domains` endpoint calling `getDomains()`
- Update Swagger decorators for the modified `StartInterviewDto`

---

### Component 4: Frontend Data & Types

#### [MODIFY] [interviewData.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/data/interviewData.ts)

- Replace `interviewTopics` (algorithm topics) with `interviewDomains` (8 professional domains)
- Each domain has: `id`, `label`, `icon` (emoji), `description`, `color`, `subTopics[]`, `estimatedDurations`
- Update `InterviewSession` interface to add `domain`, `language`, `verdict`
- Update `InterviewSummary` to add `verdict`, `competencyScores`, `recommendedResources`
- Update `difficultyLevels` with new descriptions targeting experience levels

---

### Component 5: Frontend Setup Screen

#### [MODIFY] [AIInterviewPage.tsx](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/pages/AIInterviewPage.tsx)

Refactor the `setup` view mode to present a 3-step selection flow:

**Step 1** — Domain Selection: Grid of 8 domain cards with icons, labels, and descriptions.
**Step 2** — Difficulty Selection: 3 large buttons (Easy/Medium/Hard) with experience-level descriptions and estimated duration.
**Step 3** — Language Selection: 2 options (🇫🇷 Français / 🇬🇧 English) with flag icons.

A "Start Interview" button is visible with a duration estimate, disabled until all 3 selections are made.

Update `handleStartInterview()` to send `{ domain, difficulty, language }`.

#### [MODIFY] [interviewsService.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/services/interviewsService.ts)

- Update `startInterview()` to send `domain` and `language` in the body
- Add `getDomains()` method

---

### Component 6: Review Screen Enhancement

#### [MODIFY] [AIInterviewPage.tsx](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/pages/AIInterviewPage.tsx)

Update the `ReviewView` component:
- Display the new `verdict` badge (Hire / Maybe / No Hire) with color coding
- Show per-competency score breakdown
- List recommended resources
- Add the domain label and difficulty to the review header

---

### Component 7: Documentation

#### [NEW] [interview-domains.md](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/docs/features/interview-domains.md)

Feature documentation following Constitution Principle V.

---

## Verification Plan

### Manual Verification (User Testing)

1. **Setup Screen Flow**:
   - Start the frontend (`pnpm run dev` in `frontend/`)
   - Start the backend (`pnpm run start:dev` in `backend/`)
   - Navigate to the AI Interview page
   - Verify 8 domain cards are displayed
   - Select a domain → verify difficulty options appear
   - Select difficulty → verify language options appear
   - Verify "Start Interview" button is disabled until all 3 selections are made
   - Click "Start" → verify the AI introduces itself with the correct domain persona and language

2. **Interview Flow**:
   - Start a "Cloud Computing / Hard / English" interview
   - Verify AI introduces itself as a cloud engineering interviewer in English
   - Answer 2-3 questions → verify follow-up questions are relevant to cloud topics
   - End the interview → verify the review screen shows verdict, per-competency scores

3. **Language Consistency**:
   - Start a "Software Engineering / Easy / Français" interview
   - Verify all AI messages are in French throughout

### Automated Verification

- Run `npx prisma validate` in `backend/` to verify schema changes
- Run `npx prisma generate` in `backend/` to regenerate the client
- Run `pnpm run build` in `backend/` to verify TypeScript compilation
- Run `npx vite build` in `frontend/` to verify frontend compilation
