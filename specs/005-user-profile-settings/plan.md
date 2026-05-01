# Implementation Plan: User Profile & Settings

**Branch**: `005-user-profile-settings` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-user-profile-settings/spec.md`

## Summary

Implement the full user profile and settings logic for ByteBattle2: profile photo upload with server-side resize, code editor theme preference persisted per-user, password and email change with validation, language preference synced to backend, comprehensive profile statistics, and account deletion. All features must integrate with the existing frontend (Settings page, Profile page, Navbar, AuthContext, LanguageContext, ThemeContext) and existing backend (NestJS modular architecture, Prisma/MongoDB, JWT auth, existing Users/Auth modules).

## Technical Context

**Language/Version**: TypeScript 5.x (backend & frontend)
**Primary Dependencies**: NestJS 10.x, React 18.x, Prisma 6.x, @monaco-editor/react 4.7.x, Sharp, Multer, bcryptjs, class-validator
**Storage**: MongoDB (via Prisma ORM) + filesystem (`uploads/avatars/`)
**Testing**: Jest (backend), Vitest (frontend) — per Constitution Principle IV
**Target Platform**: Linux server (backend on port 4000), Web browser (frontend on port 3000)
**Project Type**: Web application (monorepo: `backend/` + `frontend/`)
**Performance Goals**: Photo upload < 30s, settings changes reflected < 2s, stats page load < 2s
**Constraints**: API prefix `/api`, JWT auth on all mutation endpoints, rate limiting on password/email change
**Scale/Scope**: Standard web app scale, ~10k users, 5 affected pages + 2 editor components + 4 contexts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Modular Architecture** | ✅ PASS | New profile features added to existing `users` module. Photo upload uses existing file-serving pattern from `avatar` module. No new top-level modules needed — extends `UsersController`/`UsersService`. |
| **II. Naming Conventions** | ✅ PASS | All new files follow established conventions: `kebab-case` backend files (`change-password.dto.ts`), `PascalCase` frontend components, `camelCase` hooks (`useEditorTheme.ts`), `PascalCase` contexts (`EditorThemeContext.tsx`). |
| **III. TypeScript Strictness** | ✅ PASS | All new files use TypeScript. DTOs use `class-validator` decorators. No `any` in new service/controller signatures. User model extended with typed fields. |
| **IV. Testing Discipline** | ⚠️ DEFERRED | Tests required per Constitution but deferred to task execution phase. Each new service method and endpoint must have unit tests. |
| **V. Documentation-First** | ✅ PASS | This plan serves as feature documentation. Swagger decorators required on all new endpoints. |
| **VI. Real-Time & WebSocket** | N/A | No WebSocket changes in this feature. |
| **VII. Internationalization** | ✅ PASS | All new UI text must use `useLanguage().t()` translation keys. New keys added to both `en` and `fr` dictionaries in `LanguageContext`. |
| **VIII. Game Metrics & Scoring** | ✅ PASS | Win Rate on profile page uses canonical formula `(Won / (Won + Lost)) * 100`. No stat mutations in this feature. |

**Gate result**: ✅ PASS — no violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/005-user-profile-settings/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   └── api-endpoints.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   └── schema.prisma                    # MODIFY: Add bio, editorTheme, preferredLanguage, lastLogin to User
├── src/
│   ├── users/
│   │   ├── users.module.ts              # MODIFY: Add MulterModule import
│   │   ├── users.controller.ts          # MODIFY: Add profile photo upload, password change, email change, delete account endpoints
│   │   ├── users.service.ts             # MODIFY: Add changePassword, changeEmail, uploadProfilePhoto, deleteAccount, getProfileStats methods
│   │   └── dto/
│   │       ├── update-user.dto.ts       # MODIFY: Add bio, editorTheme, preferredLanguage fields
│   │       ├── change-password.dto.ts   # NEW: Current password + new password DTO
│   │       └── change-email.dto.ts      # NEW: Current password + new email DTO
│   ├── auth/
│   │   └── auth.service.ts              # MODIFY: Update lastLogin on login, include new fields in getProfile
│   └── uploads/
│       └── avatars/                     # NEW: Directory for uploaded profile photos (gitignored)

frontend/
├── src/
│   ├── context/
│   │   ├── AuthContext.tsx              # MODIFY: Add updateUser method, include new User fields
│   │   ├── LanguageContext.tsx          # MODIFY: Sync language preference with backend on login/change
│   │   └── EditorThemeContext.tsx       # NEW: Context for code editor theme preference
│   ├── pages/
│   │   ├── Settings.tsx                 # MODIFY: Full rewrite — connect all forms to backend APIs
│   │   └── Profile.tsx                  # MODIFY: Fetch real stats from backend, display comprehensive data
│   ├── services/
│   │   └── profileService.ts           # NEW: API service for profile endpoints (upload photo, change password, etc.)
│   ├── components/
│   │   ├── Navbar.tsx                   # MODIFY: Use profileImage from AuthContext, update on photo change
│   │   └── settings/                   # NEW: Directory for settings sub-components
│   │       ├── ProfilePhotoUpload.tsx   # NEW: Photo upload with preview and cropping
│   │       ├── PasswordChangeForm.tsx   # NEW: Password change form with strength indicator
│   │       ├── EmailChangeForm.tsx      # NEW: Email change form
│   │       ├── EditorThemeSelector.tsx  # NEW: Editor theme dropdown with preview
│   │       └── PasswordStrength.tsx     # NEW: Password strength indicator component
│   ├── data/
│   │   └── models.ts                   # MODIFY: Add bio, editorTheme, preferredLanguage, lastLogin to User interface
│   └── types/
│       └── editor-theme.types.ts       # NEW: Editor theme enum/type definitions
```

**Structure Decision**: Web application (Option 2). Extends existing `backend/src/users/` module and `frontend/src/pages/Settings.tsx` + `Profile.tsx`. New reusable settings components in `frontend/src/components/settings/`. New `EditorThemeContext` for cross-editor theme propagation.

## Complexity Tracking

> No Constitution Check violations found. No tracking needed.
