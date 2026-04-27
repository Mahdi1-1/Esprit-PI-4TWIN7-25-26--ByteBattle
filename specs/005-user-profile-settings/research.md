# Research: User Profile & Settings

**Branch**: `005-user-profile-settings`
**Date**: 2026-03-25
**Purpose**: Resolve all technical unknowns and document best practices for implementation.

## R1: Profile Photo Upload Strategy (NestJS + Multer + Sharp)

**Decision**: Use NestJS `@nestjs/platform-express` Multer integration with Sharp for server-side image processing.

**Rationale**:
- Multer is already a dependency of NestJS platform-express (no new install needed).
- Sharp is already listed in the approved technology stack (Constitution).
- The existing `avatar` module already uses a file-serving pattern (`avatar/file/:filename`) that can be referenced.
- Images stored in `uploads/avatars/` on the server filesystem, referenced by URL path in the User's `profileImage` field.

**Alternatives Considered**:
- Cloud storage (S3/GCS): Rejected — adds external dependency and cost. Local storage is sufficient for current scale.
- Base64 in database: Rejected — bloats MongoDB documents, poor performance for serving.

**Implementation Pattern**:
```
1. Frontend sends multipart/form-data POST to /api/users/me/photo
2. Multer middleware validates file type (image/jpeg, image/png, image/webp) and size (≤5MB)
3. Sharp resizes to 200x200, converts to WebP for consistency
4. File saved as uploads/avatars/{userId}.webp
5. User.profileImage updated to /api/users/photo/{userId}.webp
6. Old file deleted if exists
7. Frontend receives updated user object, dispatches 'user-profile-updated' event
```

---

## R2: Code Editor Theme — Monaco Editor Integration

**Decision**: Create `EditorThemeContext` that provides the current editor theme string. All `<Editor />` (Monaco) instances read from this context instead of hardcoded `"vs-dark"`.

**Rationale**:
- Monaco Editor (`@monaco-editor/react` v4.7.0) is already installed and used in `Problem.tsx` (line 595) and `DuelRoom.tsx` (line 355) with hardcoded `theme="vs-dark"`.
- Monaco natively supports `vs-dark`, `vs-light`, and `hc-black`. Custom themes (Monokai, Dracula, etc.) can be defined via `monaco.editor.defineTheme()` before mounting.
- A React Context is the cleanest way to propagate the theme choice to multiple unrelated editor instances.

**Alternatives Considered**:
- Redux/Zustand global store: Rejected — overkill for a single preference. Context aligns with existing patterns (ThemeContext, LanguageContext).
- CSS variables: Not applicable — Monaco uses its own theme engine, not CSS.

**Monaco Theme Mapping**:
| User-facing name | Monaco theme ID |
|------------------|-----------------|
| Light (vs-light) | `vs` |
| Dark (vs-dark) | `vs-dark` |
| Monokai | `monokai` (custom, define via JSON) |
| GitHub Dark | `github-dark` (custom) |
| Dracula | `dracula` (custom) |
| One Dark Pro | `one-dark-pro` (custom) |
| Solarized Dark | `solarized-dark` (custom) |
| Solarized Light | `solarized-light` (custom) |

Custom themes will be defined using `monaco.editor.defineTheme()` with JSON color token definitions loaded once at app startup.

---

## R3: Password Change — Security Best Practices

**Decision**: Verify current password via bcrypt.compare, then hash new password with bcrypt (10 rounds), update in DB. Return success without exposing password data.

**Rationale**:
- bcryptjs is already used in `auth.service.ts` for password hashing and comparison.
- 10 rounds is already the established salt factor (line 33 of auth.service.ts).
- Rate limiting prevents brute-force attempts on the password verification.

**Alternatives Considered**:
- argon2: Better security properties but would require a new dependency and migration of existing passwords. Rejected to maintain consistency.

**Password Validation Rules** (enforced via class-validator on DTO):
- Minimum 8 characters: `@MinLength(8)`
- At least 1 uppercase: `@Matches(/[A-Z]/)`
- At least 1 digit: `@Matches(/[0-9]/)`
- At least 1 special character: `@Matches(/[!@#$%^&*(),.?":{}|<>]/)`

**Password Strength Algorithm** (frontend only):
- Weak: Meets <2 of the 4 criteria
- Medium: Meets 2-3 of the 4 criteria
- Strong: Meets all 4 criteria + length ≥12

---

## R4: Email Change — Uniqueness & Validation

