# Data Model: User Profile & Settings

**Branch**: `005-user-profile-settings`
**Date**: 2026-03-25

## Entity Changes

### User (MODIFY — extends existing model)

The existing `User` model in `backend/prisma/schema.prisma` is extended with 4 new fields. No new models are introduced.

#### New Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bio` | `String?` | `null` | Short user bio, max 250 characters |
| `editorTheme` | `String` | `"vs-dark"` | Selected Monaco editor theme identifier |
| `preferredLanguage` | `String` | `"en"` | User's preferred language code (`"en"` or `"fr"`) |
| `lastLogin` | `DateTime?` | `null` | Timestamp of the user's last login |

#### Updated Prisma Schema (diff)

```prisma
model User {
  // ... existing fields ...

  // NEW: Profile & Settings fields
  bio                String?    // Max 250 chars, enforced via DTO validation
  editorTheme        String     @default("vs-dark")
  preferredLanguage  String     @default("en")
  lastLogin          DateTime?

  // ... existing relations unchanged ...
}
```

#### Existing Fields Used (no changes)

| Field | Type | Usage in this feature |
|-------|------|-----------------------|
| `profileImage` | `String?` | Stores URL path to uploaded profile photo |
| `email` | `String @unique` | Email change: validate uniqueness |
| `passwordHash` | `String?` | Password change: verify old, store new |
| `isOAuthUser` | `Boolean` | Determine if password/email change is disabled |
| `provider` | `String` | Determine if account is Google-managed |
| `elo` | `Int` | Profile stats display |
| `xp` | `Int` | Profile stats display |
| `level` | `Int` | Profile stats display |
| `duelsWon` | `Int` | Profile stats + Win Rate calculation |
| `duelsLost` | `Int` | Profile stats + Win Rate calculation |
| `duelsTotal` | `Int` | Profile stats display |
| `createdAt` | `DateTime` | Profile stats: "Date joined" |
| `googleId` | `String?` | Check if Google account is linked |

### ProfileImage (filesystem — not a Prisma model)

Profile photos are stored on the server filesystem, not in the database.

| Attribute | Value |
|-----------|-------|
| **Storage path** | `backend/uploads/avatars/{userId}.webp` |
| **URL path** | `/api/users/photo/{userId}.webp` |
| **Format** | WebP (converted from JPG/PNG/WebP input by Sharp) |
| **Dimensions** | 200 × 200 pixels |
| **Max upload size** | 5 MB (before processing) |
| **DB reference** | `User.profileImage` stores the URL path |

## Validation Rules

### Bio Field
- Maximum 250 characters
- Optional (nullable)
- No HTML/script tags (strip on backend if present)
- Validated via `@MaxLength(250)` class-validator decorator

### Editor Theme Field
- Must be one of: `vs-dark`, `vs`, `monokai`, `github-dark`, `dracula`, `one-dark-pro`, `solarized-dark`, `solarized-light`
- Validated via `@IsIn([...])` class-validator decorator
- Default: `vs-dark`

### Preferred Language Field
- Must be one of: `en`, `fr`
- Validated via `@IsIn(['en', 'fr'])` class-validator decorator
- Default: `en`

### Password Change
- Current password: required, verified against stored hash
- New password: required, min 8 chars, at least 1 uppercase, 1 digit, 1 special char
- Confirmation: required, must match new password (validated on frontend)

### Email Change
- Current password: required, verified against stored hash
- New email: required, valid format (`@IsEmail()`), not already in use (`@unique` constraint)

### Profile Photo Upload
- File type: `image/jpeg`, `image/png`, `image/webp` (MIME validation)
- File size: ≤ 5 MB
- Single file upload per request

## State Transitions

No new state machines are introduced. The following operations are atomic:

1. **Photo upload**: Delete old file → Save new file → Update `profileImage` in DB
2. **Password change**: Verify old password → Hash new password → Update `passwordHash` in DB
3. **Email change**: Verify password → Check uniqueness → Update `email` in DB
4. **Account deletion**: Verify password → Delete `User` record → Logout

## Computed Values

| Value | Formula | Display |
|-------|---------|---------|
| **Win Rate** | `(duelsWon / (duelsWon + duelsLost)) * 100` | One decimal: `"73.2%"` |
| **Leaderboard Position** | `COUNT(users WHERE elo > currentUser.elo) + 1` | Integer: `#42` |
| **XP to Next Level** | `1000 * level` (simple formula, may be refined) | Integer: `2000` |

## Frontend Type Changes

### User Interface (in `data/models.ts`)

```typescript
export interface User {
  // ... existing fields ...

  // NEW fields
  bio?: string | null;
  editorTheme: string;
  preferredLanguage: string;
  lastLogin?: string | null;

  // Existing fields for stats (already present)
  duelsWon?: number;
  duelsLost?: number;
  duelsTotal?: number;
}
```

### New Types (in `types/editor-theme.types.ts`)

```typescript
export type EditorTheme =
  | 'vs-dark'
  | 'vs'
  | 'monokai'
  | 'github-dark'
  | 'dracula'
  | 'one-dark-pro'
  | 'solarized-dark'
  | 'solarized-light';

export const EDITOR_THEMES: { id: EditorTheme; label: string }[] = [
  { id: 'vs', label: 'Light (VS Light)' },
  { id: 'vs-dark', label: 'Dark (VS Dark)' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'github-dark', label: 'GitHub Dark' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'one-dark-pro', label: 'One Dark Pro' },
  { id: 'solarized-dark', label: 'Solarized Dark' },
  { id: 'solarized-light', label: 'Solarized Light' },
];
```
