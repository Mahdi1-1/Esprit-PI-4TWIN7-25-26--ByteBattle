# Feature Specification: Fix & Configure Leaderboard

**Feature Branch**: `001-fix-leaderboard-config`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "Corriger et configurer le leaderboard. Objectifs : 1. Calculer correctement le score, les parties gagnées/perdues et le win rate. 2. Afficher la position de l'utilisateur actuel (ranking). 3. Ajouter des filtres de classement par langage de programmation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Correct Score & Win Rate Display (Priority: P1)

As a player, I want to see accurate duel statistics (games won, games lost, and Win Rate)
on the leaderboard so that I can trust the ranking reflects actual performance.

**Why this priority**: The leaderboard currently displays zeros or incorrect data for wins,
losses, and Win Rate because the backend does not return duel statistics (`duelsWon`,
`duelsLost`, `duelsTotal`) and the frontend maps to non-existent fields (`u.wins`,
`u.losses`). This is a data integrity bug that undermines the platform's credibility.

**Independent Test**: Load the leaderboard page after at least one completed duel. Verify
that the displayed wins, losses, and Win Rate match the actual database values for each
player.

**Acceptance Scenarios**:

1. **Given** a player with 10 duels won and 5 duels lost, **When** the leaderboard loads,
   **Then** the player's row shows "10" wins, "5" losses, and "66.7%" Win Rate.
2. **Given** a player with 0 duels won and 0 duels lost, **When** the leaderboard loads,
   **Then** the player's row shows "0" wins, "0" losses, and "0.0%" Win Rate (no
   division-by-zero errors, no NaN).
3. **Given** a player with 3 duels won and 0 duels lost, **When** the leaderboard loads,
   **Then** the Win Rate shows "100.0%".
4. **Given** the leaderboard displays 50 players, **When** comparing each player's
   displayed values with database records, **Then** all values MUST match exactly
   (Win Rate = `(duelsWon / (duelsWon + duelsLost)) * 100`, displayed with one decimal).

---

### User Story 2 - Current User Ranking Position (Priority: P1)

As a logged-in player, I want to see my own ranking position highlighted on the leaderboard,
including my rank number, stats, and ELO, so I can track my progress.

**Why this priority**: The current user card exists in the UI but receives incomplete data
from the API (`/leaderboard/me` does not return username, profile image, or duel stats),
making the feature effectively broken.

**Independent Test**: Log in as a user who has played duels, visit the leaderboard page,
and verify the "Your Position" card shows the correct rank, username, avatar, ELO, wins,
and losses.

**Acceptance Scenarios**:

1. **Given** I am logged in and ranked 7th by ELO, **When** I view the leaderboard,
   **Then** the "Your Position" card shows "#7", my username, my avatar, my ELO, my wins,
   and my losses.
2. **Given** I am logged in but have never played a duel, **When** I view the leaderboard,
   **Then** the "Your Position" card shows my rank, username, ELO (default 1200), 0 wins,
   0 losses, and "0.0%" Win Rate.
3. **Given** I am not logged in, **When** I view the leaderboard, **Then** the "Your
   Position" card is not displayed.
4. **Given** I am ranked 1st, **When** I view the leaderboard, **Then** my entry in
   the leaderboard table is highlighted, and the "Your Position" card shows "#1".

---

### User Story 3 - Language Filter (Priority: P2)

As a player, I want to filter the leaderboard by programming language so I can see who
the best players are in a specific language (JavaScript, Python, etc.).

**Why this priority**: This is a new feature that adds value but does not fix existing
broken functionality. The "By Language" tab exists in the UI but has no backend support.

**Independent Test**: Select the "By Language" tab, choose "JavaScript" from the filter,
and verify that only players who have submitted code in JavaScript appear, ranked by their
stats within that language.

**Acceptance Scenarios**:

1. **Given** the leaderboard is loaded, **When** I click on the "By Language" tab, **Then**
   a language selector dropdown appears listing all programming languages used in completed
   duel submissions (e.g., JavaScript, Python, TypeScript, C++).
2. **Given** I select "Python" in the language filter, **When** the leaderboard reloads,
   **Then** I see only players who have submitted code in Python during duels, ranked by
   their winrate in duels where they used Python.
3. **Given** I select a language with no submissions, **When** the leaderboard reloads,
   **Then** an empty state message is shown (e.g., "No players found for this language").
4. **Given** I was viewing "By Language" with "Python" selected, **When** I click on the
   "Global" tab, **Then** the language filter is removed and all players are shown.

---

### Edge Cases

- What happens when the Win Rate formula divides by zero (0 wins + 0 losses)?
  → Display "0.0%" with no errors.
- What happens when two players have the same ELO?
  → Secondary sort by Win Rate descending, then by total duels descending.
- What happens when the user's rank changes between fetching the leaderboard and the
  user card? → Accept eventual consistency; rank reflects data at query time.
- What happens when a language has only one submission? → The player still appears in
  the language-filtered leaderboard, even if alone.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The leaderboard MUST display for each player: rank, username, avatar, ELO,
  duels won, duels lost, and Win Rate.
- **FR-002**: Win Rate MUST be calculated as `(Won / (Won + Lost)) * 100`, displayed
  with one decimal place (e.g., "73.2%"). When `Won + Lost = 0`, Win Rate MUST be "0.0%".
- **FR-003**: The system MUST provide the currently logged-in user's global rank position.
- **FR-004**: The user's rank card MUST show: rank number, username, avatar, ELO, wins,
  losses, and Win Rate.
- **FR-005**: The system MUST support filtering the leaderboard by programming language
  used in duel submissions.
- **FR-006**: The language filter MUST dynamically list only languages that have actual
  duel submissions.
- **FR-007**: The leaderboard MUST support pagination (default 50 per page).
- **FR-008**: The leaderboard MUST support sorting by: ELO (default), XP, level, or
  Win Rate.
- **FR-009**: Players with zero duels MAY appear in the global leaderboard (sorted to the
  bottom by default) but MUST NOT appear in language-filtered views unless they have
  submissions in that language.
- **FR-010**: The leaderboard MUST be accessible without authentication (public), but the
  current user's rank card requires authentication.

### Key Entities

- **User**: The player entity with duel statistics (`duelsWon`, `duelsLost`, `duelsTotal`,
  `elo`, `xp`, `level`) and profile data (`username`, `profileImage`).
- **Duel**: Completed game record linking two players, a challenge, scores, and timing.
  Contains the language used by each player via the duel state.
- **Submission**: Code submission record containing the programming language used.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All displayed Win Rate values match the canonical formula
  `(Won / (Won + Lost)) * 100` with zero discrepancies across all leaderboard entries.
- **SC-002**: The logged-in user sees their correct rank position on every leaderboard
  visit, matching their actual ELO-based rank in the database.
- **SC-003**: Users can filter the leaderboard by at least 3 different programming languages
  and see accurate per-language statistics.
- **SC-004**: The leaderboard page loads within 2 seconds with 50 entries displayed.
- **SC-005**: Zero division-by-zero errors or NaN values displayed on the leaderboard for
  any player, regardless of their duel history.

## Assumptions

- The duel language data can be derived from existing `Submission` records or from the
  duel state stored in Redis/database. No new schema fields are required for language
  tracking since `Submission.language` already exists.
- The "This Month" tab (monthly filter) is out of scope for this specification. It will
  be addressed in a separate feature.
- The existing ELO-based ranking algorithm is correct and does not need changes. Only the
  data exposure and display are broken.
- Win Rate sorting is computed at query time; no precomputed `winRate` field is stored
  in the database.
