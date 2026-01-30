# ByteBattle - Système de Thèmes

## Vue d'ensemble

ByteBattle implémente **6 thèmes uniques et immersifs**, chacun avec sa propre identité visuelle, typographie et effets spéciaux. Chaque thème est disponible en mode **dark** et **light**, pour un total de 12 variations.

## 🎨 Les 6 Thèmes

### 1. 🌆 Cyber Arena / Neon Tournament
**Débloqué au niveau 1 (par défaut)**

- **Concept** : Arène e-sport futuriste avec néons cyan et violet
- **Typographie** : 
  - Titres : **Orbitron** (uppercase, letterspacing large)
  - UI : **Rajdhani**
- **Couleurs principales** :
  - Primary: `#00E5FF` (cyan électrique)
  - Secondary: `#8B5CF6` (violet néon)
  - Background: `#0B1020` (bleu nuit profond)
- **Effets spéciaux** :
  - Grille animée (animated grid)
  - Scan lines horizontales/verticales
  - Glow pulsant sur les éléments interactifs
- **Terminologie** :
  - Challenges → Battles
  - Accepted → KO!
  - Leaderboard → Arena Rankings

### 2. 🚀 Space Ops / Mission Control
**Débloqué au niveau 20**

- **Concept** : Centre de contrôle spatial professionnel
- **Typographie** :
  - Titres : **Chakra Petch**
  - UI : **Rajdhani**
- **Couleurs principales** :
  - Primary: `#22D3EE` (cyan lumineux)
  - Secondary: `#E879F9` (magenta)
  - Background: `#070A1A` (noir spatial)
- **Effets spéciaux** :
  - 100 étoiles animées twinkle
  - Backdrop blur sur les cards
  - Shimmer effect sur les progress bars
- **Terminologie** :
  - Challenges → Missions
  - Accepted → Mission Complete
  - Leaderboard → Commander Rankings

### 3. ⚔️ Samurai Dojo / Code Kata
**Débloqué au niveau 40**

- **Concept** : Design zen minimaliste japonais
- **Typographie** :
  - Titres : **Noto Serif JP** (élégance japonaise)
  - UI : **Noto Sans JP**
- **Couleurs principales** :
  - Primary: `#DC2626` (rouge sceau)
  - Secondary: `#D4AF37` (or)
  - Background: `#0B0B0D` (noir encre)
- **Effets spéciaux** :
  - Séparateurs décoratifs avec gradients
  - Animations zen (slow & deliberate avec cubic-bezier)
  - Tampons circulaires pour achievements
- **Terminologie** :
  - Challenges → Kata (形)
  - Accepted → Mastered
  - Difficulty → Belt Rank (帯)

### 4. 🕹️ Pixel Arcade / 8-Bit Competitive
**Débloqué au niveau 60**

- **Concept** : Salle d'arcade rétro avec couleurs vives
- **Typographie** :
  - Tout : **Press Start 2P** (pixel perfect)
  - Taille minimum : 0.5rem pour lisibilité
  - Line-height: 1.8+ (crucial pour pixel fonts)
- **Couleurs principales** :
  - Primary: `#06FFA5` (vert néon menthe)
  - Secondary: `#FF006E` (rouge magenta vif)
  - Background: `#1A1A2E` (bleu nuit foncé)
- **Effets spéciaux** :
  - Image rendering: pixelated
  - Grille pixel 4px x 4px
  - Animations énergiques (blink, shake, spin)
  - Borders épaisses (4px) sans border-radius
- **Terminologie** :
  - Challenges → Levels
  - Accepted → STAGE CLEAR!
  - Points → Coins

### 5. 🏰 Mythic RPG / Guild Quests
**Débloqué au niveau 80**

- **Concept** : Univers fantasy RPG avec magie
- **Typographie** :
  - Titres : **Cinzel** (serif classique, noble)
  - UI : **Lora** (narratif, élégant)
- **Couleurs principales** :
  - Primary: `#6D28D9` (violet runique)
  - Secondary: `#F59E0B` (or)
  - Background: `#0F172A` (nuit profonde)
  - Accent: `#FEF3C7` (parchemin)
- **Effets spéciaux** :
  - Double glow (violet + or)
  - Radial gradients mystiques
  - Shimmer magique sur XP bars
- **Terminologie** :
  - Challenges → Quests
  - Difficulty → Novice / Adept / Legendary
  - Badges → Guild Emblems

### 6. ⚽ Sports Arena
**Débloqué au niveau 100**

- **Concept** : Stade sportif dynamique
- **Typographie** :
  - Titres : **Teko** (condensé, impactant)
  - UI : **Barlow** (géométrique)
  - Timer/Scores : Taille énorme (5rem) pour impact
- **Couleurs principales** :
  - Primary: `#2563EB` (bleu équipe)
  - Secondary: `#FBBF24` (jaune or)
  - Background: `#111827` (anthracite)
- **Effets spéciaux** :
  - Grille sportive
  - Text shadow glow sur scores
  - Transitions rapides et énergiques
