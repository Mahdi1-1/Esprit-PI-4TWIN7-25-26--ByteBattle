<!--
  SYNC IMPACT REPORT
  ==================
  Version change: 1.0.0 → 1.1.0
  Modified principles:
    - None renamed
  Added sections:
    - Principle VIII: Game Metrics & Scoring Rules (Win Rate formula + atomic DB updates)
    - Primary Language & Framework declaration at top of Technology Stack
  Corrections:
    - Database: PostgreSQL → MongoDB (corrected to match actual schema.prisma datasource)
  Removed sections: None
  Templates requiring updates:
    - plan-template.md: ✅ Constitution Check section aligned
    - spec-template.md: ✅ Compatible
    - tasks-template.md: ✅ Compatible
  Follow-up TODOs:
    - TODO(ESLINT_CONFIG): ESLint configuration not yet set up
    - TODO(PRETTIER_CONFIG): Prettier configuration not yet set up
    - TODO(TEST_FRAMEWORK): Jest/Vitest not yet configured
    - TODO(ATOMIC_STATS): duels.service.ts updatePlayerStats must be refactored to use
      Prisma transactions per Principle VIII
    - TODO(WINRATE_FIELD): Consider adding a computed winRate field or ensuring
      Win Rate is always calculated via the canonical formula
-->

# ByteBattle2 Constitution

## Core Principles

### I. Modular Architecture

Every feature MUST be implemented as an isolated, self-contained module following the
established monorepo structure:

- **Backend**: Each domain (auth, duels, challenges, etc.) MUST be a dedicated NestJS module
  containing its own `*.module.ts`, `*.controller.ts`, `*.service.ts`, and optionally
  `*.gateway.ts`, `dto/`, `guards/`, `strategies/`, and `decorators/` sub-directories.
- **Frontend**: Each feature MUST be organized under `components/`, `pages/`, `hooks/`,
  `context/`, `services/`, or `types/` directories. Shared UI primitives MUST reside in
  `components/ui/`.
- **Cross-cutting concerns** (Prisma, config) MUST be encapsulated in their own modules
  and injected via NestJS dependency injection.
- No circular dependencies between modules. Each module MUST declare its imports explicitly
  in its `*.module.ts`.

**Rationale**: Isolation enables parallel feature development, reduces merge conflicts, and
makes each domain independently testable.

### II. Naming Conventions

All file and symbol naming MUST follow these rules consistently:

- **Backend files**: `kebab-case` with type suffix — `feature.type.ts`
  (e.g., `duels.controller.ts`, `auth.service.ts`, `auth.dto.ts`).
- **Backend classes**: `PascalCase` with type suffix — `DuelsController`, `AuthService`,
  `AuthModule`, `JwtAuthGuard`.
- **Frontend components**: `PascalCase` file and export name — `Navbar.tsx`, `Button.tsx`,
  `DuelResult.tsx`.
- **Frontend hooks**: `camelCase` with `use` prefix — `useAvatar.ts`, `useParticleSystem.ts`.
- **Frontend contexts**: `PascalCase` with `Context` suffix — `AuthContext.tsx`,
  `ThemeContext.tsx`.
- **Frontend types**: `kebab-case` with `.types.ts` suffix — `game.types.ts`,
  `avatar.types.ts`.
- **Prisma models**: `PascalCase` singular — `User`, `Challenge`, `Duel`.
- **Database collections**: Prisma default mapping (PascalCase model name).
- **Environment variables**: `UPPER_SNAKE_CASE` — `DATABASE_URL`, `JWT_SECRET`.
- **CSS classes**: TailwindCSS utility classes; custom classes MUST use `kebab-case`.
- **Directories**: `kebab-case` for backend feature folders, `PascalCase` for frontend
  component folders containing multiple files, `kebab-case` for other frontend folders.

**Rationale**: Consistent naming reduces cognitive overhead and makes the codebase navigable
without documentation.

### III. TypeScript Strictness

All TypeScript code MUST adhere to the following standards:

- **Backend**: `strictNullChecks: true` MUST remain enabled. `noImplicitAny` SHOULD be
  enabled as the codebase matures.
- **Frontend**: TypeScript MUST be used for all new files (`.tsx` for components, `.ts` for
  logic). No `.js` or `.jsx` files in `src/`.
- DTOs MUST use `class-validator` decorators for runtime validation on the backend.
- API responses MUST be typed — no `any` in service return types or controller signatures.
- Shared types between frontend and backend SHOULD be defined in a shared location or
  duplicated with explicit alignment comments.

