# 🎨 Canvas Challenge - Guide Complet

> Mode de compétition architecturale pour ByteBattle où vous dessinez des solutions au lieu de coder

---

## 🚀 Accès Rapide

| Page | Route | Description |
|------|-------|-------------|
| **Catalogue** | `/canvas` | Liste de tous les challenges |
| **Brief** | `/canvas/:id/brief` | Détails du challenge |
| **Éditeur** | `/canvas/:id/editor` | Canvas de dessin |
| **Résultats** | `/canvas/:id/result` | Score + Feedback IA |
| **Galerie** | `/canvas/gallery` | Designs communautaires |

---

## 📖 Table des Matières

1. [Vue d'ensemble](#-vue-densemble)
2. [Comment jouer](#-comment-jouer)
3. [Pages détaillées](#-pages-détaillées)
4. [Composants](#-composants)
5. [Données](#-données)
6. [Thèmes visuels](#-thèmes-visuels)
7. [Développement futur](#-développement-futur)

---

## 🎯 Vue d'ensemble

### Concept

Au lieu d'écrire du code, vous **dessinez des architectures logicielles** :
- Architecture logique (microservices, API, etc.)
- Architecture physique (déploiement, infra, réseau)
- Dataflow (flux de données, événements)
- Sécurité (layers, auth, encryption)

### Fonctionnalités principales

✅ **6 challenges réalistes** avec énoncés détaillés  
✅ **Éditeur de dessin** avec outils (formes, flèches, textes, stickers)  
✅ **Feedback IA** structuré (forces, risques, améliorations)  
✅ **Galerie communautaire** pour partager vos designs  
✅ **3 modes de jeu** : Solo, Duel, Hackathon  
✅ **Système de scoring** avec XP, badges, classement  

---

## 🎮 Comment jouer

### Étape 1 : Choisir un challenge

Allez sur `/canvas` et parcourez les challenges disponibles.

**Filtres disponibles :**
- Type : Architecture logique, physique, dataflow, sécurité
- Difficulté : Easy, Medium, Hard, Expert
- Statut : Nouveau, En cours, Complété

### Étape 2 : Lire le brief

Cliquez sur "Commencer" → page `/canvas/:id/brief`

**Informations fournies :**
- 📋 Contexte du problème
- 🎯 Exigences techniques
- ⚠️ Contraintes à respecter
- 📦 Livrables attendus
- ✓ Critères de réussite
- 📊 Grille d'évaluation (rubric)

### Étape 3 : Dessiner votre solution

Cliquez sur "Ouvrir le Canvas" → `/canvas/:id/editor`

**Outils disponibles :**
```
⌖ Select (V)      - Sélectionner/déplacer
▢ Rectangle (R)   - Dessiner rectangles
○ Ellipse (O)     - Dessiner cercles
→ Arrow (A)       - Créer flèches
/ Line (L)        - Tracer lignes
T Text (T)        - Ajouter texte
📝 Sticky (S)     - Post-its
🎨 Icon (I)       - Icônes techniques
🧹 Eraser (E)     - Effacer
```

**Fonctionnalités :**
- Palette de couleurs (10 couleurs)
- Templates (Architecture web, Dataflow, Microservices, Security)
- Assets (DB, Cache, Queue, LB, CDN, Users, etc.)
- Layers (organiser vos éléments)
- Hints IA (indices progressifs)
- Zoom, Grid, Mini-map

### Étape 4 : Soumettre

Cliquez sur "Soumettre" → Modal de confirmation → Évaluation IA

### Étape 5 : Recevoir le feedback

Page `/canvas/:id/result` avec :
- 🏆 Score sur 100
- ✅ Points forts
- ⚠️ Risques identifiés
- 💡 Suggestions d'amélioration
- 📊 Détail par critère
- 🎖️ Badges débloqués

---

## 📄 Pages détaillées

### 1️⃣ Canvas Catalog (`/canvas`)

**Ce que vous voyez :**
```
┌─────────────────────────────────────────────┐
│  🎨 Canvas Challenges                      │
│  Dessinez des architectures logicielles     │
├─────────────────────────────────────────────┤
│  Filtres : [Type] [Difficulté]             │
├─────────────────────────────────────────────┤
│  Stats : 6 disponibles | 1 complété        │
├─────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Chat WS  │ │ Notif    │ │ 3-Tiers  │   │
│  │ Medium   │ │ Hard     │ │ Easy     │   │
│  │ 45 min   │ │ 60 min   │ │ 30 min   │   │
│  └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────┘
```

**Interactions :**
- Cliquer sur une card → Brief
- Filtrer par type/difficulté
- Voir stats (nouveau/en cours/complété)

---

### 2️⃣ Challenge Brief (`/canvas/:id/brief`)

**Sections :**

| Section | Contenu |
|---------|---------|
| **Header** | Titre, difficulté, durée, points max, tags |
| **Contexte** | Situation business/technique |
| **Exigences** | Liste des requirements (6-8 items) |
| **Contraintes** | Limitations techniques/budget |
| **Livrables** | Ce qui doit être rendu |
| **Critères** | Comment vous serez évalué |
| **Rubric** | Grille de points (ex: Scalabilité 25pts) |
| **Modes** | Solo / Duel / Hackathon |

**Exemple - Chat Temps Réel :**
```yaml
Titre: "Chat Temps Réel WebSocket"
Difficulté: Medium
Durée: 45 minutes
Points max: 100

Contexte:
  "Une startup veut lancer une messagerie instantanée 
   supportant 1M utilisateurs simultanés..."

Exigences:
  - Support 1M utilisateurs simultanés
  - Latence < 100ms
  - Haute disponibilité 99.9%
  - Auth sécurisée
  - Historique persisté

Contraintes:
  - Budget cloud limité
  - Conformité RGPD
  - Rate limiting obligatoire

Rubric:
  - Clarté: 20 pts
  - Scalabilité: 25 pts
  - Sécurité: 20 pts
  - Monitoring: 15 pts
  - Conformité: 20 pts
```

---

### 3️⃣ Canvas Editor (`/canvas/:id/editor`)

**Layout Desktop :**

```
┌────────────────────────────────────────────────────────────────┐
│ 🎨 Chat Temps Réel | Mode: Solo | ⏱️ 42:15 | [Actions]       │
├──────────┬──────────────────────────────────────┬──────────────┤
│          │                                      │              │
│  BRIEF   │           CANVAS ZONE               │   TOOLS      │
│          │                                      │              │
│ Contexte │  ┌────────────────────────────────┐ │ ⌖ Select    │
│ ────────│  │                                 │ │ ▢ Rectangle │
│ • Auth   │  │   [Votre diagramme ici]        │ │ → Arrow     │
│ • Scale  │  │                                 │ │ T Text      │
│ • HA     │  │                                 │ │              │
│          │  └────────────────────────────────┘ │ Colors:      │
│ Checklist│                                      │ ⬤ ⬤ ⬤ ⬤ ⬤  │
│ ☐ Auth   │  [Zoom] [Grid] [Mini-map]          │              │
│ ☐ Scale  │                                      │ Templates    │
│          │                                      │ Assets       │
│          │                                      │ Layers       │
└──────────┴──────────────────────────────────────┴──────────────┘
│ 🟢 Online | Autosave: il y a 2 min | Shortcuts: V·R·A·T      │
└────────────────────────────────────────────────────────────────┘
```

**Responsive Mobile :**
```
┌───────────────────────────┐
│ ⏱️ 42:15  [💾] [📤]      │
├───────────────────────────┤
│                           │
│    CANVAS PLEIN ÉCRAN    │
│                           │
├───────────────────────────┤
│ [☰ Brief] [🎨 Outils]    │
└───────────────────────────┘
```

**Top Bar Actions :**
- ↶ Undo / ↷ Redo
- 💾 Sauvegarder
- 📥 Export (PNG/SVG/JSON)
- 📤 Soumettre

**Templates disponibles :**
1. 🌐 Architecture Web (Frontend + Backend + DB)
2. 📊 Dataflow (Producer → Queue → Consumer)
3. 🔷 Microservices (API Gateway + Services)
4. 🔒 Security Layers (WAF + Auth + Encryption)

**Assets (icônes) :**
- 🗄️ Database
- ⚡ Cache
- 📥 Queue
- ⚖️ Load Balancer
- 🌐 CDN
- 🔌 API
- λ Function
- 👥 Users
- 🔐 Auth
- 📊 Monitoring

---

### 4️⃣ Submission Result (`/canvas/:id/result`)

**Structure :**

```
┌─────────────────────────────────────────┐
│         Challenge complété ! ✓          │
│                                         │
│           Chat Temps Réel               │
│                                         │
│              78 / 100                   │
│            Très bien                    │
│                                         │
│  🏆 Clarity Master                      │
│  🏆 Security Aware                      │
│  🏆 Scalability Pro                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Votre Diagramme                        │
│  ┌───────────────────────────────────┐  │
│  │    [Preview du canvas]            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🤖 Feedback IA                         │
│  ────────────────────────────────────   │
│  Excellente architecture globale avec   │
│  bonne prise en compte scalabilité...   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ✅ Points Forts                        │
│  • Architecture claire et structurée    │
│  • Scaling horizontal bien pensé        │
│  • Sécurité bien prise en compte        │
│  • Utilisation Redis appropriée         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ⚠️ Risques Identifiés                  │
│  • Single point of failure sur DB       │
│  • Absence de circuit breaker           │
│  • Monitoring peu détaillé              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  💡 Suggestions d'Amélioration          │
│  • Ajouter réplication master-slave     │
│  • Implémenter circuit breaker          │
│  • Détailler stack monitoring           │
│  • Spécifier stratégie backup           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📊 Détail de l'Évaluation              │
│  ────────────────────────────────────   │
│  Clarté du diagramme     18/20  90%     │
│  ████████████████████░░                 │
│                                         │
│  Scalabilité            23/25   92%     │
│  ██████████████████████░                │
│                                         │
│  Sécurité               15/20   75%     │
│  ███████████████░░░░░                   │
└─────────────────────────────────────────┘

[Recommencer] [Catalogue] [Challenge Suivant →]
```

---

### 5️⃣ Gallery (`/canvas/gallery`)

**Vue :**

```
┌──────────────────────────────────────────────────┐
│  🎨 Galerie Communautaire                        │
│  Meilleurs designs de la communauté              │
├──────────────────────────────────────────────────┤
│  Stats: 1,234 designs | 567 contributeurs       │
├──────────────────────────────────────────────────┤
│  Filtres: [Challenge] [Thème]                    │
│  Tri: [❤️ Populaires] [🏆 Meilleurs] [📅 Récents] │
├──────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ [Preview]  │ │ [Preview]  │ │ [Preview]  │   │
│  │ Sarah_Chen │ │ MaxDev42   │ │ Alex_Arch  │   │
│  │ Lvl 45 92pts│ │ Lvl 67 88pts│ │ Lvl 89 95pts│   │
│  │ 👁️ 2.3K ❤️ 147│ │ 👁️ 3.1K ❤️ 203│ │ 👁️ 5.2K ❤️ 321│   │
│  │ ⚔️ samurai  │ │ 🎮 pixel   │ │ 🏰 mythic  │   │
│  └────────────┘ └────────────┘ └────────────┘   │
└──────────────────────────────────────────────────┘
```

**Actions sur chaque design :**
- 👁️ Voir en détail
- ❤️ Like
- 🔖 Bookmark
- 🔗 Partager
- 🍴 Fork (à venir)

---

## 🧩 Composants

### Fichier: `/components/canvas/CanvasComponents.tsx`

| Composant | Usage | Props |
|-----------|-------|-------|
| **CanvasToolButton** | Bouton d'outil avec tooltip | `icon, name, shortcut, active, onClick` |
| **ColorSwatch** | Pastille de couleur | `color, active, onClick` |
| **LayerItem** | Item de layer | `name, visible, locked, selected` |
| **MiniMap** | Vue miniature | - |
| **CanvasTimer** | Timer avec états | `minutes, seconds, warning, critical` |
| **ExportDropdown** | Menu export | `onExportPNG, onExportSVG, onExportJSON` |
| **HintPanel** | Panel d'indices | `hintNumber, totalHints, hint, onNextHint` |
| **CanvasToast** | Notification | `message, type, onClose` |

**Exemple d'utilisation :**

```tsx
import { CanvasToolButton, CanvasTimer } from './components/canvas/CanvasComponents';

// Tool button
<CanvasToolButton
  icon="⌖"
  name="Select"
  shortcut="V"
  active={activeTool === 'select'}
  onClick={() => setActiveTool('select')}
/>

// Timer
<CanvasTimer
  minutes={42}
  seconds={15}
  warning={false}
  critical={false}
/>
```

---

## 📊 Données

### Fichier: `/data/canvasChallengeData.ts`

### Challenges disponibles (6 total)

| ID | Titre | Type | Difficulté | Durée |
|----|-------|------|-----------|-------|
| canvas-001 | Chat Temps Réel WebSocket | architecture-logique | Medium | 45 min |
| canvas-002 | Système Notification Event-Driven | dataflow | Hard | 60 min |
| canvas-003 | Déploiement 3-Tiers + CDN | architecture-physique | Easy | 30 min |
| canvas-004 | Architecture Microservices E-Commerce | architecture-logique | Expert | 90 min |
| canvas-005 | Sécurité API Banking | securite | Hard | 60 min |
| canvas-006 | Pipeline CI/CD Multi-Env | dataflow | Medium | 45 min |

### Structure d'un Challenge

```typescript
interface CanvasChallenge {
  id: string;
  title: string;
  type: 'architecture-logique' | 'architecture-physique' 
        | 'dataflow' | 'securite';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number; // minutes
  tags: string[];
  description: string;
  context: string;
  requirements: string[];      // 5-7 items
  constraints: string[];        // 4-6 items
  deliverables: string[];       // 3-4 items
  successCriteria: string[];    // 3-5 items
  rubric: {
    criterion: string;
    maxPoints: number;
    description: string;
  }[];
}
```

### Structure du Feedback

```typescript
interface CanvasSubmission {
  id: string;
  challengeId: string;
  score: number;              // Ex: 78
  maxScore: number;           // Ex: 100
  badges: string[];           // Ex: ['Clarity Master', 'Security Aware']
  feedback: {
    summary: string;          // Résumé global
    strengths: string[];      // 3-5 points forts
    risks: string[];          // 3-4 risques
    improvements: string[];   // 4-6 suggestions
  };
}
```

---

## 🎨 Thèmes visuels

Les 6 thèmes ByteBattle s'appliquent au Canvas Challenge :

### Niveau 1 : Cyber Arena 🔮
```css
Grid: Cyan lumineux (#00E5FF, opacity 0.1)
Buttons: Corner brackets
Effects: Neon glow
```

### Niveau 20 : Space Ops 🚀
```css
Grid: Cyan spatial (#22D3EE, opacity 0.08)
Buttons: Corner brackets
Effects: Starfield background
```

### Niveau 40 : Samurai Dojo ⚔️
```css
Grid: Standard
Buttons: Rounded
Effects: Minimalist zen
```

### Niveau 60 : Pixel Arcade 🎮
```css
Grid: Vert vif 8-bit (#06FFA5, 2px, 16×16)
Buttons: Pixel notches
Effects: Scanlines
```

### Niveau 80 : Mythic RPG 🏰
```css
Grid: Standard
Buttons: Clipped corners
Effects: Parchment texture
```

### Niveau 100 : Sports Arena ⚽
```css
Grid: Standard
Buttons: Clipped corners
Effects: Stadium lights
```

**Classes CSS spéciales :**
```css
.bg-grid              /* Grille de base */
.theme-btn            /* Boutons thématiques */
.theme-card           /* Cards thématiques */
.corner-brackets      /* Coins pour Cyber/Space */
```

---

## 🔮 Développement futur

### Phase 1 : Canvas Fonctionnel ⚙️
**Priorité : HAUTE**

- [ ] Intégrer Excalidraw ou tldraw
- [ ] Implémenter outils de dessin
- [ ] Système de layers fonctionnel
- [ ] Export PNG/SVG/JSON réel
- [ ] Sauvegarde auto (localStorage)

**Librairies recommandées :**
```bash
npm install @excalidraw/excalidraw
# OU
npm install @tldraw/tldraw
```

### Phase 2 : IA et Évaluation 🤖
**Priorité : HAUTE**

- [ ] API d'évaluation (GPT-4 Vision / Claude)
- [ ] Analyse JSON du diagramme
- [ ] Génération feedback structuré
- [ ] Calcul score selon rubric

**Architecture suggérée :**
```
Frontend → Upload Image + JSON → API Backend
                                      ↓
                              GPT-4 Vision
                                      ↓
                        Feedback structuré + Score
```

### Phase 3 : Mode Duel ⚔️
**Priorité : MOYENNE**

- [ ] Matchmaking pour Canvas
- [ ] Room WebSocket 1v1
- [ ] Timer synchronisé
- [ ] Comparaison automatique
- [ ] Attribution Elo

### Phase 4 : Galerie Communautaire 🎨
**Priorité : MOYENNE**

- [ ] Upload et partage designs
- [ ] Système likes/bookmarks/comments
- [ ] Fork de designs
- [ ] Page détail (viewer fullscreen)
- [ ] Filtres avancés

### Phase 5 : Features Avancées 🚀
**Priorité : BASSE**

- [ ] Templates personnalisés
- [ ] Bibliothèque assets custom
- [ ] Collaboration temps réel
- [ ] Historique versions complètes
- [ ] Mode Presentation
- [ ] Annotations vocales

---

## 🛠️ Stack Technique

### Frontend (actuel)
```yaml
Framework: React + TypeScript
Routing: React Router v6
Styling: Tailwind CSS v4
Icons: Lucide React
State: React Hooks
```

### Backend (à venir)
```yaml
API: Node.js + Express / Python + FastAPI
IA: OpenAI GPT-4 Vision / Anthropic Claude
Database: PostgreSQL
Storage: AWS S3 / Cloudinary
Real-time: Socket.io / WebSocket
```

### Canvas Library (à intégrer)
```yaml
Option 1: Excalidraw (recommandé)
  - Style hand-drawn ✓
  - Export PNG/SVG ✓
  - Open source ✓

Option 2: tldraw
  - Plus flexible
  - API complète
  - Collaboration intégrée

Option 3: Canvas custom
  - Contrôle total
  - Plus de travail
```

---

## 📂 Structure des fichiers

```
/
├── components/
│   ├── canvas/
│   │   └── CanvasComponents.tsx    # 8 composants Canvas
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── Layout.tsx
│   └── Navbar.tsx                   # Lien "Canvas" ajouté
├── data/
│   └── canvasChallengeData.ts       # Mock data (6 challenges)
├── pages/
│   ├── CanvasCatalog.tsx            # Page catalogue
│   ├── CanvasChallengeBrief.tsx     # Page brief
│   ├── CanvasEditor.tsx             # Page éditeur ⭐
│   ├── CanvasSubmissionResult.tsx   # Page résultats
│   └── CanvasGallery.tsx            # Page galerie
├── routes.tsx                        # 5 routes Canvas ajoutées
├── styles/
│   └── globals.css                   # Styles .bg-grid
├── CANVAS_CHALLENGE_README.md        # Ce fichier
└── CANVAS_CHALLENGE.md               # Doc technique détaillée
```

---

## 🎯 Quick Start

### Tester le Canvas Challenge

1. **Naviguer vers le catalogue**
   ```
   http://localhost:3000/canvas
   ```

2. **Choisir un challenge**
   - Cliquer sur une card (ex: "Chat Temps Réel")

3. **Lire le brief**
   - Page `/canvas/canvas-001/brief`
   - Sélectionner mode "Training (Solo)"
   - Cliquer "Ouvrir le Canvas"

4. **Dessiner**
   - Page `/canvas/canvas-001/editor`
   - Utiliser les outils (actuellement UI seulement)
   - Cliquer "Soumettre"

5. **Voir résultats**
   - Page `/canvas/canvas-001/result`
   - Feedback IA mocké

6. **Explorer la galerie**
   - Naviguer vers `/canvas/gallery`
   - Voir designs communautaires

---

## ❓ FAQ

### Q: Le canvas de dessin fonctionne-t-il vraiment ?
**R:** Pas encore. L'UI est complète mais il faut intégrer Excalidraw ou tldraw pour le dessin réel.

### Q: L'IA évalue-t-elle vraiment les diagrammes ?
**R:** Pas encore. Le feedback est actuellement mocké. Il faut créer une API backend.

### Q: Le mode Duel est-il disponible ?
**R:** Non, c'est une feature à développer (Phase 3).

### Q: Peut-on partager nos designs ?
**R:** L'UI de galerie existe mais le backend de partage n'est pas implémenté.

### Q: Les thèmes visuels s'appliquent-ils ?
**R:** Oui ! Les 6 thèmes ByteBattle fonctionnent sur toutes les pages Canvas.

### Q: Est-ce responsive ?
**R:** Oui ! Desktop (1440px), Tablet (1024px), Mobile (390px).

---

## 🎖️ Badges disponibles

| Badge | Condition |
|-------|-----------|
| 🎨 **Clarity Master** | Diagramme très lisible et organisé |
| 🔒 **Security Aware** | Bonnes pratiques sécurité appliquées |
| 📈 **Scalability Pro** | Architecture scalable démontrée |
| ⚡ **Speed Artist** | Challenge complété en < 50% du temps |
| 💯 **Perfectionist** | Score ≥ 90/100 |
| ⭐ **Community Star** | Design avec 100+ likes |
| 🏆 **Architecture Guru** | 10 challenges complétés |
| 🎯 **Consistency King** | 5 challenges d'affilée avec score > 80 |

---

## 📞 Support

### Problèmes courants

**La page est blanche**
→ Vérifier que les routes sont bien importées dans `/routes.tsx`

**Les thèmes ne s'appliquent pas**
→ Vérifier que `<Layout>` entoure bien les pages

**Erreur 404**
→ Vérifier l'URL et les paramètres `:id`

---

## 🚀 Déploiement

Le Canvas Challenge est prêt pour la prod (front-end only) :

✅ Toutes les pages fonctionnelles  
✅ Mock data réaliste  
✅ Responsive complet  
✅ Thèmes appliqués  
✅ Navigation intégrée  
✅ Composants réutilisables  

**Prochaine étape : Intégrer le canvas réel !**

---

## 📝 Changelog

### v1.0.0 - Initial Release (2024-01-30)
- ✅ 5 pages complètes
- ✅ 8 composants spécifiques
- ✅ 6 challenges détaillés
- ✅ Intégration thématique
- ✅ Responsive design
- ✅ Documentation complète

---

## 🙏 Crédits

Créé pour **ByteBattle** - Plateforme d'entraînement pour développeurs

Mode Canvas Challenge - Architecture Drawing Competition

---

**Happy Drawing! 🎨✨**
