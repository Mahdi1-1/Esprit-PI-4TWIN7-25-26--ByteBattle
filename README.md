<div align="center">

# ⚔️ ByteBattle

### Competitive Programming Platform

[![NestJS](https://img.shields.io/badge/Backend-NestJS-e0234e?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47a248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2d3748?style=for-the-badge&logo=prisma)](https://prisma.io/)
[![Docker](https://img.shields.io/badge/Judge-Docker-2496ed?style=for-the-badge&logo=docker)](https://docker.com/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6?style=for-the-badge&logo=typescript)](https://typescriptlang.org/)

*A full-stack competitive programming platform featuring real-time 1v1 duels, hackathons, AI-assisted learning, and gamified progression.*

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎮 Core
| Feature | Description |
|---------|-------------|
| **Solo Mode** | Solve coding challenges with real-time code execution |
| **1v1 Duels** | Real-time competitive duels with ELO ranking system |
| **Hackathons** | Create and manage team-based hackathon competitions |
| **Leaderboard** | Global and per-language rankings |

### 🤖 AI-Powered
| Feature | Description |
|---------|-------------|
| **AI Hints** | Get contextual hints without spoiling the solution |
| **Code Review** | AI-powered code analysis and feedback |
| **Problem Generation** | Dynamically generate new challenges |

### 🎨 Gamification
| Feature | Description |
|---------|-------------|
| **XP & Levels** | Earn XP from solving problems and winning duels |
| **Themes** | Unlock visual themes as you level up |
| **Badges** | Earn achievement badges (First Blood, Speed Demon...) |
| **3D Avatar** | Customize your ReadyPlayerMe 3D avatar |

### 🏢 Enterprise
| Feature | Description |
|---------|-------------|
| **Technical Interviews** | Companies can create coding assessments |
| **Canvas Challenges** | Architecture/design challenges with visual editor |
| **Discussion Forum** | Community discussions with upvotes |

### 🔐 Admin
| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time platform analytics |
| **User Management** | Manage users, roles, bans |
| **Challenge CRUD** | Create, edit, publish challenges |
| **Hackathon Management** | Full lifecycle management (draft → archived) |

---

## 🏗 Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│   MongoDB    │
│   React/TS   │     │   NestJS     │     │   (Prisma)   │
│   Port 3000  │     │   Port 4001  │     │   Port 27017 │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────▼───────┐     ┌──────────────┐
                    │   WebSocket  │     │ Judge Worker  │
                    │   Gateway    │     │   (Docker)    │
                    │  (Socket.IO) │     │   Port 4002   │
                    └──────────────┘     └──────────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │  Sandboxed Containers│
                                    │  Python/JS/C++/Java  │
                                    └─────────────────────┘
```

### Kubernetes Node Layout

The current Kubernetes deployment is designed around the following node layout:

```text
mahdi-masmoudi-vivobook-asuslaptop-x515ep-x515ep
├── Kubernetes Control Plane
├── Jenkins
├── Helm
├── Ingress Controller
└── kubectl admin

adam-vm
├── Frontend React
├── Backend NestJS
└── WebSocket Gateway

sabri-vm
├── Judge Worker
├── MongoDB
├── Redis
├── Prometheus
└── Grafana
```

---

## 🛠 Tech Stack

### Backend
- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **Database:** MongoDB with Prisma ORM
- **Auth:** JWT + Google OAuth 2.0 (Passport.js)
- **Real-time:** Socket.IO (WebSocket gateway)
- **File Upload:** Multer
- **Validation:** class-validator / class-transformer
- **AI:** OpenAI API integration

### Frontend
- **Framework:** React 18 with TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS with CSS variables (theming)
- **Code Editor:** Monaco Editor (VS Code engine)
- **3D Avatar:** ReadyPlayerMe integration
- **Icons:** Lucide React
- **HTTP:** Axios
- **Real-time:** Socket.IO Client

### Judge Worker
- **Runtime:** Node.js
- **Containerization:** Docker (sandboxed execution)
- **Supported Languages:** Python, JavaScript, TypeScript, C, C++, Java, Go, Rust

### DevOps
- **Package Manager:** pnpm
- **Database:** MongoDB (local or Atlas)
- **Containerization:** Docker & Docker Compose

---

## 📁 Project Structure

```
ByteBattle2-officiel/
├── backend/                    # NestJS API server
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── auth/               # JWT + Google OAuth
│   │   ├── users/              # User management
│   │   ├── challenges/         # Problem CRUD
│   │   ├── submissions/        # Code execution
│   │   ├── duels/              # 1v1 real-time duels
│   │   ├── hackathons/         # Hackathon management
│   │   ├── leaderboard/        # Rankings
│   │   ├── discussions/        # Forum
│   │   ├── ai/                 # AI hints & review
│   │   ├── canvas/             # Canvas challenges
│   │   ├── enterprise/         # Enterprise features
│   │   └── admin/              # Admin dashboard
│   └── package.json
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   │   ├── admin/          # Admin pages
│   │   │   └── ...             # User-facing pages
│   │   ├── context/            # React contexts (Auth, Theme...)
│   │   ├── services/           # API service layer
│   │   ├── hooks/              # Custom React hooks
│   │   ├── data/               # Models & types
│   │   └── routes.tsx          # Route definitions
│   └── package.json
│
├── judge-worker/               # Code execution microservice
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   └── index.ts            # Docker-based code runner
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** (recommended) or npm
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Docker** (for judge-worker code execution)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ByteBattle2-officiel.git
cd ByteBattle2-officiel
```

### 2. Install dependencies

```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install

# Judge Worker
cd ../judge-worker
pnpm install
```

### 3. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values (see Environment Variables section)

# Frontend (optional)
cp frontend/.env.example frontend/.env
```

### 4. Setup the database

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 5. Start the services

```bash
# Terminal 1 — Backend
cd backend
pnpm run start:dev

# Terminal 2 — Frontend
cd frontend
pnpm run dev

# Terminal 3 — Judge Worker
cd judge-worker
pnpm run start:dev
```

### 6. Open the app

```
Frontend:     http://localhost:3000
Backend API:  http://localhost:4001/api
Judge Worker: http://localhost:4002
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL="mongodb://localhost:27017/bytebattle"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4001/api/auth/google/callback"

# OpenAI (for AI features)
OPENAI_API_KEY="sk-your-openai-api-key"

# Judge Worker
JUDGE_WORKER_URL="http://localhost:4002"

# Server
PORT=4001
FRONTEND_URL="http://localhost:3000"
```

---

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login with email/password |
| `GET` | `/api/auth/google` | Google OAuth login |
| `GET` | `/api/auth/me` | Get current user profile |
| `POST` | `/api/auth/refresh` | Refresh access token |

### Challenges
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/challenges` | List all challenges |
| `GET` | `/api/challenges/:id` | Get challenge details |
| `POST` | `/api/challenges` | Create challenge (admin) |
| `PATCH` | `/api/challenges/:id` | Update challenge (admin) |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/submissions` | Submit code for evaluation |
| `GET` | `/api/submissions/my` | Get my submissions |

### Duels
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/duels/queue` | Join matchmaking queue |
| `GET` | `/api/duels/:id` | Get duel details |
| `GET` | `/api/duels/leaderboard` | Get duel rankings |

### Hackathons
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/hackathons` | List hackathons |
| `POST` | `/api/hackathons` | Create hackathon (admin) |
| `PATCH` | `/api/hackathons/:id` | Update hackathon |
| `POST` | `/api/hackathons/:id/join` | Join a hackathon |

### Leaderboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leaderboard` | Global leaderboard |
| `GET` | `/api/leaderboard/language/:lang` | Per-language ranking |

---

## 📸 Screenshots

> *Add screenshots of your application here*

| Dashboard | Duel Arena | Hackathon |
|-----------|-----------|-----------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Duel](docs/screenshots/duel.png) | ![Hackathon](docs/screenshots/hackathon.png) |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by the ByteBattle Team**

⚔️ *Code. Compete. Conquer.* ⚔️

</div>
