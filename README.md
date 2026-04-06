# ByteBattle — US Ciblées

## User Stories incluses

| US     | Description                                       | Pages / Modules                                |
|--------|---------------------------------------------------|------------------------------------------------|
| US-004 | Déconnexion sécurisée                             | Login.tsx · auth/                              |
| US-008 | Profil public pour partage de succès              | PublicProfile.tsx · users/                     |
| US-012 | Filtrage avancé du catalogue                      | Problems.tsx · challenges/                     |
| US-016 | Exécution sur tests d'exemples                    | Problem.tsx · submissions/                     |
| US-020 | Soumission finale du dessin Canvas                | CanvasEditor.tsx · challenges/                 |
| US-024 | Demande d'indice intelligent à l'IA               | Problem.tsx · ai/                              |
| US-028 | Système de matchmaking par Elo                    | DuelMatchmaking.tsx · duels/                   |
| US-032 | Lobby d'attente des hackathons                    | HackathonLobby.tsx · hackathons/               |
| US-036 | Édition de code collaborative (Pair programming)  | DuelRoom.tsx · duels/ · useCollabEditor        |
| US-040 | Système de progression XP et Niveaux              | Leaderboard.tsx · badges/ · leaderboard/       |
| US-044 | Dashboard KPI pour administrateurs                | AdminDashboard.tsx · admin/                    |
| US-048 | État des files d'attente de traitement            | AdminMonitoring.tsx · queue/                   |
| US-056 | Création de nouvelles discussions                 | NewDiscussionPage.tsx · discussions/           |
| US-060 | Consultation du détail d'une discussion           | DiscussionDetailPage.tsx · discussions/        |
| US-064 | Ajout de commentaires                             | DiscussionDetailPage.tsx · discussions/        |
| US-068 | Votes sur les commentaires                        | DiscussionDetailPage.tsx · discussions/        |
| US-072 | Step-by-step pour les algorithmes de tri          | DataStructuresPage.tsx · visualizers/          |
| US-076 | Métriques en temps réel des structures            | DataStructuresPage.tsx · visualizers/          |
| US-080 | Traversées d'arbres (In-order, etc.)              | DataStructuresPage.tsx · visualizers/          |
| US-084 | Interface responsive pour le visualiseur mobile   | DataStructuresPage.tsx                         |
| US-088 | Soumission de code en cours d'entretien IA        | AIInterviewPage.tsx · interviews/              |
| US-092 | Rendu Markdown des réponses de l'IA               | AIInterviewPage.tsx · ai/                     |

## Installation

### Prérequis
- Node.js 18+, pnpm, MongoDB, Redis

### Backend
```bash
cd backend
pnpm install
cp .env.example .env   # remplir les variables
npx prisma generate
pnpm run start:dev     # port 4001
```

### Frontend
```bash
cd frontend
pnpm install
pnpm run dev           # port 5173
```

## Variables d'environnement (.env)
```
DATABASE_URL=mongodb://localhost:27017/bytebattle
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:4001/api/auth/google/callback
PORT=4001
```