**Rationale**: Type safety prevents runtime errors, especially critical for a real-time
competitive coding platform where data integrity matters.

### IV. Testing Discipline

All new features MUST include tests. The following standards apply:

- **Backend**: Use Jest as the test framework. Test files MUST follow the pattern
  `*.spec.ts` and be co-located with the source file they test.
- **Frontend**: Use Vitest as the test framework. Test files MUST follow the pattern
  `*.test.tsx` or `*.test.ts` and be co-located with the source file.
- **Minimum coverage**: Every new service method and controller endpoint MUST have at least
  one unit test. WebSocket gateways MUST have integration tests.
- **E2E tests**: Critical user flows (authentication, duel creation, code submission) MUST
  have end-to-end tests.
- **Test naming**: Use descriptive `describe`/`it` blocks in English —
  `describe('DuelsService')` → `it('should create a new duel between two players')`.
- **No test, no merge**: PRs without tests for new functionality MUST be rejected.

**Rationale**: ByteBattle is a competitive platform where bugs in game logic, scoring, or
real-time communication directly impact user trust. Tests are mandatory.

### V. Documentation-First Development

All new features MUST be documented in the `docs/` directory before or alongside
implementation:

- **Feature documentation**: Every new feature MUST have a corresponding markdown file in
  `docs/features/` explaining its purpose, API endpoints, data model, and usage.
- **API documentation**: Backend endpoints MUST be documented via Swagger decorators
  (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) in addition to the `docs/` entry.
- **Architecture decisions**: Significant technical decisions MUST be recorded as ADRs
  (Architecture Decision Records) in `docs/adr/`.
- **README updates**: The root `README.md` and relevant sub-project READMEs MUST be updated
  when adding a new module or changing setup instructions.
- **Inline comments**: Complex algorithms (e.g., matchmaking, ELO rating, code execution
  sandboxing) MUST have explanatory comments.

**Rationale**: ByteBattle has multiple complex systems (duels, hackathons, interviews,
sandboxing). Without documentation, onboarding cost grows exponentially.

### VI. Real-Time & WebSocket Standards

All real-time features MUST follow these conventions:

- WebSocket gateways MUST be implemented using NestJS `@WebSocketGateway` decorator with
  explicit namespace and CORS configuration.
- Events MUST be named using `kebab-case` verb-noun pattern — `join-duel`, `submit-code`,
  `update-score`.
- All gateway events MUST validate incoming payloads using DTOs with `class-validator`.
- Socket.IO client connections on the frontend MUST be managed through dedicated service
  files in `services/` — never instantiated directly in components.
- Connection state and reconnection logic MUST be handled gracefully with user feedback.

**Rationale**: Real-time duel and collaboration features are core to ByteBattle's value
proposition. Inconsistent WebSocket patterns lead to hard-to-debug race conditions.

### VII. Internationalization (i18n)

All user-facing text MUST be internationalized:

- Translation keys MUST be used instead of hardcoded strings in all React components.
- Translation files MUST be organized by namespace/feature in `frontend/public/locales/`
  or equivalent i18next configuration.
- New components MUST use the `useTranslation` hook from `react-i18next`.
- At minimum, French and English MUST be supported.

**Rationale**: ByteBattle targets a multilingual audience. Hardcoded strings create
technical debt that becomes exponentially harder to fix as the UI grows.

### VIII. Game Metrics & Scoring Rules

All game scoring, ranking, and player statistics MUST follow these canonical rules:

- **Win Rate formula** (NON-NEGOTIABLE):

  ```
  Win Rate = (Won / (Won + Lost)) * 100
  ```

  Where `Won` = `user.duelsWon` and `Lost` = `user.duelsLost`. This formula MUST be used
  everywhere Win Rate is computed — backend services, API responses, frontend display.
  No alternative formula is permitted.

- **Atomic score updates** (NON-NEGOTIABLE): All database mutations that modify player
  statistics (ELO, XP, `duelsWon`, `duelsLost`, `duelsTotal`, Win Rate) MUST be executed
  inside a **Prisma transaction** (`prisma.$transaction`) to guarantee atomicity.
  Specifically:
  - When a duel ends, the winner's and loser's stats MUST be updated within a single
    transaction alongside the duel status update.
  - Partial updates (one player updated, other fails) are FORBIDDEN — either all stats
    update or none do.
  - Example pattern:
    ```typescript
    await this.prisma.$transaction([
      this.prisma.duel.update({ where: { id: duelId }, data: { ... } }),
      this.prisma.user.update({ where: { id: winnerId }, data: { ... } }),
      this.prisma.user.update({ where: { id: loserId }, data: { ... } }),
    ]);
    ```

