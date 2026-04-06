# ByteBattle2-officiel Development Guidelines

Comprehensive project reference for AI-assisted development. Last updated: 2025-07-15

---

## Project Overview

ByteBattle is a competitive programming platform with AI-powered mock interviews, real-time duels, hackathons, a discussion forum, and a gamification system (badges, leaderboard). It is a monorepo with three main packages managed with **pnpm**.

---

## Active Technologies

### Backend (`backend/`)
| Technology | Version | Purpose |
|---|---|---|
| NestJS | 10.4 | REST API framework |
| Prisma | 6.3 | ORM (MongoDB provider) |
| MongoDB | — | Primary database |
| Redis / ioredis | 5.10 | Caching (`CacheModule`) |
| BullMQ | — | Job queue (judge worker) |
| Socket.io | 4.8.3 | Real-time WebSockets |
| Sharp | 0.34.5 | Image processing (Base64 storage) |
| Passport | — | Auth (JWT + Google OAuth2) |
| Google Cloud Speech / TTS | — | Optional voice AI (browser STT is default) |
| Multer | — | File upload handling (memory storage) |
| class-validator / class-transformer | — | DTO validation |
| Swagger (`@nestjs/swagger`) | — | API documentation |
| Jest | — | Unit testing |

### Frontend (`frontend/`)
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.4 | UI framework |
| Vite | 6.3.5 | Build tool / dev server |
| Tailwind CSS | latest | Utility-first CSS |
| React Router | 7.13.1 | Client-side routing |
| Axios | 1.13.5 | HTTP client |
| Socket.io-client | 4.8.3 | Real-time WebSocket client |
| Monaco Editor (`@monaco-editor/react`) | 4.7.0 | Code editor |
| Lucide React | 0.487.0 | Icon library |

### Judge Worker (`judge-worker/`)
| Technology | Purpose |
|---|---|
| NestJS | Microservice for code execution |
| Docker (sandboxes) | Isolated execution per language (C, C++, Go, Java, Node, Python, Rust, TypeScript) |
| BullMQ | Job consumption |

---

## Project Structure

```text
ByteBattle2-officiel/
├── backend/                  # NestJS API server
│   ├── prisma/
│   │   ├── schema.prisma     # MongoDB models (User, Challenge, Submission, Duel, etc.)
│   │   └── seed.ts           # Database seeding
│   └── src/
│       ├── main.ts           # App bootstrap
│       ├── app.module.ts     # Root module (import order matters!)
│       ├── admin/            # Admin panel endpoints
│       ├── ai/               # AI services (Gemini integration)
│       ├── auth/             # JWT + Google OAuth authentication
│       ├── avatar/           # Avatar generation
│       ├── badges/           # Gamification badges
│       ├── cache/            # Redis caching (global module)
│       ├── challenges/       # Programming challenges CRUD
│       ├── config/           # App configuration
│       ├── discussions/      # Discussion forum
│       ├── duels/            # Real-time competitive duels
│       ├── hackathons/       # Hackathon system
│       ├── interviews/       # AI mock interviews (voice + text)
│       ├── leaderboard/      # Global leaderboard
│       ├── notifications/    # Real-time notifications (WebSocket gateway)
│       ├── prisma/           # Prisma service
│       ├── queue/            # BullMQ queue module
│       ├── sandbox/          # Code execution sandbox
│       ├── submissions/      # Code submission handling
│       ├── users/            # User management, profile, settings
│       └── voice/            # Voice processing utilities
├── frontend/                 # React SPA
│   └── src/
│       ├── main.tsx          # App entry
│       ├── App.tsx           # Root component
│       ├── routes.tsx        # Route definitions
│       ├── api/              # API client setup
│       ├── components/       # Reusable UI components
│       ├── config/           # Frontend configuration
│       ├── constants/        # App constants
│       ├── context/          # React contexts
│       ├── hooks/            # Custom hooks
│       ├── pages/            # Page components
│       ├── services/         # Service layer (API calls)
│       ├── styles/           # CSS / theme files
│       ├── types/            # TypeScript type definitions
│       └── utils/            # Utility functions
├── judge-worker/             # Isolated code execution service
│   ├── prisma/schema.prisma
│   ├── sandbox/              # Dockerfiles per language
│   └── src/
├── specs/                    # Feature specifications (001–011)
├── docs/                     # Documentation & ADRs
└── plans/                    # Architecture plans
```

---

## Database Models (Prisma / MongoDB)

`User`, `Company`, `CompanyMember`, `Challenge`, `Submission`, `AIReview`, `Hackathon`, `Team`, `HackathonTeam`, `HackathonSubmission`, `HackathonMessage`, `HackathonAnnouncement`, `HackathonClarification`, `HackathonAuditLog`, `YjsDocumentSnapshot`, `Discussion`, `DiscussionRevision`, `Comment`, `Notification`, `NotificationPreference`, `InterviewSession`, `Badge`, `Report`, `AuditLog`, `Duel`

---

## Commands

### Backend
```bash
cd backend
pnpm start:dev          # Dev server with hot reload
pnpm build              # Production build
pnpm start:prod         # Run production build
pnpm prisma:generate    # Generate Prisma client
pnpm prisma:studio      # Open Prisma Studio GUI
pnpm prisma:seed        # Seed database (ts-node prisma/seed.ts)
pnpm test               # Run Jest tests
pnpm lint               # ESLint fix
```

