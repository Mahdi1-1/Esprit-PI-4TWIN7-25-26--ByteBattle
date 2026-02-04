# 🔧 ByteBattle Admin Panel - Documentation

> Backoffice complet pour la gestion de la plateforme ByteBattle

---

## 🚀 Accès Rapide

| Page | Route | Description |
|------|-------|-------------|
| **Login** | `/admin/login` | Authentification admin |
| **Dashboard** | `/admin` | Vue d'ensemble et KPIs |
| **Users** | `/admin/users` | Gestion des utilisateurs |
| **Problems** | `/admin/problems` | CRUD des challenges code |
| **Submissions** | `/admin/submissions` | Logs et code soumis |
| **Monitoring** | `/admin/monitoring` | Jobs, queue, services |

---

## 📖 Table des Matières

1. [Vue d'ensemble](#-vue-densemble)
2. [Authentification](#-authentification)
3. [Pages principales](#-pages-principales)
4. [Composants réutilisables](#-composants-réutilisables)
5. [Données mock](#-données-mock)
6. [Design système](#-design-système)
7. [Développement futur](#-développement-futur)

---

## 🎯 Vue d'ensemble

### Objectif

Le backoffice ByteBattle permet aux admins, modérateurs, mentors et managers d'entreprise de :
- **Gérer les utilisateurs** (ban, reset password, roles)
- **Créer/éditer des problèmes** (code challenges)
- **Modérer le contenu** (UGC, reports, anti-cheat)
- **Monitor le système** (jobs, queue, services)
- **Analyser les métriques** (submissions, verdicts, performance)

### Rôles disponibles

| Rôle | Badge | Permissions |
|------|-------|-------------|
| **SUPER_ADMIN** | 🟣 Violet | Accès total + delete users |
| **ADMIN** | 🔵 Bleu | Gestion complète sauf delete |
| **MODERATOR** | 🟠 Orange | Reports, UGC, ban users |
| **MENTOR** | 🟢 Vert | Voir stats, créer hints |
| **ENTERPRISE_MANAGER** | 🔷 Cyan | Challenges privés entreprise |

---

## 🔐 Authentification

### Page Login (`/admin/login`)

**Credentials de démo :**
```
Email: admin@bytebattle.dev
Password: admin123
```

**Fonctionnalités :**
- ✅ Login email/password
- ✅ Validation frontend
- ✅ Messages d'erreur
- 🔜 2FA (placeholder)
- 🔜 SSO (placeholder)

**États gérés :**
- Loading (pendant auth)
- Error (credentials invalides)
- Locked account (après 5 tentatives)

---

## 📄 Pages principales

### 1️⃣ Dashboard (`/admin`)

**Vue :**
```
┌────────────────────────────────────────────────────┐
│  📊 Overview Dashboard                             │
├────────────────────────────────────────────────────┤
│  KPIs (Cartes)                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Sub 24h  │ │ Avg Time │ │ Queue    │          │
│  │ 1,247    │ │ 234ms    │ │ 12 pend  │          │
│  └──────────┘ └──────────┘ └──────────┘          │
├────────────────────────────────────────────────────┤
│  Verdict Breakdown          │ System Health       │
│  ────────────────────────   │ ─────────────────   │
│  ACCEPTED      42.3% ████   │ API      ✓ HEALTHY │
│  WRONG_ANSWER  28.5% ███    │ Redis    ✓ HEALTHY │
│  TLE           15.2% ██     │ Judge    ⚠ DEGRADED │
├────────────────────────────────────────────────────┤
│  Recent Activity                                   │
│  • ModTeam banned user SpamBot (2 min ago)        │
│  • SysAdmin published Two Sum Arena (15 min ago)  │
└────────────────────────────────────────────────────┘
```

**KPIs affichés :**
- Submissions (24h / 7j)
- Temps moyen de judge
- Jobs en queue (pending / failed)
- Ratio de verdicts
- Duels actifs
- Hackathons en cours

**Métriques système :**
- API, Redis, MongoDB, Judge, AI Service
- Pour chaque service : uptime, response time, error rate

**Activité récente :**
- Actions admin (ban, publish, etc.)
- Alertes système (latency, errors)

---

### 2️⃣ Users Management (`/admin/users`)

**Table complète avec colonnes :**
- User (avatar + username + ID)
- Email
- Role (chip coloré)
- Level
- Elo
- Status (ACTIVE/BANNED/SUSPENDED/LOCKED)
- Flags (anti-cheat, reports)
- Actions

**Filtres disponibles :**
- Search (username, email)
- Status (all, active, banned, suspended, locked)
- Level range (slider)
- Elo range (slider)

**Actions par utilisateur :**
```
Actions menu (⋮)
├─ View Details → Drawer
├─ Ban/Unban User
├─ Reset Password
├─ Grant Role (upgrade)
└─ Delete User (SUPER_ADMIN only, confirm modal)
```

**User Detail Drawer :**
- Profil complet
- Historique submissions
- Flags anti-cheat détaillés
- Notes internes admin (textarea)
- Timeline d'actions

---

### 3️⃣ Problems Management (`/admin/problems`)

**Table des problèmes :**
```
┌──────────────────────────────────────────────────────┐
│ Title           │ Diff  │ Tags    │ Limits │ Stats  │
├──────────────────────────────────────────────────────┤
│ Two Sum Arena   │ EASY  │ Array   │ 1s     │ 1,247  │
│ two-sum-arena   │       │ Hash    │ 256MB  │ 68.5%  │
├──────────────────────────────────────────────────────┤
│ Warp Gate Paths │ MED   │ Graph   │ 2s     │ 856    │
│ warp-gate-paths │       │ BFS     │ 512MB  │ 42.3%  │
└──────────────────────────────────────────────────────┘
```

**Filtres :**
- Search (title, slug, tags)
- Difficulty (easy/medium/hard)
- Status (draft/published/archived)
- Language (python, js, cpp, java)

**Actions :**
- ✏️ Edit (→ /admin/problems/:id/edit)
- 👁️ Preview (→ /problem/:slug)
- 📋 Duplicate
- 🗄️ Archive/Unarchive
- 🗑️ Delete (confirm)

**Problem Create/Edit Form (à implémenter) :**
```
Sections :
├─ Basic Info (title, slug, difficulty)
├─ Tags (multi-select autocomplete)
├─ Statement (Markdown editor + preview)
├─ Examples (input/output pairs)
├─ Constraints (time/memory limits)
├─ Languages (checkboxes)
├─ Testcases
│  ├─ Public (visible aux users)
│  └─ Hidden (pour le judge)
├─ Upload ZIP (drag & drop)
└─ Actions (Save Draft / Publish / Preview)
```

---

### 4️⃣ Submissions & Logs (`/admin/submissions`)

**Table des submissions :**
```
ID      │ User    │ Problem  │ Verdict │ Time │ Mem   │ Lang │ Date
────────┼─────────┼──────────┼─────────┼──────┼───────┼──────┼──────
sub-001 │ AyaCode │ Two Sum  │ ✓ AC    │ 45ms │ 38MB  │ py   │ 14:23
sub-002 │ Nova    │ Warp     │ ✗ WA    │ 1234 │ 156MB │ js   │ 15:45
sub-003 │ Orion   │ Samurai  │ ⏱ TLE   │ 3000 │ 512MB │ cpp  │ 16:12
```

**Filtres :**
- Search (user, problem, ID)
- Verdict (all, AC, WA, TLE, RE, CE, MLE)
- Language (all, python, js, cpp, java)
- Date range (picker)

**Submission Detail Drawer :**
- Info : user, problem, verdict, language, time, memory
- **Code Viewer** (read-only, syntax highlighting, copy button)
- Test results (liste des tests passed/failed)
- Stdout/Stderr (si erreur)
- Actions : Rejudge, Download code

---

### 5️⃣ Monitoring (`/admin/monitoring`)

**3 sections :**

#### A) Services Health
Grid de cards pour chaque service :
```
┌─────────────────────┐
│ API        ✓ HEALTHY│
├─────────────────────┤
│ Uptime:    99.9%    │
│ Response:  45ms     │
│ Errors:    0.1%     │
│ Last:      10:00:00 │
└─────────────────────┘
```

#### B) Job Queue Stats
4 KPIs :
- Pending (⏳ + warning si > 20)
- Active (⚙️)
- Completed (✅)
- Failed (❌ + error si > 5)

#### C) Jobs Table
```
Job ID  │ Type          │ Status    │ Attempts │ Created  │ Actions
────────┼───────────────┼───────────┼──────────┼──────────┼────────
job-001 │ judge         │ active    │ 1        │ 10:00:00 │ 👁️
job-002 │ judge         │ pending   │ 0        │ 10:01:00 │ 👁️
job-003 │ plagiarism    │ failed    │ 3        │ 09:45:00 │ 👁️ 🔄
job-004 │ ai_review     │ completed │ 1        │ 09:30:00 │ 👁️
```

**Job Detail Drawer :**
- Type, status, attempts, dates
- **Payload** (JSON viewer)
- **Error** (si failed)
- Actions : Retry (si failed), Requeue, View logs

---

## 🧩 Composants réutilisables

### Fichier: `/components/admin/AdminComponents.tsx`

| Composant | Usage | Props clés |
|-----------|-------|------------|
| **RoleChip** | Badge de rôle | `role: UserRole` |
| **StatusChip** | Badge de statut | `status, type` |
| **MetricCard** | KPI avec trend | `title, value, icon, trend` |
| **EmptyState** | État vide | `icon, title, description, action` |
| **TableSkeleton** | Loading | `rows, columns` |
| **CodeViewer** | Afficher code | `code, language, maxHeight` |
| **FilterBar** | Conteneur filtres | `children` |
| **Pagination** | Navigation pages | `currentPage, totalPages, onPageChange` |
| **ConfirmModal** | Modale confirm | `title, message, danger, onConfirm` |
| **Breadcrumb** | Fil d'Ariane | `items: [{label, href?}]` |

**Exemple d'utilisation :**

```tsx
import { RoleChip, StatusChip, MetricCard } from './components/admin/AdminComponents';

// Role badge
<RoleChip role="SUPER_ADMIN" /> // 🟣 SUPER ADMIN

// Status badge
<StatusChip status="ACTIVE" type="user" /> // 🟢 ACTIVE
<StatusChip status="ACCEPTED" type="verdict" /> // 🟢 ACCEPTED
<StatusChip status="HEALTHY" type="service" /> // 🟢 HEALTHY

// Metric card
<MetricCard
  title="Submissions (24h)"
  value={1247}
  icon={<Activity />}
  trend={{ value: 12.5, direction: 'up' }}
/>
```

---

### Fichier: `/components/admin/AdminLayout.tsx`

**Layout global du backoffice**

```
┌─────────────────────────────────────────────────┐
│ Sidebar (collapsible)  │ Topbar               │
│ ───────────────────────│────────────────────────│
│ 🏠 Overview            │ 🔍 Search  🔔  🌙  👤  │
│ 👥 Users               ├────────────────────────┤
│ 💻 Problems            │                        │
│ 🎨 Canvas Challenges   │    CONTENT AREA        │
│ 📤 Testcases           │                        │
│ ✅ Submissions         │                        │
│ ⚔️ Duels               │                        │
│ 🏆 Hackathons          │                        │
│ ...                    │                        │
└────────────────────────┴────────────────────────┘
```

**Features :**
- Sidebar collapsible (desktop)
- Mobile : sidebar en overlay
- Topbar : search global (⌘K), notifications, theme toggle, profil admin
- Active state sur menu items
- Badges de notification (ex: Reports: 3)

---

## 📊 Données mock

### Fichier: `/data/adminData.ts`

**Types principaux :**

```typescript
// Roles
type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'MODERATOR' 
  | 'MENTOR' 
  | 'ENTERPRISE_MANAGER' 
  | 'USER';

// Status
type UserStatus = 'ACTIVE' | 'BANNED' | 'SUSPENDED' | 'LOCKED';
type ProblemStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type Verdict = 
  | 'ACCEPTED' 
  | 'WRONG_ANSWER' 
  | 'TLE' 
  | 'RUNTIME_ERROR' 
  | 'COMPILATION_ERROR' 
  | 'MEMORY_LIMIT';
type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';

// Entities
interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  level: number;
  elo: number;
  status: UserStatus;
  flags: { anticheat: number; reports: number; };
}

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  status: ProblemStatus;
  languages: string[];
  submissions: number;
  acceptanceRate: number;
}

interface Submission {
  id: string;
  userId: string;
  username: string;
  problemId: string;
  problemTitle: string;
  verdict: Verdict;
  timeMs: number;
  memoryMb: number;
  language: string;
  code?: string;
}
```

**Mock data fourni :**
- `adminUsers` : 6 utilisateurs (dont 1 SUPER_ADMIN, 1 MODERATOR, 1 banni)
- `problems` : 4 problèmes (Two Sum Arena, Warp Gate Paths, etc.)
- `submissions` : 4 soumissions avec différents verdicts
- `hackathons` : 2 événements (upcoming, finished)
- `reports` : 2 reports (plagiarism, abuse)
- `jobQueue` : 4 jobs (pending, active, failed, completed)
- `auditLogs` : 2 logs (publish problem, ban user)
- `systemMetrics` : 5 services (API, Redis, Mongo, Judge, AI)
- `dashboardKPIs` : métriques pour le dashboard

---

## 🎨 Design système

### Tokens CSS

Le backoffice utilise les mêmes **variables CSS sémantiques** que le front public :

```css
/* Backgrounds */
--bg-primary
--bg-secondary

/* Surfaces */
--surface-1
--surface-2
--surface-3

/* Text */
--text-primary
--text-secondary
--text-muted

/* Borders */
--border-default
--border-strong

/* Brand */
--brand-primary
--brand-secondary

/* States */
--state-success
--state-warning
--state-error
--state-info
```

**Particularité admin :**
- Style plus **sobre** que le front public
- Moins d'effets visuels flashy (pas de glow cyber, pas de scanlines)
- Densité plus élevée (plus d'info par écran)
- Focus sur la **lisibilité** et la **productivité**

### Typographie

- **UI** : Inter (clean, moderne)
- **Mono** : JetBrains Mono (pour IDs, code, logs, payloads JSON)

**Tailles :**
```css
H1: 28px (bold)
H2: 20px (bold)
H3: 16px (semibold)
Body: 14px (regular)
Caption: 12px (regular)
```

### Couleurs des rôles

```css
SUPER_ADMIN: purple-500
ADMIN: blue-500
MODERATOR: orange-500
MENTOR: green-500
ENTERPRISE_MANAGER: cyan-500
USER: gray-500
```

### Couleurs des états

```css
ACTIVE / PUBLISHED / HEALTHY / ACCEPTED: green-500
BANNED / DOWN / ERROR: red-500
SUSPENDED / ARCHIVED: gray-500
DRAFT / UPCOMING / PENDING: yellow-500
ONGOING / ACTIVE (job): blue-500
DEGRADED / WARNING / TLE: orange-500
```

---

## 🔮 Développement futur

### Phase 1 : Pages manquantes 📄

**Priorité HAUTE :**
- [ ] Canvas Challenges CRUD (`/admin/canvas-challenges`)
- [ ] Hackathons Management (`/admin/hackathons`)
- [ ] Reports & Moderation (`/admin/reports`)
- [ ] Anti-cheat Dashboard (`/admin/anticheat`)
- [ ] Audit Logs (`/admin/audit-logs`)

**Priorité MOYENNE :**
- [ ] AI Settings (`/admin/ai-settings`)
- [ ] Feature Flags (`/admin/feature-flags`)
- [ ] Billing/Enterprise (`/admin/billing`)
- [ ] Settings (`/admin/settings`)

### Phase 2 : Features avancées 🚀

**Problem Editor :**
- [ ] Markdown editor avec preview live
- [ ] Testcases upload (ZIP, drag & drop)
- [ ] Validator de testcases (run localement)
- [ ] Versioning des problèmes (restore)
- [ ] Clone/Fork de problèmes existants

**User Management :**
- [ ] Bulk actions (ban multiple users)
- [ ] Advanced search (regex, custom filters)
- [ ] User merge (fusion de comptes)
- [ ] Password reset email
- [ ] Role assignment wizard

**Monitoring :**
- [ ] Real-time logs streaming (WebSocket)
- [ ] Graphs interactifs (verdict trends, judge latency)
- [ ] Alerting rules (email/Slack si service down)
- [ ] Historical data (30 days retention)

**Anti-cheat :**
- [ ] Plagiarism comparison view (side-by-side code)
- [ ] MOSS integration
- [ ] Focus/Copy-Paste logs
- [ ] Similarity score algorithm
- [ ] Auto-flag suspicious submissions

**Canvas Challenges :**
- [ ] Canvas Challenge CRUD (create/edit)
- [ ] Rubric editor (add/remove criteria)
- [ ] Canvas submissions review (voir les dessins)
- [ ] AI evaluation config (prompts, modèles)

### Phase 3 : Backend intégration 🔌

**API endpoints à créer :**

```typescript
// Auth
POST /api/admin/login
POST /api/admin/2fa/verify
POST /api/admin/logout

// Users
GET    /api/admin/users?search=&status=&page=
GET    /api/admin/users/:id
PUT    /api/admin/users/:id/ban
PUT    /api/admin/users/:id/role
DELETE /api/admin/users/:id

// Problems
GET    /api/admin/problems?search=&difficulty=&page=
POST   /api/admin/problems
PUT    /api/admin/problems/:id
DELETE /api/admin/problems/:id
POST   /api/admin/problems/:id/publish
POST   /api/admin/problems/:id/testcases (upload)

// Submissions
GET    /api/admin/submissions?verdict=&language=&page=
GET    /api/admin/submissions/:id
POST   /api/admin/submissions/:id/rejudge

// Monitoring
GET    /api/admin/monitoring/services
GET    /api/admin/monitoring/jobs?status=
POST   /api/admin/monitoring/jobs/:id/retry

// Audit
GET    /api/admin/audit-logs?admin=&action=&page=
```

### Phase 4 : Permissions & RBAC 🔒

**Matrice de permissions :**

| Action | SUPER_ADMIN | ADMIN | MODERATOR | MENTOR | ENTERPRISE |
|--------|------------|-------|-----------|--------|------------|
| View users | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ban users | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create problems | ✅ | ✅ | ❌ | ❌ | ✅ (private) |
| Edit problems | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| Delete problems | ✅ | ✅ | ❌ | ❌ | ❌ |
| View submissions | ✅ | ✅ | ✅ | ✅ | ✅ (own org) |
| View monitoring | ✅ | ✅ | ❌ | ❌ | ❌ |
| Retry jobs | ✅ | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ |

**Implémentation :**
```tsx
// Permission check hook
const { hasPermission } = useAdminPermissions();

if (!hasPermission('delete_user')) {
  return <PermissionDenied />;
}
```

### Phase 5 : Analytics & Reporting 📊

**Dashboards à créer :**
- [ ] User growth (nouveaux users par jour/semaine/mois)
- [ ] Engagement metrics (DAU, WAU, MAU)
- [ ] Problem difficulty distribution
- [ ] Language popularity trends
- [ ] Judge performance over time
- [ ] Revenue (si billing activé)

**Export de données :**
- [ ] Users CSV (filtered)
- [ ] Submissions CSV (with filters)
- [ ] Audit logs JSON
- [ ] Reports PDF generation

---

## 🛠️ Stack Technique

### Frontend
```yaml
Framework: React + TypeScript
Routing: React Router v6
Styling: Tailwind CSS v4 + CSS Variables
Icons: Lucide React
State: React Hooks (useState, useContext)
Forms: React Hook Form (à intégrer)
```

### Backend (à développer)
```yaml
API: NestJS (Node.js) / FastAPI (Python)
Auth: JWT + Refresh Tokens + 2FA (TOTP)
Database: PostgreSQL (users, problems, submissions)
          MongoDB (logs, audit)
          Redis (cache, sessions, queue)
Queue: BullMQ (jobs processing)
Storage: S3 (testcases, uploads)
Real-time: Socket.io (live monitoring)
```

### DevOps
```yaml
Deploy: Docker + Kubernetes
CI/CD: GitHub Actions
Monitoring: Prometheus + Grafana
Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
Alerting: PagerDuty / Slack webhooks
```

---

## 📂 Structure des fichiers

```
/
├── components/
│   └── admin/
│       ├── AdminComponents.tsx      # Composants réutilisables
│       └── AdminLayout.tsx          # Layout + sidebar + topbar
├── data/
│   └── adminData.ts                  # Mock data admin
├── pages/
│   └── admin/
│       ├── AdminLogin.tsx            # Page login
│       ├── AdminDashboard.tsx        # Dashboard overview
│       ├── AdminUsers.tsx            # Gestion users
│       ├── AdminProblems.tsx         # Gestion problems
│       ├── AdminSubmissions.tsx      # Submissions + logs
│       └── AdminMonitoring.tsx       # System health + jobs
├── routes.tsx                        # Routes admin ajoutées
└── ADMIN_PANEL_README.md             # Ce fichier
```

---

## 🎯 Quick Start

### Tester le backoffice

1. **Se connecter**
   ```
   http://localhost:3000/admin/login
   Email: admin@bytebattle.dev
   Password: admin123
   ```

2. **Explorer le dashboard**
   - KPIs temps réel
   - Verdict breakdown
   - System health

3. **Gérer les utilisateurs**
   - `/admin/users`
   - Filtrer, chercher, ban/unban
   - Voir détails dans drawer

4. **Voir les problèmes**
   - `/admin/problems`
   - Filtrer par difficulté/statut
   - Preview, edit (placeholder)

5. **Consulter submissions**
   - `/admin/submissions`
   - Filtrer par verdict/language
   - Voir code source dans drawer

6. **Monitor le système**
   - `/admin/monitoring`
   - Services health
   - Job queue
   - Retry failed jobs

---

## ❓ FAQ

### Q: Le backoffice est-il responsive ?
**R:** Oui ! Desktop 1440px (optimal), Tablet 1024px (functional), Mobile 390px (lecture seule).

### Q: Les données sont-elles réelles ?
**R:** Non, tout est mocké pour l'instant. Il faut créer une API backend.

### Q: Peut-on vraiment ban un utilisateur ?
**R:** L'UI est complète mais les actions affichent juste `console.log()`. À connecter au backend.

### Q: Les jobs peuvent-ils être retry ?
**R:** L'UI existe mais c'est un placeholder. Il faut implémenter BullMQ côté backend.

### Q: Les thèmes ByteBattle s'appliquent-ils ?
**R:** Oui ! Le backoffice utilise les mêmes variables CSS, donc dark/light fonctionne. Les skins se changent dans le ThemeContext.

### Q: Comment ajouter une nouvelle page admin ?
**R:**
1. Créer le component dans `/pages/admin/MyPage.tsx`
2. L'entourer avec `<AdminLayout>`
3. Ajouter la route dans `/routes.tsx`
4. Ajouter l'item de menu dans `AdminLayout` (navItems)

---

## 🔒 Sécurité

### Best practices à implémenter

**Authentication :**
- [ ] JWT avec expiration courte (15min)
- [ ] Refresh tokens (7 jours)
- [ ] 2FA obligatoire pour SUPER_ADMIN
- [ ] Rate limiting sur /login (5 tentatives max)
- [ ] Account lockout après 5 échecs
- [ ] IP whitelisting (option)

**Authorization :**
- [ ] RBAC middleware (check role avant chaque action)
- [ ] Permission denied page (403)
- [ ] Audit log de TOUTES les actions sensibles
- [ ] Session timeout (30min inactivité)

**Data protection :**
- [ ] HTTPS only (force SSL)
- [ ] CORS stricte (origin whitelist)
- [ ] CSP headers (Content Security Policy)
- [ ] Sensitive data masking (passwords, tokens)
- [ ] SQL injection prevention (prepared statements)
- [ ] XSS protection (sanitize inputs)

---

## 📞 Support

### Problèmes courants

**Login ne fonctionne pas**
→ Utiliser les credentials de démo : `admin@bytebattle.dev` / `admin123`

**Sidebar ne s'affiche pas sur mobile**
→ Cliquer sur le bouton hamburger (☰) en haut à gauche

**Les données sont vides**
→ Les mock data sont dans `/data/adminData.ts`, vérifier qu'ils sont bien importés

**Les thèmes ne changent pas**
→ Le ThemeContext doit entourer l'app dans `/App.tsx`

---

## 🚀 Prochaines étapes

Le backoffice admin est **prêt pour l'implémentation backend** :

✅ Layout complet avec sidebar + topbar  
✅ 5 pages principales fonctionnelles  
✅ Composants réutilisables (table, filters, modals)  
✅ Mock data réaliste  
✅ Design système cohérent  
✅ Responsive (desktop, tablet, mobile)  
✅ Dark/Light mode  

**Next: Créer l'API NestJS !** 🔌

---

**Made for ByteBattle Admin Team** 🛡️