**Decision**: Verify current password, check new email format and uniqueness, update atomically.

**Rationale**:
- Email has `@unique` constraint in Prisma schema — database enforces uniqueness.
- Password verification before email change prevents unauthorized changes.
- Email format validation via class-validator `@IsEmail()` decorator.
- MVP does not require email verification (documented in spec assumptions).

**Alternatives Considered**:
- Send verification email first: Deferred to post-MVP. Would require email service (SendGrid/SES) not in current stack.

---

## R5: Language Preference — Backend Sync Strategy

**Decision**: Extend `LanguageContext` to sync with backend on login (read) and on change (write). Add `preferredLanguage` field to User model.

**Rationale**:
- Current `LanguageContext` stores language in `localStorage` only (line 439).
- Adding backend persistence ensures language preference follows the user across devices.
- On login, `AuthContext` fetches user profile via `/auth/me` which will now include `preferredLanguage`.
- `LanguageContext` reads from user profile on mount, falls back to localStorage, then browser language.

**Sync Flow**:
```
Login → /auth/me returns { ..., preferredLanguage: "fr" }
       → LanguageContext.setLanguage("fr")
       → localStorage updated as backup

User changes language in Settings
       → PATCH /api/users/me { preferredLanguage: "en" }
       → LanguageContext.setLanguage("en")
       → localStorage updated
```

---

## R6: Profile Statistics — Data Aggregation

**Decision**: Create a dedicated `getProfileStats` service method that aggregates data from multiple collections in parallel.

**Rationale**:
- Most stats are already on the User model (elo, xp, level, duelsWon, duelsLost, duelsTotal).
- Additional counts (challenges solved, forum posts, comments) require `prisma.count()` queries on Submission, Discussion, and Comment models.
- Leaderboard position requires a count of users with higher ELO.
- All queries can run in parallel via `Promise.all()` for performance.

**Stats Source Mapping**:
| Stat | Source |
|------|--------|
| ELO, XP, Level | `User` model fields |
| Duels Won/Lost/Total | `User` model fields |
| Win Rate | Computed: `(duelsWon / (duelsWon + duelsLost)) * 100` |
| Challenges Solved | `Submission.count({ where: { userId, verdict: "accepted" } })` (distinct challengeId) |
| Forum Posts | `Discussion.count({ where: { authorId } })` |
| Comments | `Comment.count({ where: { authorId } })` |
| Leaderboard Position | `User.count({ where: { elo: { gt: user.elo } } }) + 1` |
| Date Joined | `User.createdAt` |
| Last Login | `User.lastLogin` (new field, set on login) |

---

## R7: Account Deletion Strategy

**Decision**: Hard-delete the user record. Related data (submissions, discussions, comments) are preserved with orphaned `userId`.

**Rationale**:
- MongoDB/Prisma does not have cascading deletes by default — related records simply have orphaned foreign keys.
- This is acceptable for a competitive platform where submission history and forum content have community value.
- The user must confirm with their password and type "DELETE" to prevent accidental deletions.

**Alternatives Considered**:
- Soft delete (status: "deleted"): More complex, requires filtering across all queries. Deferred to post-MVP if needed for compliance.
- Cascade delete all data: Destructive to community content. Rejected.

---

## R8: Rate Limiting on Sensitive Endpoints

**Decision**: Use NestJS `@nestjs/throttler` module for rate limiting password change and email change endpoints.

**Rationale**:
- Prevents brute-force password guessing on the change-password endpoint.
- `@nestjs/throttler` is the NestJS-native solution, minimal configuration needed.
- Apply 5 attempts per 15-minute window on password/email change endpoints.

**Alternatives Considered**:
- express-rate-limit middleware: Works but doesn't integrate as cleanly with NestJS decorator pattern.
- Redis-backed rate limiting: Overkill for MVP. In-memory throttle is sufficient.

---

## R9: Static File Serving for Profile Photos

**Decision**: Use NestJS `ServeStaticModule` or a custom controller endpoint (like the existing avatar file endpoint) to serve uploaded photos.

**Rationale**:
- The existing `AvatarController` already has a `@Get('file/:filename')` endpoint that serves files with `res.sendFile()`. The same pattern is reused.
- Profile photos are served at `/api/users/photo/:filename`.
- Cache-Control headers set to `public, max-age=3600` for browser caching.
- The `profileImage` field stores the relative URL path (e.g., `/api/users/photo/userId.webp`).
