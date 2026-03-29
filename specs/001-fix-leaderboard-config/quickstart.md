# Quickstart: Fix & Configure Leaderboard

## Prerequisites

- Backend running: `pnpm run start:dev` in `backend/`
- Frontend running: `pnpm run dev` in `frontend/`
- MongoDB database accessible
- At least one completed duel in the database (with `duelsWon`/`duelsLost` > 0)

## Verify the Fix

### 1. Check API (Swagger)

Open `http://localhost:4000/api/docs` in your browser.

1. **Test `GET /api/leaderboard`** → Verify each entry has `duelsWon`, `duelsLost`,
   `duelsTotal`, `winRate`, and `rank` fields.
2. **Test `GET /api/leaderboard?language=javascript`** → Verify filtered results.
3. **Test `GET /api/leaderboard/me`** (requires auth) → Verify `username`, `profileImage`,
   `duelsWon`, `duelsLost`, `winRate`, `eloRank` are present.
4. **Test `GET /api/leaderboard/languages`** → Verify returns array of language strings.

### 2. Check Frontend

Open `http://localhost:3000/leaderboard` in your browser.

1. **Global tab**: Wins, Losses, and Win Rate columns should show correct values.
2. **Your Position card**: Should show your rank, username, ELO, wins, losses.
3. **By Language tab**: Should show a dropdown with available languages.
4. **Edge case**: A user with 0 duels should show "0.0%" Win Rate (no NaN/errors).

### 3. Check Atomic Transactions

After completing a duel:
1. Open Prisma Studio (`http://localhost:5555`)
2. In the `Duel` collection, verify the latest completed duel has `player1Language`
   and `player2Language` fields populated.
3. In the `User` collection, verify both players' `duelsWon`/`duelsLost`/`duelsTotal`
   were updated correctly.
