# ByteBattle - Canvas Challenge Mode

## 📋 Vue d'ensemble

Le mode **Canvas Challenge** est un nouveau type de compétition pour ByteBattle où les utilisateurs dessinent des solutions architecturales complexes sur un canvas type Excalidraw, au lieu d'écrire du code.

## 🎨 Pages implémentées

### 1. **Canvas Catalog** (`/canvas`)
Page d'accueil listant tous les challenges de dessin disponibles.

**Fonctionnalités:**
- ✅ Filtres par type (architecture logique/physique, dataflow, sécurité)
- ✅ Filtres par difficulté (easy, medium, hard, expert)
- ✅ Stats (disponibles, complétés, en cours, nouveaux)
- ✅ Cards avec preview, tags, durée, points max
- ✅ Badges de statut (nouveau, en cours, complété)
- ✅ Responsive (desktop, tablet, mobile)

**Route:** `/canvas`

---

### 2. **Challenge Brief** (`/canvas/:id/brief`)
Écran de détails affichant l'énoncé complet avant de commencer.

**Sections:**
- ✅ Titre, difficulté, durée, tags
- ✅ Contexte du challenge
- ✅ Exigences (requirements)
- ✅ Contraintes (constraints)
- ✅ Livrables attendus (deliverables)
- ✅ Critères de réussite
- ✅ Grille d'évaluation (rubric) avec points
- ✅ Sélection du mode (Solo, Duel, Hackathon)

**Route:** `/canvas/:id/brief`

---

### 3. **Canvas Editor** (`/canvas/:id/editor`)
L'éditeur principal - écran de dessin interactif.

**Layout Desktop (3 panels):**
- ✅ **Left Panel**: Brief résumé + checklist + exigences clés (peut être masqué)
- ✅ **Center**: Zone de canvas avec grid, zoom, mini-map
- ✅ **Right Panel**: Toolbar (outils, couleurs, templates, assets, layers)

**Outils disponibles:**
- Select, Rectangle, Ellipse, Arrow, Line, Text, Sticky Note, Icon, Eraser
- Chaque outil avec raccourci clavier (V, R, O, A, L, T, S, I, E)

**Top Bar:**
- Timer avec états (normal, warning, critical)
- Nom du challenge + mode
- Actions: Undo/Redo, Save, Export, Submit

**Bottom Bar:**
- Status connexion (online/offline)
- Messages système (autosave, tips)
- Raccourcis clavier

**Features:**
- ✅ Palette de couleurs adaptée au thème
- ✅ Templates rapides (Architecture web, Dataflow, Microservices, Security)
- ✅ Assets (icônes DB, cache, queue, LB, CDN, users, etc.)
- ✅ Layers panel (liste des éléments avec visibilité/lock)
- ✅ Mini-map pour navigation
- ✅ Zoom controls (+/- et fit)
- ✅ Grid toggle
- ✅ Hints panel (indices IA progressifs)
- ✅ Modal de soumission avec preview

**Responsive Mobile:**
- Canvas plein écran
- Outils en bottom sheet
- Brief et layers en drawer

**Route:** `/canvas/:id/editor`

---

### 4. **Submission Result** (`/canvas/:id/result`)
Page de résultats après soumission avec feedback IA.

