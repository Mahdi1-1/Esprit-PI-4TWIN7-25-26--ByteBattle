# ByteBattle - Plateforme Gamifiée de Défis de Programmation

## 🎮 Vue d'ensemble

ByteBattle est une application web professionnelle de défis de programmation en temps réel, conçue pour les étudiants, développeurs et entreprises. L'interface combine un design professionnel avec des éléments de gamification pour créer une expérience d'apprentissage engageante.

## ✨ Fonctionnalités

### Modes de Jeu
- **Mode Solo** : Résolvez des problèmes à votre rythme avec des difficultés progressives
- **Duel 1v1** : Affrontez d'autres développeurs en temps réel via WebSocket
- **Hackathon ICPC** : Compétitions en équipe avec scoreboard live et système de freeze

### Fonctionnalités Techniques
- **IDE Monaco Intégré** : Éditeur de code professionnel avec coloration syntaxique
- **Judge Sécurisé** : Sandbox isolé pour exécution de code
- **IA Assistant** : Smart hints progressifs et code review automatique
- **Système de Thèmes** : 6 thèmes déblocables par niveau (Cyber, Space, Samurai, Pixel, Mythic, Sports)
- **Dark/Light Mode** : Chaque thème disponible en mode clair et sombre

### Gamification
- **Système de Niveaux & XP** : Progression continue avec récompenses
- **Elo Rating** : Classement compétitif pour les duels
- **Badges & Achievements** : Récompenses avec rareté (Common, Rare, Epic, Legendary)
- **Leaderboard Global** : Classement des meilleurs joueurs
- **Skills Radar** : Visualisation des compétences (Algo, DS, DP, Graph, etc.)

## 🎨 Design System

### Fondations
- **Grille** : 8pt spacing scale
- **Rayons** : 8px / 12px / 16px
- **Typographie** : Inter (UI) + JetBrains Mono (Code)
- **Responsive** : Desktop (1440px), Tablet (1024px), Mobile (390px)

### Thèmes (12 modes au total)

| Thème | Niveau Requis | Style |
|-------|---------------|-------|
| Cyber Arena | 1 | Néons cyan/violet, style cyberpunk |
| Space Ops | 20 | Mission control, tons bleus froids |
| Samurai Dojo | 40 | Minimaliste, noir/rouge/or |
| Pixel Arcade | 60 | 8-bit, couleurs vives |
| Mythic RPG | 80 | Fantasy, effets magiques |
| Sports Arena | 100 | Scoreboard sportif |

### Tokens Sémantiques
Toutes les couleurs utilisent des variables CSS sémantiques :
- `--bg-primary`, `--bg-secondary`
- `--surface-1`, `--surface-2`, `--surface-3`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--brand-primary`, `--brand-secondary`
- `--state-success`, `--state-warning`, `--state-error`, `--state-info`
- `--score-accepted`, `--score-wrong`, `--score-tle`, `--score-re`, `--score-ce`

## 📁 Structure du Projet

```
/
├── components/          # Composants réutilisables
│   ├── Badge.tsx       # Badges (difficulté, verdict, rareté)
│   ├── Button.tsx      # Boutons avec variants
│   ├── Input.tsx       # Champs de formulaire
│   ├── Navbar.tsx      # Navigation principale
│   ├── ProblemCard.tsx # Carte de problème
│   ├── MatchCard.tsx   # Carte de match
│   ├── ProgressBar.tsx # Barres de progression & XP
│   └── Timer.tsx       # Compteurs et timers
├── context/
│   └── ThemeContext.tsx # Gestion des thèmes
├── data/
│   └── mockData.ts     # Données de démonstration
├── pages/              # Pages de l'application
│   ├── Landing.tsx     # Page d'accueil marketing
│   ├── Login.tsx       # Authentification
│   ├── Dashboard.tsx   # Tableau de bord utilisateur
│   ├── Problems.tsx    # Catalogue de problèmes
│   ├── Problem.tsx     # Page problème + IDE
│   ├── DuelMatchmaking.tsx # Recherche de match
│   ├── Hackathon.tsx   # Liste des hackathons
│   ├── HackathonScoreboard.tsx # Scoreboard ICPC
│   ├── Leaderboard.tsx # Classement global
│   └── Themes.tsx      # Gestion des thèmes
├── styles/
│   └── globals.css     # Design system + thèmes
├── routes.tsx          # Configuration React Router
└── App.tsx             # Point d'entrée
```

## 🎯 Composants Principaux

### Buttons
```tsx
<Button variant="primary|secondary|ghost|destructive" size="sm|md|lg">
  Click me
