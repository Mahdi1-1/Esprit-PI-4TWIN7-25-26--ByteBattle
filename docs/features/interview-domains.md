# Interview AI — Professional Domain System

## Overview

The Interview AI feature has been transformed from a generic algorithm-topic interview system into a professional-grade interview simulator organized by **8 domains**, **3 difficulty levels**, and **2 languages**.

## Features

### 8 Professional Domains

| Domain | Icon | Description |
|--------|------|-------------|
| Cloud Computing | ☁️ | AWS, Azure, GCP architecture and services |
| Software Engineering | 💻 | Design patterns, clean code, architecture |
| Cybersecurity | 🔐 | Security best practices, threat modeling, compliance |
| Data Science & AI | 🤖 | Machine learning, deep learning, MLOps |
| Frontend Engineering | 🎨 | React, Vue, performance, accessibility |
| Backend Engineering | ⚙️ | APIs, databases, microservices |
| DevOps & SRE | 🚀 | Kubernetes, CI/CD, monitoring, reliability |
| Mobile Development | 📱 | iOS, Android, React Native, Flutter |

### Difficulty Levels

- **Easy**: For entry-level positions (25-35 min)
- **Medium**: For mid-level positions (40-50 min)
- **Hard**: For senior/lead positions (55-65 min)

### Languages

- 🇫🇷 **Français** (French)
- 🇬🇧 **English**

## Architecture

### Backend

```
backend/src/
├── ai/
│   ├── prompts/
│   │   ├── base.ts              # DomainPromptConfig interface
│   │   ├── index.ts             # Barrel export + DOMAIN_PROMPTS map
│   │   ├── cloud-computing.ts   # Cloud Computing domain prompt
│   │   ├── software-engineering.ts
│   │   ├── cybersecurity.ts
│   │   ├── data-science-ai.ts
│   │   ├── frontend-engineering.ts
│   │   ├── backend-engineering.ts
│   │   ├── devops-sre.ts
│   │   └── mobile-development.ts
│   ├── ai-interview.service.ts  # AI interview logic with domain support
│   └── ai.module.ts
├── interviews/
│   ├── dto/
│   │   └── interview.dto.ts     # StartInterviewDto with domain/language
│   ├── interviews.service.ts    # Business logic with getDomains()
│   ├── interviews.controller.ts # REST endpoints
│   └── interviews.module.ts
└── prisma/
    └── schema.prisma            # InterviewDomain, InterviewLanguage enums
```

### Frontend

```
frontend/src/
├── data/
│   └── interviewData.ts         # Type definitions + interviewDomains
├── services/
│   └── interviewsService.ts     # API client with domain/language params
└── pages/
    └── AIInterviewPage.tsx      # 3-step setup flow + enhanced review
```

## API Endpoints

### GET /interviews/domains
Returns all available interview domains with metadata.

**Response:**
```json
{
  "id": "CLOUD_COMPUTING",
  "label": "Cloud Computing",
  "icon": "☁️",
  "description": "AWS, Azure, GCP architecture...",
  "color": "#FF6B35",
  "subTopics": ["EC2/ECS/EKS", "Lambda", "S3", ...],
  "estimatedDurations": {
    "easy": "30 min",
    "medium": "45 min",
    "hard": "60 min"
  }
}
```

### POST /interviews/start
Starts a new interview session.

**Request Body:**
```json
{
  "difficulty": "medium",
  "domain": "CLOUD_COMPUTING",
  "language": "EN"
}
```

## Data Models

### InterviewSession (Prisma)
```prisma
model InterviewSession {
  id         String           @id
  userId     String
  difficulty Difficulty       // easy | medium | hard
  domain     InterviewDomain  // CLOUD_COMPUTING | ...
  language   InterviewLanguage @default(FR)
  verdict    String?          // HIRE | MAYBE | NO_HIRE
  messages   AIMessage[]
  feedback   Json?
  status     String
  tokensUsed Int
}
```

### InterviewFeedback (AI Response)
```typescript
interface InterviewFeedback {
  overallScore: number;           // 0-10
  technicalScore: number;         // 0-10
  communicationScore: number;      // 0-10
  problemSolvingScore: number;     // 0-10
  verdict: 'HIRE' | 'MAYBE' | 'NO_HIRE';
  competencyScores: {
    competency: string;
    score: number;
    feedback: string;
  }[];
  strengths: string[];
  improvements: string[];
  recommendedResources: {
    title: string;
    url: string;
    type: 'course' | 'article' | 'practice';
  }[];
  closingMessage: string;
}
```

## User Flow

### Setup (3-Step Wizard)
1. **Step 1 — Domain**: User selects from 8 professional domains
2. **Step 2 — Difficulty**: User selects Easy/Medium/Hard with estimated duration
3. **Step 3 — Language**: User selects French or English

### Interview
- AI interviewer introduces itself with domain-specific persona
- Questions are tailored to the selected domain and difficulty
- Follow-up questions explore depth based on responses
- Code reviews are domain-aware

### Review
- **Verdict Badge**: HIRE / MAYBE / NO HIRE with color coding
- **Competency Breakdown**: Domain-specific scoring
- **Strengths & Improvements**: Personalized feedback
- **Recommended Resources**: Learning materials based on weaknesses

## Domain Prompt Structure

Each domain prompt includes:

```typescript
interface DomainPromptConfig {
  domain: string;           // Display name
  domainEnum: string;       // Prisma enum value
  persona: {
    en: string;             // English persona description
    fr: string;             // French persona description
  };
  subTopics: string[];      // Topics covered in this domain
  questionsByLevel: {
    easy: string[];         // Reference questions for easy
    medium: string[];       // Reference questions for medium
    hard: string[];         // Reference questions for hard
  };
  evaluationCriteria: string[];  // Competencies to evaluate
  scoringGuidelines: string;     // How to score
}
```

## Verification

### Manual Testing
1. Start frontend (`pnpm run dev` in `frontend/`)
2. Start backend (`pnpm run start:dev` in `backend/`)
3. Navigate to AI Interview page
4. Verify 8 domain cards are displayed
5. Select a domain → verify difficulty options appear
6. Select difficulty → verify language options appear
7. Start interview → verify AI introduces with correct persona and language
8. Complete interview → verify verdict, competency scores, and resources are shown

### Automated Testing
```bash
# Verify schema changes
cd backend && npx prisma validate

# Regenerate Prisma client
cd backend && npx prisma generate

# Verify TypeScript compilation
cd backend && pnpm run build

# Verify frontend compilation
cd frontend && npx vite build
```

## Migration Notes

### Database Migration
After schema changes, run:
```bash
cd backend
npx prisma migrate dev --name add_interview_domains
```

### Breaking Changes
- `StartInterviewDto.topic` is now optional (deprecated)
- `StartInterviewDto.domain` is now required
- `StartInterviewDto.language` is now required (default: FR)
- `InterviewFeedback` has new structure with verdict and competency scores
