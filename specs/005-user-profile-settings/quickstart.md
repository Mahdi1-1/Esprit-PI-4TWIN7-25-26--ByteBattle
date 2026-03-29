# Quickstart: User Profile & Settings

**Branch**: `005-user-profile-settings`
**Date**: 2026-03-25

## Prerequisites

- Node.js 18+ installed
- pnpm installed
- MongoDB running and accessible (via `DATABASE_URL` in `.env`)
- Backend running on port 4000 (`pnpm run start:dev`)
- Frontend running on port 3000 (`pnpm run dev`)

## Setup Steps

### 1. Install New Backend Dependency

```bash
cd backend
pnpm add @nestjs/throttler
```

> **Note**: `sharp`, `multer`, `@nestjs/platform-express`, `bcryptjs`, and `class-validator` are already installed.

### 2. Update Prisma Schema

Add the new fields to the `User` model in `backend/prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields ...

  bio                String?
  editorTheme        String     @default("vs-dark")
  preferredLanguage  String     @default("en")
  lastLogin          DateTime?
}
```

### 3. Push Schema Changes

```bash
cd backend
npx prisma db push
npx prisma generate
```

> MongoDB does not use migrations — `db push` updates the schema directly.

### 4. Create Uploads Directory

```bash
mkdir -p backend/uploads/avatars
echo "uploads/" >> backend/.gitignore
```

### 5. Restart Backend

```bash
# Kill existing backend process
# Then restart:
cd backend
pnpm run start:dev
```

### 6. Verify

1. Open Prisma Studio: `npx prisma studio` → Check User model has new fields
2. Open Swagger: `http://localhost:4000/api/docs` → New endpoints visible
3. Open Frontend: `http://localhost:3000/settings` → Settings page working

## Key Files to Edit

### Backend (in order)
1. `backend/prisma/schema.prisma` — Add 4 new User fields
2. `backend/src/users/dto/update-user.dto.ts` — Add bio, editorTheme, preferredLanguage
3. `backend/src/users/dto/change-password.dto.ts` — NEW: password change DTO
4. `backend/src/users/dto/change-email.dto.ts` — NEW: email change DTO
5. `backend/src/users/users.service.ts` — Add new methods
6. `backend/src/users/users.controller.ts` — Add new endpoints
7. `backend/src/users/users.module.ts` — Add MulterModule, ThrottlerModule
8. `backend/src/auth/auth.service.ts` — Update lastLogin on login

### Frontend (in order)
1. `frontend/src/data/models.ts` — Add new User fields
2. `frontend/src/types/editor-theme.types.ts` — NEW: editor theme types
3. `frontend/src/services/profileService.ts` — NEW: API service
4. `frontend/src/context/AuthContext.tsx` — Add updateUser method
5. `frontend/src/context/EditorThemeContext.tsx` — NEW: editor theme context
6. `frontend/src/context/LanguageContext.tsx` — Sync with backend
7. `frontend/src/components/settings/*.tsx` — NEW: settings sub-components
8. `frontend/src/pages/Settings.tsx` — Rewrite with connected forms
9. `frontend/src/pages/Profile.tsx` — Fetch and display real stats
10. `frontend/src/pages/Problem.tsx` — Use EditorThemeContext for Monaco theme
11. `frontend/src/pages/DuelRoom.tsx` — Use EditorThemeContext for Monaco theme

## Environment Variables

No new environment variables required. Existing variables used:
- `DATABASE_URL` — MongoDB connection string
- `JWT_SECRET` — JWT signing key
- `FRONTEND_URL` — Frontend URL for CORS/redirects

## Testing Checklist

- [ ] Upload a profile photo → appears in navbar and profile page
- [ ] Delete profile photo → DiceBear fallback shown
- [ ] Change password (correct old password) → success message
- [ ] Change password (wrong old password) → error message
- [ ] Change email → new email shown in profile
- [ ] Change editor theme → reflected in Problem page editor
- [ ] Change language → UI updates immediately
- [ ] Login again → language preference restored from backend
- [ ] View profile stats → all numbers match expected values
- [ ] OAuth user → password/email forms disabled
- [ ] Delete account → logged out, cannot login with old credentials
