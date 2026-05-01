# Leaderboard Feature Documentation

## Overview
The Leaderboard system tracks and displays player rankings based on ELO, Experience Points (XP), and Level, alongside their Win/Loss records in duels. The system now supports dynamic recalculation and filtering based on the programming languages used during duels.

## Core Metrics
- **ELO**: The primary ranking score, gained or lost based on duel outcomes.
- **XP / Level**: Progression metrics tracking overall engagement.
- **Wins/Losses**: Number of duels won and lost.
- **Win Rate**: Canonical formula `(Won / (Won + Lost)) * 100`, rounded to 1 decimal place. It is computed dynamically.

## Scoring Constants
Defined in `backend/src/duels/duels.constants.ts`:
- **ELO**: Win (+25), Loss (-15)
- **XP**: Win (+100), Draw (+50), Loss (+25)

## API Endpoints

### 1. `GET /leaderboard`
Fetches the global leaderboard.
- **Query Parameters**:
  - `page` (number): Pagination page (default: 1)
  - `limit` (number): Number of entries per page (default: 50)
  - `sort` (string): Metric to sort by (`elo`, `xp`, `level`, or `winRate`). Default: `elo`.
  - `language` (string): Filter to recalculate ranks and W/L specifically for a programming language.
- **Response**: Paginated `data` array of user stats (including computed `winRate`), total count, page, and limit.

### 2. `GET /leaderboard/languages`
- **Description**: Returns all distinct programming languages used by players in completed duels.
- **Response**: `{ languages: string[] }` (alphabetically sorted).

### 3. `GET /leaderboard/me`
- **Description**: Returns the authenticated user's current rank, ELO, XP, Level, and cumulative duel statistics.
- **Response**: Includes `rank`, `username`, `elo`, `duelsWon`, `duelsLost`, `winRate`, etc.

## Data Consistency
Duel status transitions and user scoring (ELO/XP updates) are wrapped in atomic database operations (`prisma.$transaction`) within `DuelsService.endDuel()` to prevent data anomalies.
