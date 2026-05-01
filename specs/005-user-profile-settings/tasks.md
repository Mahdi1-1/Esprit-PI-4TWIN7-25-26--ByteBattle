# Tasks: User Profile & Settings

**Input**: Design documents from `/specs/005-user-profile-settings/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-endpoints.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted. Tests should be added per Constitution Principle IV during implementation.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, update schema, create shared types and services.

- [x] T001 Install `@nestjs/throttler` dependency in `backend/package.json`
- [x] T002 Add `bio`, `editorTheme`, `preferredLanguage`, `lastLogin` fields to User model in `backend/prisma/schema.prisma`
- [x] T003 Run `npx prisma db push && npx prisma generate` to sync schema with MongoDB
- [x] T004 Create `backend/uploads/avatars/` directory and add `uploads/` to `backend/.gitignore`
- [x] T005 [P] Add `bio`, `editorTheme`, `preferredLanguage`, `lastLogin` fields to `User` interface in `frontend/src/data/models.ts`
- [x] T006 [P] Create editor theme type definitions in `frontend/src/types/editor-theme.types.ts` (EditorTheme type + EDITOR_THEMES constant array)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend DTOs, service methods, and shared frontend services that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Extend `UpdateUserDto` with `bio` (`@IsOptional`, `@MaxLength(250)`), `editorTheme` (`@IsOptional`, `@IsIn([...])`) and `preferredLanguage` (`@IsOptional`, `@IsIn(['en','fr'])`) in `backend/src/users/dto/update-user.dto.ts`
- [x] T008 [P] Create `ChangePasswordDto` with `currentPassword` (`@IsString`) and `newPassword` (`@IsString`, `@MinLength(8)`, `@Matches` for uppercase/digit/special) in `backend/src/users/dto/change-password.dto.ts`
- [x] T009 [P] Create `ChangeEmailDto` with `currentPassword` (`@IsString`) and `newEmail` (`@IsEmail`) in `backend/src/users/dto/change-email.dto.ts`
- [x] T010 [P] Create `DeleteAccountDto` with `currentPassword` (`@IsString`) and `confirmation` (`@Equals('DELETE')`) in `backend/src/users/dto/delete-account.dto.ts`
- [x] T011 Create profile API service in `frontend/src/services/profileService.ts` with methods: `uploadPhoto()`, `deletePhoto()`, `changePassword()`, `changeEmail()`, `getProfileStats()`, `deleteAccount()`, `updateProfile()`
- [x] T012 Add `updateUser` method to AuthContext in `frontend/src/context/AuthContext.tsx` that merges partial user data and dispatches `user-profile-updated` event
- [x] T013 Register `ThrottlerModule` in `backend/src/users/users.module.ts` and add `MulterModule.register({ dest: './uploads/avatars' })` import
- [x] T014 [P] Add new translation keys for settings/profile sections to both `en` and `fr` dictionaries in `frontend/src/context/LanguageContext.tsx` (keys: `settings.profile.photo.*`, `settings.security.password.*`, `settings.account.email.*`, `settings.preferences.editorTheme.*`, `settings.dangerzone.*`, `profile.stats.*`)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Upload and Manage Profile Photo (Priority: P1) 🎯 MVP

**Goal**: Users can upload, preview, and remove profile photos. Updated photo reflects across the entire app.

**Independent Test**: Upload an image on settings page → verify it appears in navbar avatar, forum post avatar, and profile page.

### Implementation for User Story 1

- [x] T015 [US1] Add `uploadProfilePhoto` method to `UsersService` in `backend/src/users/users.service.ts`: accept file buffer, validate MIME type, resize to 200×200 WebP via Sharp, save to `uploads/avatars/{userId}.webp`, update `User.profileImage`, delete old file if exists
- [x] T016 [US1] Add `deleteProfilePhoto` method to `UsersService` in `backend/src/users/users.service.ts`: delete file from filesystem, set `User.profileImage` to null
- [x] T017 [US1] Add `POST /users/me/photo` endpoint with `@UseInterceptors(FileInterceptor('file'))` and Multer file size/type validation in `backend/src/users/users.controller.ts`
- [x] T018 [US1] Add `DELETE /users/me/photo` endpoint in `backend/src/users/users.controller.ts`
- [x] T019 [US1] Add `GET /users/photo/:filename` public endpoint to serve uploaded photo files with `Cache-Control` header in `backend/src/users/users.controller.ts`
- [x] T020 [US1] Add Swagger decorators (`@ApiOperation`, `@ApiConsumes`, `@ApiResponse`) to all new photo endpoints in `backend/src/users/users.controller.ts`
- [x] T021 [US1] Create `ProfilePhotoUpload` component in `frontend/src/components/settings/ProfilePhotoUpload.tsx`: file input (accept="image/*"), circular preview, upload/remove buttons, loading/error states, calls `profileService.uploadPhoto()` and `authContext.updateUser()`
- [x] T022 [US1] Integrate `ProfilePhotoUpload` into the Profile tab of `frontend/src/pages/Settings.tsx`, replacing current static avatar display
- [x] T023 [US1] Update navbar avatar logic in `frontend/src/components/Navbar.tsx` to reactively use `user.profileImage` from AuthContext (ensure DiceBear fallback on `onError`)

**Checkpoint**: Profile photo upload/delete works end-to-end. Photo visible in Settings, Navbar, and Profile page.

---

## Phase 4: User Story 2 — Change Password (Priority: P1)

**Goal**: Users with local accounts can change their password with strength validation. OAuth users see "managed by Google" message.

**Independent Test**: Log in, change password in Security tab, log out, log back in with new password.

### Implementation for User Story 2

- [x] T024 [US2] Add `changePassword` method to `UsersService` in `backend/src/users/users.service.ts`: verify `isOAuthUser` is false, verify current password with `bcrypt.compare`, hash new password with `bcrypt.hash(10)`, update `User.passwordHash`
- [x] T025 [US2] Add `PATCH /users/me/password` endpoint with `@Throttle(5, 900)` rate limit decorator in `backend/src/users/users.controller.ts`
- [x] T026 [US2] Add Swagger decorators to password change endpoint in `backend/src/users/users.controller.ts`
- [x] T027 [P] [US2] Create `PasswordStrength` component in `frontend/src/components/settings/PasswordStrength.tsx`: real-time indicator (weak/medium/strong) based on character criteria checks (uppercase, digit, special, length ≥12)
- [x] T028 [US2] Create `PasswordChangeForm` component in `frontend/src/components/settings/PasswordChangeForm.tsx`: current password field, new password field with `PasswordStrength` indicator, confirm password field, submit button, OAuth detection (disable form + show "managed by Google" message), calls `profileService.changePassword()`
- [x] T029 [US2] Integrate `PasswordChangeForm` into the Security tab of `frontend/src/pages/Settings.tsx`, replacing current static password form

**Checkpoint**: Password change works. OAuth users see disabled form.

---

## Phase 5: User Story 3 — Choose Code Editor Theme (Priority: P2)

**Goal**: Users select a code editor theme in Settings. The theme persists in DB and applies across all Monaco editors.

**Independent Test**: Select "Dracula" in settings → navigate to Problem page → verify editor uses Dracula theme.

### Implementation for User Story 3

- [x] T030 [US3] Create `EditorThemeContext` in `frontend/src/context/EditorThemeContext.tsx`: reads `editorTheme` from AuthContext user object, provides `editorTheme` value and `setEditorTheme()` function that calls `profileService.updateProfile({ editorTheme })` and `authContext.updateUser()`
- [x] T031 [US3] Define custom Monaco themes (Monokai, Dracula, GitHub Dark, One Dark Pro, Solarized Dark/Light) using `monaco.editor.defineTheme()` in `frontend/src/context/EditorThemeContext.tsx` — register themes on first mount
- [x] T032 [US3] Wrap app with `EditorThemeProvider` in `frontend/src/App.tsx` (inside AuthProvider)
- [x] T033 [P] [US3] Create `EditorThemeSelector` component in `frontend/src/components/settings/EditorThemeSelector.tsx`: dropdown listing all themes from `EDITOR_THEMES` constant, shows code preview snippet using selected theme, calls `setEditorTheme()` from context
- [x] T034 [US3] Integrate `EditorThemeSelector` into Preferences/Appearance tab of `frontend/src/pages/Settings.tsx`
- [x] T035 [US3] Update `<Editor theme="vs-dark" />` in `frontend/src/pages/Problem.tsx` to use `useEditorTheme()` context value instead of hardcoded `"vs-dark"`
- [x] T036 [US3] Update `<Editor theme="vs-dark" />` in `frontend/src/pages/DuelRoom.tsx` to use `useEditorTheme()` context value instead of hardcoded `"vs-dark"`

**Checkpoint**: Editor theme persists and applies across Problem and DuelRoom editors.

---

## Phase 6: User Story 4 — Change Email Address (Priority: P2)

**Goal**: Users with local accounts can change their email after password verification.

**Independent Test**: Change email in Account settings → verify new email shown in profile and usable for login.

### Implementation for User Story 4

- [x] T037 [US4] Add `changeEmail` method to `UsersService` in `backend/src/users/users.service.ts`: verify `isOAuthUser` is false, verify current password, check new email uniqueness via `prisma.user.findUnique({ where: { email } })`, update `User.email`
- [x] T038 [US4] Add `PATCH /users/me/email` endpoint with `@Throttle(5, 900)` rate limit in `backend/src/users/users.controller.ts`
- [x] T039 [US4] Add Swagger decorators to email change endpoint in `backend/src/users/users.controller.ts`
- [x] T040 [US4] Create `EmailChangeForm` component in `frontend/src/components/settings/EmailChangeForm.tsx`: current password field, new email field with validation, submit button, OAuth detection (disable form + "Email managed by Google"), calls `profileService.changeEmail()` and `authContext.updateUser()`
- [x] T041 [US4] Integrate `EmailChangeForm` into the Account/Security tab of `frontend/src/pages/Settings.tsx`

**Checkpoint**: Email change works end-to-end. OAuth users see disabled form.

---

## Phase 7: User Story 5 — Choose Preferred Language (Priority: P2)

**Goal**: Language preference persists in DB and auto-loads on login across devices.

**Independent Test**: Switch to French in settings, log out, log back in → UI shows French automatically.

### Implementation for User Story 5

- [x] T042 [US5] Update `LanguageContext` in `frontend/src/context/LanguageContext.tsx`: on mount, if authenticated user has `preferredLanguage`, use it instead of localStorage; on language change, call `profileService.updateProfile({ preferredLanguage })` to persist to backend
- [x] T043 [US5] Update `AuthContext` login flow in `frontend/src/context/AuthContext.tsx`: after successful login, dispatch event or expose `user.preferredLanguage` so LanguageContext can read it
- [x] T044 [US5] Update `auth.service.ts` in `backend/src/auth/auth.service.ts`: set `lastLogin: new Date()` when `login()` or `validateOrCreateGoogleUser()` succeeds, include `preferredLanguage` and `editorTheme` in `getProfile()` response and `generateTokens()` user object
- [x] T045 [US5] Add language selector to the Preferences tab of `frontend/src/pages/Settings.tsx` using the existing `LanguageSwitcher` component or a new inline selector that calls `setLanguage()` from LanguageContext

**Checkpoint**: Language preference round-trips to backend and persists across sessions.

---

## Phase 8: User Story 6 — View Profile Statistics (Priority: P3)

**Goal**: Profile page displays comprehensive real statistics fetched from backend.

**Independent Test**: Navigate to profile page → verify all stats match database values.

### Implementation for User Story 6

- [x] T046 [US6] Add `getProfileStats` method to `UsersService` in `backend/src/users/users.service.ts`: use `Promise.all()` to query in parallel — `Submission.count` (distinct challengeId where verdict=accepted), `Discussion.count`, `Comment.count`, `User.count` (where elo > current for leaderboard position), compute winRate using canonical formula `(duelsWon / (duelsWon + duelsLost)) * 100`
- [x] T047 [US6] Add `GET /users/me/stats` endpoint in `backend/src/users/users.controller.ts` with Swagger decorators
- [x] T048 [US6] Rewrite `frontend/src/pages/Profile.tsx`: replace hardcoded mock data with `useEffect` fetch from `profileService.getProfileStats()`, display all stats (ELO, XP, level, duels W/L, win rate, challenges solved, forum posts, comments, leaderboard position, date joined, last login), handle loading/error states

**Checkpoint**: Profile page shows real data from backend.

---

## Phase 9: User Story 7 — Settings Page Organization (Priority: P3)

**Goal**: Centralized settings page with all sections connected to real backend APIs.

**Independent Test**: Navigate to `/settings` → verify all tabs work and forms submit data.

### Implementation for User Story 7

- [x] T049 [US7] Full rewrite of `frontend/src/pages/Settings.tsx`: restructure tabs into Profile (photo + bio + username), Account (email change + password change), Preferences (language + editor theme + global theme), Notifications (toggle switches), integrate all components from US1-US5 (`ProfilePhotoUpload`, `PasswordChangeForm`, `EmailChangeForm`, `EditorThemeSelector`, language selector)
- [x] T050 [US7] Add bio textarea (max 250 chars with character counter) and username display to the Profile tab in `frontend/src/pages/Settings.tsx`, connected to `profileService.updateProfile()`
- [x] T051 [US7] Connect global theme toggle in Preferences tab to existing `useTheme().toggleColorScheme()` from `ThemeContext`
- [x] T052 [US7] Use translation keys (`useLanguage().t()`) for ALL text labels in `frontend/src/pages/Settings.tsx` — no hardcoded strings

**Checkpoint**: Settings page fully functional with all sections connected.

---

## Phase 10: User Story 8 — Delete Account (Priority: P3)

**Goal**: Users can permanently delete their account with password and confirmation.

**Independent Test**: Click Delete Account → enter password + type "DELETE" → account deleted, redirected to landing.

### Implementation for User Story 8

- [x] T053 [US8] Add `deleteAccount` method to `UsersService` in `backend/src/users/users.service.ts`: verify password, delete user record with `prisma.user.delete()`, delete profile photo file if exists
- [x] T054 [US8] Add `DELETE /users/me` endpoint in `backend/src/users/users.controller.ts` with Swagger decorators accepting `DeleteAccountDto`
- [x] T055 [US8] Update the Danger Zone section of `frontend/src/pages/Settings.tsx`: add confirmation modal with password input + "type DELETE to confirm" field, call `profileService.deleteAccount()`, on success call `authContext.logout()` and navigate to `/`

**Checkpoint**: Account deletion works. User redirected to landing page.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T056 [P] Add Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) to all new/modified endpoints in `backend/src/users/users.controller.ts` — ensure consistency with existing Swagger patterns
- [x] T057 [P] Verify `profileImage` URL is correctly displayed in forum components: check `frontend/src/pages/DiscussionDetailPage.tsx` and `frontend/src/pages/DiscussionPage.tsx` use `user.profileImage` with DiceBear fallback
- [x] T058 [P] Verify profile photo displays in `frontend/src/pages/Leaderboard.tsx` using `profileImage` field with DiceBear fallback
- [ ] T059 Run full end-to-end manual test using checklist from `specs/005-user-profile-settings/quickstart.md`
- [x] T060 Verify all new UI text uses translation keys — no hardcoded English/French strings in any new components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 Photo (Phase 3)**: Depends on Phase 2 — no other story dependencies
- **US2 Password (Phase 4)**: Depends on Phase 2 — no other story dependencies
- **US3 Editor Theme (Phase 5)**: Depends on Phase 2 — no other story dependencies
- **US4 Email (Phase 6)**: Depends on Phase 2 — no other story dependencies
- **US5 Language (Phase 7)**: Depends on Phase 2 — no other story dependencies
- **US6 Profile Stats (Phase 8)**: Depends on Phase 2 — no other story dependencies
- **US7 Settings Page (Phase 9)**: Depends on US1, US2, US3, US4, US5 (integrates all components)
- **US8 Delete Account (Phase 10)**: Depends on Phase 2 — no other story dependencies
- **Polish (Phase 11)**: Depends on all stories being complete

### User Story Dependencies

- **US1 (Photo)**: Independent after Phase 2
- **US2 (Password)**: Independent after Phase 2
- **US3 (Editor Theme)**: Independent after Phase 2
- **US4 (Email)**: Independent after Phase 2
- **US5 (Language)**: Independent after Phase 2
- **US6 (Stats)**: Independent after Phase 2
- **US7 (Settings Page)**: Depends on US1+US2+US3+US4+US5 (assembles all components)
- **US8 (Delete Account)**: Independent after Phase 2

### Within Each User Story

- Backend DTOs/service methods before controller endpoints
- Controller endpoints before frontend components
- Frontend components before page integration

### Parallel Opportunities

- T005 + T006 (frontend types) can run in parallel
- T008 + T009 + T010 (backend DTOs) can run in parallel
- T027 (PasswordStrength) can run in parallel with T024-T026 (backend)
- T033 (EditorThemeSelector) can run in parallel with T030-T031 (backend/context)
- US1, US2, US3, US4, US5, US6, US8 can ALL run in parallel after Phase 2

---

## Parallel Example: Phase 2 Foundation

```
# Launch all DTO creation tasks in parallel:
T008: Create ChangePasswordDto in backend/src/users/dto/change-password.dto.ts
T009: Create ChangeEmailDto in backend/src/users/dto/change-email.dto.ts
T010: Create DeleteAccountDto in backend/src/users/dto/delete-account.dto.ts
T014: Add translation keys to frontend/src/context/LanguageContext.tsx
```

## Parallel Example: After Phase 2 — Multiple Stories

```
# Developer A: User Story 1 (Photo Upload)
T015-T023: Backend + Frontend photo flow

# Developer B: User Story 2 + 4 (Password + Email)
T024-T029 then T037-T041

# Developer C: User Story 3 + 5 (Editor Theme + Language)
T030-T036 then T042-T045
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T014)
3. Complete Phase 3: User Story 1 — Photo Upload (T015-T023)
4. Complete Phase 4: User Story 2 — Password Change (T024-T029)
5. **STOP and VALIDATE**: Test photo + password independently
6. Deploy/demo if ready — core profile management is functional

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Photo) → Test → Deploy (image personalization)
3. US2 (Password) → Test → Deploy (security)
4. US3 (Editor Theme) → Test → Deploy (developer experience)
5. US4 (Email) + US5 (Language) → Test → Deploy (account management)
6. US6 (Stats) + US7 (Settings rewrite) → Test → Deploy (polish)
7. US8 (Delete Account) → Test → Deploy (compliance)
8. Polish → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story (except US7) is independently completable and testable
- US7 is the integration story that assembles all other components into the Settings page
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total tasks: 60
