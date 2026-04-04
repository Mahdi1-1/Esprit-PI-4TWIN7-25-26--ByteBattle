# Quick Start: Hackathon Workspace Features

**Feature**: 010-hackathon-workspace-features  
**Date**: 2026-03-31

## Prerequisites

- Node.js 18+
- pnpm installed globally
- MongoDB running (local or Atlas)
- Redis running (for Bull queue / judge-worker)
- Backend `.env` configured (`DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`)

## Setup

### 1. Install dependencies

```bash
cd /home/mahdi-masmoudi/Bureau/ByteBattle2-officiel
pnpm install           # root workspace
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 2. Generate Prisma client (after schema changes)

```bash
cd backend
npx prisma generate    # Regenerate client with new fields
npx prisma db push     # Push schema changes to MongoDB (no migrations needed for Mongo)
```

### 3. Start services

```bash
# Terminal 1: Backend
cd backend && pnpm run start:dev

# Terminal 2: Frontend
cd frontend && pnpm run dev

# Terminal 3: Judge Worker (optional, for submission judging)
cd judge-worker && pnpm run start:dev
```

### 4. Verify the feature

1. **Create a hackathon** via admin panel (`/admin/hackathons`)
   - Add 3+ challenges with varying difficulties (easy, medium, hard)
   - Transition: draft → lobby → checkin → active

2. **Join as participant** in another browser tab
   - Register a team, check in
   - Navigate to workspace (`/hackathon/:id/workspace`)

3. **Verify workspace features**:
   - ✅ Problem A is unlocked with full statement (description, examples, tests, hints)
   - ✅ Problems B, C are locked (show only label + difficulty)
   - ✅ Timer shows 15:00 for easy, 25:00 for medium, 40:00 for hard
   - ✅ Submit AC for Problem A → Problem B unlocks automatically
   - ✅ Problem A becomes read-only after AC
   - ✅ Chat: send a message → appears in real-time for all team members
   - ✅ Chat messages show sender username
   - ✅ Anti-cheat: switch tabs → warning overlay appears
   - ✅ Anti-cheat: Ctrl+C in editor → blocked; Ctrl+C in chat → allowed

## Schema Changes

Two new fields on `HackathonTeam`:

```prisma
model HackathonTeam {
  // ... existing fields ...
  anticheatViolations  Int    @default(0)     // Q3: Server-persisted violation count
  problemStartTimes    Json?                  // Q5: { "challengeId": "ISO timestamp" }
}
```

After editing `schema.prisma`, run:
```bash
cd backend && npx prisma generate && npx prisma db push
```

## Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/hackathons/:id/challenges?teamId=` | Sequential challenge list with lock/unlock state |
| POST | `/api/hackathons/:id/teams/:teamId/submit` | Submit code (with Q1 + Q7 guards) |
| GET | `/api/hackathons/:id/teams/:teamId/messages` | Chat history with username enrichment |

## Key WebSocket Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `team_message` | Client → Server | Send chat message |
| `team:message` | Server → Client | Broadcast chat message with username |
| `anticheat_event` | Client → Server | Report anti-cheat violation |
| `anticheat:violation_count` | Server → Client | Persisted violation count confirmation |
| `admin:anticheat_alert` | Server → Client | Real-time admin alert |
| `submission:verdict` | Server → Client | Judge verdict (triggers challenge reload on AC) |

## Troubleshooting

- **Timer not showing**: Ensure `getHackathonChallenges` is called with `teamId`. Without it, `startedAt` is always null.
- **Chat shows "Teammate" instead of username**: Check that `hackathon-chat.service.ts` has the Q4 enrichment code. Verify User model has `username` field.
- **Anti-cheat double-counting**: The 500ms debounce in `HackathonWorkspace.tsx` should prevent this. Check `lastViolationTimeRef`.
- **Solved problem still editable**: Clear browser cache — the `solved` flag comes from the backend response.
- **Prisma type errors after schema change**: Run `npx prisma generate` to regenerate the client.