- **Terminologie** :
  - Challenges → Matches
  - Accepted → WIN!
  - Streak → Win Streak

## 🎯 Architecture Technique

### CSS Custom Properties
Tous les thèmes utilisent des variables CSS sémantiques :

```css
--bg-primary, --bg-secondary
--surface-1, --surface-2, --surface-3
--text-primary, --text-secondary, --text-muted
--border-default, --border-strong
--brand-primary, --brand-secondary
--state-success, --state-warning, --state-error, --state-info
--fx-glow, --fx-glow-hover
--gradient-brand
```

### Typographies
Chaque thème définit ses propres fonts :
```css
--font-title  /* Titres et headings */
--font-ui     /* Interface et navigation */
--font-code   /* Code snippets (JetBrains Mono partout) */
```

### Composants d'effets

#### ThemeEffects.tsx
Composant qui active automatiquement les effets selon le thème :
- `<AnimatedGrid />` → Cyber, Sports
- `<SpaceStars />` → Space (100 étoiles)
- `<ScanLine />` → Cyber
- `<PixelGrid />` → Pixel

#### Layout.tsx
Wrapper qui inclut ThemeEffects et positionne le contenu :
```tsx
<Layout>
  <YourContent />
</Layout>
```

## 🎮 Utilisation

### Changer de thème
```tsx
import { useTheme } from '../context/ThemeContext';

const { theme, setTheme, colorScheme, toggleColorScheme } = useTheme();

// Changer de thème
setTheme('cyber'); // 'cyber' | 'space' | 'samurai' | 'pixel' | 'mythic' | 'sports'

// Toggle dark/light
toggleColorScheme();
```

### Utiliser les tokens
```tsx
// Dans JSX
<div className="bg-[var(--surface-1)] border border-[var(--border-default)]" />

// Classes utilitaires
<h1 className="gradient-brand-text">Gradient Text</h1>
<div className="glow-pulse">Pulsing Element</div>
<div className="font-title uppercase">Theme Title</div>
```

### Terminologie adaptative
```tsx
import { useThemeTerminology, ThemeText } from '../components/ThemeTerminology';

const { getTerm } = useThemeTerminology();
getTerm('challenges'); // "Battles" en Cyber, "Missions" en Space, etc.

// Ou en composant
<ThemeText term="accepted" /> // Affiche "KO!", "Mission Complete", etc.
```

## 📱 Responsive

### Breakpoints
- Desktop: 1440px+ (tous effets)
- Tablet: 768-1440px (effets réduits)
- Mobile: <768px (animations essentielles uniquement)

### Animations réduites
```css
@media (prefers-reduced-motion: reduce) {
  /* Toutes les animations sont désactivées */
}
```

## 🚀 Performance

### Optimisations
- Effets GPU-accelerated (transform, opacity)
- Lazy load des étoiles Space
- Conditional rendering des effets (theme-specific)
- Image rendering pixelated uniquement pour Pixel theme

### Bonnes pratiques
✅ Utiliser `transform` et `opacity` pour animations  
✅ Utiliser `will-change` avec parcimonie  
✅ Limiter backdrop-filter sur mobile  
❌ Éviter animations sur `width`, `height`, `top`, `left`

## 🎨 Accessibilité

### Contrastes
Tous les thèmes respectent :
- Texte normal : 4.5:1 minimum
- Texte large : 3:1 minimum
- Éléments interactifs : 3:1 minimum

### Focus states
```css
:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
```

## 📦 Fichiers clés

```
/styles/globals.css          # Définitions des 12 thèmes + animations
/context/ThemeContext.tsx    # Context React pour gestion thèmes
/components/ThemeEffects.tsx # Effets visuels (grilles, étoiles, scan lines)
/components/Layout.tsx       # Wrapper avec effets
/components/ThemeTerminology.tsx # Terminologie adaptative
/pages/Themes.tsx           # Page de sélection des thèmes
/pages/ThemeShowcase.tsx    # Démonstration complète
```

## 🎓 Exemples d'utilisation

### Page complète
```tsx
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';

export function MyPage() {
  return (
    <Layout>
      <Navbar isLoggedIn />
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <h1 className="gradient-brand-text mb-6">
          Mon Titre
        </h1>
        {/* Contenu */}
      </div>
    </Layout>
  );
}
```

### Carte avec effets
```tsx
<div className="
  p-6 
  bg-[var(--surface-1)] 
  border-2 border-[var(--border-default)] 
  rounded-[var(--radius-lg)]
  hover:border-[var(--brand-primary)]
  glow-hover
  transition-all
">
  <h3 className="font-title mb-2">Card Title</h3>
  <p className="text-[var(--text-secondary)]">Description</p>
</div>
```

## 🔮 Prochaines étapes

- [ ] Intégration Monaco Editor avec thèmes correspondants
- [ ] Animations de transition entre thèmes
- [ ] Sons thématiques (optionnels)
- [ ] Particules custom par thème
- [ ] Export de thème personnalisé
