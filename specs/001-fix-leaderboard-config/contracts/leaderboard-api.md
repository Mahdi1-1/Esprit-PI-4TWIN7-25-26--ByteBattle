# API Contracts: Leaderboard

Base path: `/api/leaderboard`

## GET /api/leaderboard

Global leaderboard with optional filters and sorting.

### Query Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 50 | Results per page (max 100) |
| `sort` | string | No | `elo` | Sort field: `elo`, `xp`, `level`, `winRate` |
| `language` | string | No | — | Filter by programming language (e.g., `javascript`) |

### Response 200

```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "player1",
      "profileImage": "https://example.com/avatar.jpg",
      "level": 5,
      "xp": 1250,
      "elo": 1425,
      "duelsWon": 12,
      "duelsLost": 3,
      "duelsTotal": 15,
      "winRate": 80.0,
      "rank": 1
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

**Notes**:
- `winRate` is computed as `(duelsWon / (duelsWon + duelsLost)) * 100`, with 1 decimal
- When `duelsWon + duelsLost = 0`, `winRate` = `0.0`
- When `language` is provided, `duelsWon`/`duelsLost`/`winRate` reflect stats for that
  language only

---

## GET /api/leaderboard/me

Current authenticated user's rank and stats. Requires Bearer token.

### Response 200

```json
{
  "eloRank": 7,
  "username": "currentPlayer",
  "profileImage": "https://example.com/me.jpg",
  "elo": 1350,
  "xp": 800,
  "level": 3,
  "duelsWon": 8,
  "duelsLost": 4,
  "duelsTotal": 12,
  "winRate": 66.7
}
```

### Response 401

```json
{ "statusCode": 401, "message": "Unauthorized" }
```

### Response 404

```json
{ "statusCode": 404, "message": "User not found" }
```

---

## GET /api/leaderboard/stats

Current user's detailed statistics. Requires Bearer token.

*(Unchanged from current implementation — challenge stats only)*

### Response 200

```json
{
  "totalSubmissions": 45,
  "accepted": 30,
  "solvedChallenges": 12,
  "discussions": 5,
  "acceptRate": 67
}
```

---

## GET /api/leaderboard/languages

List of programming languages available for filtering.

### Response 200

```json
{
  "languages": ["c++", "java", "javascript", "python", "typescript"]
}
```

**Notes**:
- Only includes languages from completed duels where at least one player used that language
- Sorted alphabetically
- Lowercase, matching the format stored in `Duel.player1Language`/`player2Language`