- **ELO adjustments**: Winner gains +25 ELO, loser loses -15 ELO, draw gives +0 ELO.
  These values MUST be defined as named constants, not magic numbers.

- **XP rewards**: Winner +100 XP, loser +25 XP, draw +50 XP. These values MUST be defined
  as named constants.

- **Score display**: All scores displayed to users MUST be rounded to integers. Win Rate
  MUST show one decimal place (e.g., `73.2%`).

**Rationale**: Competitive integrity is the core value proposition of ByteBattle. Inconsistent
scoring or partial stat updates erode player trust and create support incidents. Atomicity
ensures no data corruption under concurrent duel endings.

## Technology Stack & Constraints

### Primary Language & Framework

| Role | Choice |
|------|--------|
| **Primary Language** | **TypeScript** (v5.x) — used for ALL backend and frontend code |
| **Backend Framework** | **NestJS** (v10.x) — modular, decorator-based Node.js framework |
| **Frontend Framework** | **React** (v18.x) — component-based UI library with hooks |

### Approved Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Build Tool** | Vite (SWC plugin) | 6.x |
| **Styling** | TailwindCSS | latest |
| **UI Components** | Radix UI | latest |
| **Animations** | Framer Motion | 12.x |
| **Routing** | React Router | 7.x |
| **State/Forms** | React Hook Form | 7.x |
| **i18n** | react-i18next + i18next | latest |
| **ORM** | Prisma | 6.x |
| **Database** | MongoDB | — |
| **Authentication** | Passport (JWT + Google OAuth) | — |
| **Real-Time** | Socket.IO (NestJS platform) | 4.x |
| **Queue** | Bull + Redis (ioredis) | — |
| **API Docs** | Swagger (@nestjs/swagger) | 8.x |
| **AI Integration** | Google Generative AI | — |
| **Image Processing** | Sharp | — |
| **Package Manager** | pnpm | — |

### Constraints

- **No new dependencies** may be added without justification in the PR description.
  Prefer existing dependencies before introducing alternatives.
- **Node.js target**: ES2021 (backend), ESNext (frontend).
- **API prefix**: All backend routes MUST be served under `/api`.
- **Port conventions**: Backend on `4000`, Frontend dev server on `3000`,
  Prisma Studio on `5555`.
- **Environment configuration**: All secrets and config MUST use `@nestjs/config` with
  `.env` files. Secrets MUST never be committed to version control.

## Development Workflow & Quality Gates

### Branch & Commit Standards

- **Branch naming**: `feature/short-description`, `fix/short-description`,
  `refactor/short-description`.
- **Commit messages**: Use Conventional Commits format —
  `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- **PR requirements**:
  1. Code compiles without TypeScript errors (`nest build` / `vite build`).
  2. All existing tests pass.
  3. New tests added for new functionality (Principle IV).
  4. Documentation updated in `docs/` (Principle V).
  5. Swagger decorators added for new endpoints.
  6. Score/stat mutations use Prisma transactions (Principle VIII).

### Pre-Merge Checklist

- [ ] TypeScript compilation succeeds (zero errors).
- [ ] Linting passes (once ESLint is configured).
- [ ] All tests pass.
- [ ] `docs/` updated for new features.
- [ ] No hardcoded user-facing strings (i18n keys used).
- [ ] No `console.log` debugging left in code (structured logging only).
- [ ] Prisma migrations generated if schema changed.
- [ ] Score updates use `prisma.$transaction` (Principle VIII).
- [ ] Win Rate computed using canonical formula (Principle VIII).

## Governance

This constitution is the supreme governing document for ByteBattle2 development. All code
contributions, reviews, and architectural decisions MUST comply with its principles.

- **Amendment process**: Any change to this constitution MUST be documented with a version
  bump, rationale, and migration plan for affected code.
- **Version policy**: Follows semantic versioning — MAJOR for principle removals/redefinitions,
  MINOR for new principles or expanded guidance, PATCH for clarifications and wording fixes.
- **Compliance review**: Every PR review MUST verify adherence to the Core Principles.
  Violations MUST be flagged and resolved before merge.
- **Conflict resolution**: When this constitution conflicts with other project documentation,
  this constitution takes precedence.
- **Runtime guidance**: Refer to `docs/` for implementation-specific guidance that
  supplements these principles.

**Version**: 1.1.0 | **Ratified**: 2026-03-24 | **Last Amended**: 2026-03-24