**Sections:**
- ✅ Hero avec score (78/100) + grade (Excellent/Très bien/Bien)
- ✅ Badges débloqués (Clarity Master, Security Aware, etc.)
- ✅ Preview du diagramme soumis
- ✅ **Feedback IA** structuré:
  - Summary (résumé général)
  - Strengths (points forts)
  - Risks (risques identifiés)
  - Improvements (suggestions d'amélioration)
- ✅ Détail de l'évaluation (rubric breakdown) avec barres de progression
- ✅ Stats: XP gagnés, classement, badges
- ✅ Actions: Recommencer, Catalogue, Challenge suivant
- ✅ Challenges similaires recommandés

**Route:** `/canvas/:id/result`

---

### 5. **Gallery / Community Designs** (`/canvas/gallery`)
Galerie des meilleurs designs partagés par la communauté.

**Fonctionnalités:**
- ✅ Stats globales (designs partagés, contributeurs, likes)
- ✅ Filtres par challenge
- ✅ Tri: Plus populaires (likes), Meilleurs scores, Récents
- ✅ Cards avec:
  - Thumbnail du design
  - Auteur + niveau
  - Score obtenu
  - Stats (views, likes)
  - Actions (like, bookmark, share)
  - Tags
  - Thème utilisé (avec emoji)
- ✅ Responsive grid (3 colonnes desktop, 2 tablet, 1 mobile)

**Route:** `/canvas/gallery`

---

## 🧩 Composants créés

### Canvas Components (`/components/canvas/CanvasComponents.tsx`)

**CanvasToolButton**
- Bouton d'outil avec icône, nom, raccourci
- États: default, active, hover, disabled
- Tooltip au survol

**ColorSwatch**
- Pastille de couleur sélectionnable
- État actif avec scale + border

**StickyNote**
- Post-it avec variants (sm/md/lg)
- Rotation légère (-2deg)

**LayerItem**
- Item de layer avec nom, visibilité, lock
- Actions: toggle visible, toggle lock, select, rename

**MiniMap**
- Vue miniature du canvas
- Indicateur de viewport

**CanvasTimer**
- Timer avec minutes:secondes
- États: normal, warning (< 10min), critical (< 5min)
- Animation pulse en état critique

**ExportDropdown**
- Dropdown avec options PNG/SVG/JSON

**HintPanel**
- Panel d'indices progressifs (1/3, 2/3, 3/3)
- Bouton pour débloquer indice suivant

**CanvasToast**
- Toast de notification
- Types: success, error, info, warning

---

## 📊 Data Structure

### Mock Data (`/data/canvasChallengeData.ts`)

**CanvasChallenge**
```typescript
{
  id: string;
  title: string;
  type: 'architecture-logique' | 'architecture-physique' | 'dataflow' | 'securite';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number; // minutes
  tags: string[];
  description: string;
  context: string;
  requirements: string[];
  constraints: string[];
  deliverables: string[];
  successCriteria: string[];
  status?: 'new' | 'attempted' | 'completed';
  rubric: { criterion: string; maxPoints: number; description: string; }[];
}
```

**6 challenges définis:**
1. Chat Temps Réel WebSocket (Medium, 45min)
2. Système de Notification Event-Driven (Hard, 60min)
3. Déploiement 3-Tiers + CDN (Easy, 30min)
4. Architecture Microservices E-Commerce (Expert, 90min)
5. Sécurité API Banking (Hard, 60min)
6. Pipeline CI/CD Multi-Environnement (Medium, 45min)

**CanvasSubmission**
```typescript
{
  id: string;
  challengeId: string;
  score: number;
  badges: string[];
  feedback: {
    summary: string;
    strengths: string[];
    risks: string[];
    improvements: string[];
  };
}
```

**CommunityDesign**
```typescript
{
  id: string;
  challengeId: string;
  author: string;
  authorLevel: number;
  score: number;
  likes: number;
  views: number;
  theme: string;
}
```

---

## 🎨 Styles thématiques

### Canvas-specific styles (dans `globals.css`)

**Grid backgrounds:**
- `.bg-grid` - Grille de base
- Grilles thématiques:
  - Cyber: Cyan avec opacity 0.1
  - Space: Cyan avec opacity 0.08
  - Pixel: Vert avec lignes plus épaisses (2px) et taille 16×16px

**Tool tooltips:**
- `.canvas-tooltip` - Positionnement et animation

---

## 🚀 Flows utilisateur

### Flow principal: Challenge complet
1. **Catalogue** → Parcourir les challenges
2. **Brief** → Lire l'énoncé + choisir mode (Solo/Duel/Hackathon)
3. **Editor** → Dessiner la solution
4. **Submit** → Modal de confirmation
5. **Result** → Feedback IA + score + badges
6. **Next** → Challenge suivant ou galerie

### Flow secondaire: Galerie
1. **Gallery** → Parcourir les designs de la communauté
2. **Filter/Sort** → Trouver inspiration
3. **Detail** → Voir design complet (placeholder)
4. **Fork** → Créer sa propre version (placeholder)

---

## 🎯 Intégration avec ByteBattle existant

### Thèmes appliqués
- ✅ Toutes les pages utilisent le système de thèmes existant
- ✅ Variables CSS (`--brand-primary`, `--surface-1`, etc.)
- ✅ Classes thématiques (`theme-btn`, `theme-card`)
- ✅ Corner brackets pour Cyber/Space
- ✅ Clipped corners pour Mythic/Sports
- ✅ Pixel notches pour Pixel

### Navigation
- ✅ Routes ajoutées dans `/routes.tsx`
- ✅ Layout avec `<Layout>` component
- ✅ Navigation cohérente

### Composants réutilisés
- ✅ Button
- ✅ Badge
- ✅ Layout
- ✅ Icons (lucide-react)

---

## 🔮 Développement futur

### Phase 1: Canvas fonctionnel
- [ ] Intégrer une librairie de canvas (Excalidraw, tldraw, ou custom)
- [ ] Implémenter les outils de dessin (rectangle, arrow, text, etc.)
- [ ] Système de layers fonctionnel
- [ ] Export PNG/SVG/JSON réel
- [ ] Sauvegarde automatique (local storage ou backend)

### Phase 2: IA et évaluation
- [ ] API d'évaluation IA (GPT-4 Vision ou Claude avec image)
- [ ] Analyse du diagramme (JSON structure)
- [ ] Génération de feedback structuré
- [ ] Calcul du score selon rubric

### Phase 3: Mode Duel
- [ ] Matchmaking pour Canvas Challenge
- [ ] Room avec 2 canvas côte à côte (ou split screen)
- [ ] Timer synchronisé
- [ ] Comparaison automatique des solutions
- [ ] Attribution Elo

### Phase 4: Galerie communautaire
- [ ] Upload et partage de designs
- [ ] Système de likes/bookmarks/comments
- [ ] Fork de designs
- [ ] Page détail d'un design (viewer full-screen)
- [ ] Filtres avancés (par auteur, tag, thème)

### Phase 5: Fonctionnalités avancées
- [ ] Templates éditables (sauvegarder ses propres templates)
- [ ] Bibliothèque d'assets personnalisée
- [ ] Collaboration temps réel (multiplayer canvas)
- [ ] Historique des versions (undo/redo complet)
- [ ] Export vers outils externes (Figma, Miro, etc.)
- [ ] Mode "Presentation" (présenter son diagramme en fullscreen)
- [ ] Annotations vocales (enregistrer explications)

---

## 📱 Responsive

Toutes les pages sont **responsive** avec breakpoints:
- **Desktop**: 1440px+ (layout complet 3 colonnes)
- **Tablet**: 1024px (layout 2 colonnes)
- **Mobile**: 390px (layout 1 colonne, drawers)

**Canvas Editor Mobile:**
- Canvas plein écran
- Outils en bottom sheet
- Brief accessible via drawer
- Layers accessible via drawer
- Zoom/grid controls en overlay

---

## ♿ Accessibilité

- ✅ Contrastes WCAG AA minimum
- ✅ Focus visible sur tous les boutons
- ✅ Tooltips avec raccourcis clavier
- ✅ Labels sur tous les inputs
- ✅ États disabled clairement indiqués
- ✅ Support keyboard navigation

---

## 🎮 Gamification

### XP et progression
- ✅ XP gagnés affichés après soumission
- ✅ Badges débloqués (Clarity Master, Security Aware, etc.)
- ✅ Classement affiché
- ✅ Thèmes débloqués par niveau (système existant ByteBattle)

### Badges spécifiques Canvas
- **Clarity Master**: Diagramme très lisible
- **Security Aware**: Bonnes pratiques sécurité
- **Scalability Pro**: Architecture scalable
- **Speed Artist**: Complété en moins de X minutes
- **Perfectionist**: Score 90+
- **Community Star**: Design avec 100+ likes

---

## 🔧 Technologies

**Frontend:**
- React + TypeScript
- React Router (navigation)
- Tailwind CSS v4 (styling)
- Lucide React (icons)
- Canvas library à intégrer (Excalidraw / tldraw)

**Backend futur:**
- API d'évaluation (Python + GPT-4 Vision / Claude)
- Storage des designs (S3 / Cloudinary)
- Database (PostgreSQL)
- Real-time (WebSocket pour Duel)

---

## 📝 Notes importantes

1. **Le canvas est actuellement un placeholder** - Il faudra intégrer une vraie librairie de dessin (Excalidraw est recommandé pour son style hand-drawn)

2. **L'évaluation IA est mockée** - Le feedback est statique. Il faudra créer une API qui analyse le diagramme et génère du feedback réel.

3. **Les images/thumbnails sont des placeholders** - Remplacer par de vrais screenshots des canvas.

4. **Le mode Duel n'est pas implémenté** - C'est une feature importante à développer en priorité.

5. **Pas de backend** - Tout est frontend only pour le moment. Les données sont mockées.

---

## 🎨 Design System

Le Canvas Challenge respecte 100% le design system ByteBattle:
- 6 thèmes avec identités visuelles uniques
- Variables CSS sémantiques
- Composants réutilisables
- Animations GPU-accelerated
- Responsive mobile-first
- Dark/Light mode

---

**Prêt pour le développement!** 🚀

Toutes les pages sont implémentées et fonctionnelles. Il reste à intégrer la logique métier (canvas réel, IA, backend).
