# Research: Fix & Configure Leaderboard

## Decision 1: Language Filter Data Source

**Decision**: Add `player1Language` and `player2Language` optional String fields to the
`Duel` model in Prisma schema. Persist them when `endDuel()` is called by reading from
the Redis `DuelPlayerState.language`.

**Rationale**: The language information is currently only available in the transient Redis
`DuelPlayerState.language` field during a duel. The `Submission` model has a `language`
field, but submissions for challenges are not directly linked to duels. Adding fields to
Duel is the cleanest approach because:
- It directly associates language used with the duel outcome (win/loss)
- It enables efficient aggregation queries without cross-collection joins
- MongoDB handles optional fields without schema migrations

**Alternatives considered**:
- *Using Submission.language via cross-reference*: Would require joining Submissions to
  Duels via challengeId + userId + timestamp proximity. Unreliable and slow in MongoDB.
- *Storing language in DuelEvent*: Already partially there (test events include language
  in the Redis state), but DuelEvent is a nested JSON array — not queryable by Prisma.
- *Creating a separate DuelSubmission model*: Overkill for just storing a language string.

## Decision 2: Win Rate Computation Strategy

**Decision**: Compute Win Rate at query time in the `LeaderboardService`, not as a stored
field. Formula: `(duelsWon / (duelsWon + duelsLost)) * 100`.

**Rationale**:
- `duelsWon` and `duelsLost` are already stored on the User model and incremented atomically.
- Computing at query time avoids data inconsistency (stored Win Rate could drift from
  actual stats).
- The computation is trivial (a division) and adds negligible overhead.
- MongoDB cannot sort by computed fields natively, so for `sort=winRate`, we fetch all
  qualifying users and sort in-memory (acceptable for leaderboard scale ~hundreds of active
  duel players).

**Alternatives considered**:
- *Stored winRate field*: Would require updating it on every duel completion — adds
  another field to the transaction. Could drift if transaction fails partially.
- *MongoDB aggregation pipeline*: Prisma doesn't support `$addFields` in findMany. Would
  need raw queries via `prisma.$runCommandRaw`.

## Decision 3: Language Filter UX Pattern

**Decision**: Use a dropdown selector within the "By Language" tab, populated dynamically
from a new `GET /leaderboard/languages` endpoint.

**Rationale**:
- Dynamic population ensures only languages with actual data appear.
- A dedicated endpoint avoids fetching all duel data just to extract language options.
- The dropdown pattern is consistent with the existing tab-based UI.

## Decision 4: Atomic Transaction Pattern for MongoDB

**Decision**: Use Prisma's `$transaction` API with an array of operations for `endDuel()`.

**Rationale**: MongoDB supports multi-document transactions since v4.0. Prisma's
`$transaction([...])` wraps all operations in a single MongoDB transaction, guaranteeing
atomicity as required by Constitution Principle VIII.

**Note**: MongoDB transactions require a replica set. The existing deployment already uses
a replica set (MongoDB Atlas or local replica set), as the Prisma schema uses ObjectId
auto-generation which works on all MongoDB deployments.