### Frontend
```bash
cd frontend
pnpm dev                # Vite dev server
pnpm build              # Production build
```

### Judge Worker
```bash
cd judge-worker
# Build sandbox Docker images
cd sandbox && bash build-sandbox-images.sh
```

---

## Architecture Decisions & Conventions

### Module Import Order (`app.module.ts`)
`CacheModule` **must** be imported before all feature modules (right after `PrismaModule`) because many services depend on `CacheService`.

Order: `ConfigModule → BullModule → PrismaModule → CacheModule → AuthModule → UsersModule → ...feature modules... → NotificationsModule`

### Profile Images — Base64 in Database
Profile photos are **stored as Base64 data URIs directly in MongoDB** (not on the filesystem).
- Upload: `sharp(buffer).resize(200,200).webp({quality:80}).toBuffer()` → `data:image/webp;base64,...` → saved to `User.profileImage`
- Frontend: `getPhotoUrl()` handles `data:` URIs (returns as-is), `http` URLs (returns as-is), and legacy local filenames (builds full URL)

### Sharp Import (CommonJS Interop)
```typescript
import * as sharp from 'sharp';  // ✅ Correct
// import sharp from 'sharp';    // ❌ Breaks at runtime
```

### Authentication
- JWT + Google OAuth2 via Passport
- JWT payload: `{ sub: userId, email, role }`
- Guards: `JwtAuthGuard`, `RolesGuard`

### WebSocket Namespaces
- `/notifications` — Real-time notifications, online user tracking
- `/duels` — Duel matchmaking and gameplay
- `/hackathons` — Hackathon real-time features

### Voice / Speech-to-Text
- **Default mode**: Browser `SpeechRecognition` API (no server dependency)
- **Server mode**: Google Cloud Speech-to-Text (optional, requires credentials)
- Browser mode must **never** fall back to server STT
- Voice endpoint: `POST /interviews/:id/voice` with `FileInterceptor('audio', { storage: memoryStorage() })`

### Online Player Count
`NotificationsGateway.getOnlineUserCount()` returns real WebSocket connection count (`clientMaps.size`). Injected into `DuelsService` for queue stats.

### Error Handling Patterns (Frontend)
- HTTP 409 (Conflict): Show field-specific errors (email/username taken)
- HTTP 400 (Bad Request): Show validation errors
- Fallback: Generic error message

---

## Feature Specifications

| # | Feature | Description |
|---|---|---|
| 001 | Fix & Configure Leaderboard | Leaderboard configuration and ranking fixes |
| 002 | Interview Voice Messages | Voice message support in AI mock interviews |
| 003 | Interview AI — Domain Restructure | Professional domain restructuring for AI interviews |
| 004 | Discussion Forum | Community discussion forum with threads and comments |
| 005 | User Profile & Settings | Profile management, photo upload, password/email change |
| 006 | Multi-Variant Themes | Theme system with multiple visual variants |
| 007 | Judge Worker Architecture | Migration to isolated Docker-based code execution |
| 008 | Keyboard Shortcuts | System-wide keyboard shortcut support |
| 009 | Hackathon System | Team-based hackathon competition platform |
| 010 | Hackathon Workspace Features | Sequential problems, anti-cheat, chat & difficulty timers |
| 011 | Notification System | Real-time notification system with preferences |

Detailed specs are in `specs/001-*` through `specs/011-*/spec.md`.

---

## Recent Changes & Fixes

### Signup Error Handling
- `frontend/src/pages/Signup.tsx`: Handles 409 Conflict with field-specific messages (email/username taken)
- `frontend/src/components/Input.tsx`: Added `hint` prop for helper text below inputs

### Profile Photo — Base64 Storage
- `backend/src/users/users.service.ts`: `uploadProfilePhoto()` now stores images as Base64 data URIs in MongoDB (removed filesystem dependency)
- `deleteProfilePhoto()` guards against deleting OAuth profile URLs

### Duel Matchmaking Stats
- `backend/src/duels/duels.service.ts`: `getQueueStats()` uses real WebSocket online count via `NotificationsGateway`
- `backend/src/notifications/notifications.gateway.ts`: Added `getOnlineUserCount()` method
- `backend/src/notifications/notifications.module.ts`: Exports `NotificationsGateway`
- `frontend/src/pages/DuelMatchmaking.tsx`: 4-column info cards with "Players Online" display

### AI Interview Voice Endpoint
- `backend/src/interviews/interviews.controller.ts`: Added `POST :id/voice` endpoint
- `backend/src/interviews/interviews.module.ts`: Added `MulterModule` with memory storage
- `frontend/src/hooks/useVoiceRecorder.ts`: Browser STT no longer falls back to server; clear error messages

### Settings Page
- `frontend/src/pages/Settings.tsx`: Specific error display from server responses

---

## Code Style

- **Backend**: NestJS conventions — modules, controllers, services, DTOs, guards, interceptors
- **Frontend**: Functional React components, custom hooks, Tailwind utility classes
- **TypeScript**: Strict mode, interfaces over types where possible
- **Naming**: camelCase for variables/functions, PascalCase for classes/components, kebab-case for files
- **Validation**: `class-validator` decorators on DTOs
- **API docs**: Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`)
- **Testing**: Jest for backend unit tests

---

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