</Button>
```

### Badges
```tsx
<DifficultyBadge difficulty="easy|medium|hard" />
<VerdictBadge verdict="ACCEPTED|WA|TLE|RE|CE" />
<RarityBadge rarity="common|rare|epic|legendary" />
```

### Cards
```tsx
<ProblemCard 
  id="two-sum-arena"
  title="Two Sum Arena"
  difficulty="easy"
  tags={['Array', 'Hash Table']}
  solveRate={68}
  avgTime={12}
  status="solved"
/>
```

## 🚀 Pages & Flux

### Flux Principal
1. **Landing** → Login → Dashboard
2. **Catalogue** → Problem → Submit → Result + IA Review
3. **Matchmaking** → Duel Room → Duel Result
4. **Hackathon Lobby** → Scoreboard Live → Problem List
5. **Level-up** → Modal theme unlocked → Activation

### Navigation
- `/` - Landing page
- `/login` - Authentification
- `/dashboard` - Tableau de bord
- `/problems` - Catalogue de problèmes
- `/problem/:id` - Page problème avec IDE
- `/duel/matchmaking` - Recherche de duel
- `/hackathon` - Liste des hackathons
- `/hackathon/:id/scoreboard` - Scoreboard ICPC
- `/leaderboard` - Classement global
- `/themes` - Gestion des thèmes

## 🎨 Accessibilité

- Contraste WCAG AA minimum
- Focus visibles sur tous les éléments interactifs
- Zones cliquables ≥ 40px
- Textes lisibles (14px minimum)
- Support clavier complet
- Aria labels sur les actions importantes

## 🛠️ Stack Technique

- **Framework** : React 18 avec TypeScript
- **Routing** : React Router v7 (Data mode)
- **Styling** : Tailwind CSS v4 avec tokens CSS
- **Icons** : Lucide React
- **Fonts** : Inter (UI) + JetBrains Mono (Code)

## 📊 Données Mock

L'application utilise des données de démonstration réalistes :
- 4 problèmes d'exemple (Two Sum Arena, Warp Gate Paths, Samurai Segments, Pixel Collision)
- Historique de matchs avec adversaires
- Profil utilisateur niveau 42, Elo 1384
- Badges avec rareté (NightOwl, Speedster, FirstBlood)
- Scoreboard ICPC avec 3 équipes
- Leaderboard global avec Top 5 + position utilisateur

## 🎮 Système de Progression

### Niveaux & XP
- XP gagnée par : soumissions acceptées, victoires en duel, participation hackathons
- Niveau max : 100+
- Chaque niveau débloque potentiellement de nouveaux thèmes

### Elo Rating (Duels)
- Système Elo classique
- Range typique : 800-2500
- +15 à +25 par victoire (selon écart Elo)
- -10 à -15 par défaite

### Badges
- **Common** : Réalisations de base
- **Rare** : Défis spéciaux (ex: NightOwl)
- **Epic** : Performances exceptionnelles (ex: Speedster)
- **Legendary** : Exploits rares (ex: FirstBlood)

## 🎯 Prochaines Étapes Suggérées

Pour transformer cette maquette en application complète :

1. **Backend & Base de données** : Implémenter Supabase pour persistence
2. **WebSocket** : Ajouter temps réel pour les duels
3. **IDE Monaco** : Intégrer l'éditeur Monaco réel
4. **Judge System** : Connecter à un juge de code (ex: Judge0)
5. **IA Integration** : Implémenter hints et code review avec LLM
6. **Auth OAuth** : Activer GitHub/Google OAuth
7. **Analytics** : Tracker progression et engagement
8. **Mobile App** : Version React Native

## 📝 Notes de Design

- Tous les composants utilisent Auto Layout (flexbox/grid)
- Animations sobres dans l'IDE, plus "game" dans les résultats
- Les glow effects sont plus forts dans Cyber/Pixel, subtils dans Samurai
- Le style d'icônes peut varier selon le thème (outline → pixel → minimal)
- Les modals utilisent backdrop blur pour effet moderne

---

**ByteBattle** - Code. Battle. Level Up. 🚀
