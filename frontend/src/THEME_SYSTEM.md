# ByteBattle Theme System - Guide Complet

## 🎨 Vue d'ensemble

Le système de thèmes de ByteBattle offre 6 thèmes visuellement distincts, chacun avec sa propre identité, formes et détails uniques - pas seulement des couleurs différentes.

## 📋 Les 6 Thèmes

### 1️⃣ **Cyber Arena** (Neon Tournament)
- **Style**: Cyberpunk futuriste avec néons
- **Typographie**: Orbitron (titres), Rajdhani (UI)
- **Couleurs**: Cyan (#00E5FF) + Violet (#8B5CF6)
- **Formes**: Coins arrondis (8px), gradients cyan/violet
- **Effets**: Glow néon, grilles animées, scanlines horizontales
- **Détails**: Corner brackets qui s'illuminent au survol

### 2️⃣ **Space Ops** (Mission Control)
- **Style**: Spatial technique NASA
- **Typographie**: Chakra Petch (titres), Rajdhani (UI)
- **Couleurs**: Cyan (#22D3EE) + Magenta (#E879F9)
- **Formes**: Coins légèrement arrondis (6px), borders fines
- **Effets**: Étoiles twinkle, effets backdrop blur
- **Détails**: Corner brackets techniques (L-shapes)

### 3️⃣ **Samurai Dojo** (Code Kata)
- **Style**: Zen minimaliste japonais
- **Typographie**: Noto Serif JP (titres), Noto Sans JP (UI)
- **Couleurs**: Rouge (#DC2626) + Or (#D4AF37)
- **Formes**: Coins parfaitement carrés (0px), lignes épurées
- **Effets**: Pas de glow, transitions lentes (0.4s)
- **Détails**: Ligne dorée au top des cards, ornements subtils

### 4️⃣ **Pixel Arcade** (8-Bit Competitive)
- **Style**: Rétro 8-bit années 80
- **Typographie**: Press Start 2P (tout)
- **Couleurs**: Vert (#06FFA5) + Rose (#FF006E)
- **Formes**: Coins coupés en pixels (4px notches), borders épaisses (4px)
- **Effets**: Hard shadows (0px 4px), pas de transitions smooth
- **Détails**: Effet pixel-perfect, image rendering pixelated

### 5️⃣ **Mythic RPG** (Guild Quests)
- **Style**: Fantasy épique médiéval
- **Typographie**: Cinzel (titres), Lora (UI)
- **Couleurs**: Violet rune (#6D28D9) + Or (#F59E0B)
- **Formes**: Coins coupés en diagonal (8px clip-path)
- **Effets**: Glow magique double (violet + or), transitions lentes
- **Détails**: Corners clipped, effets de parchemin

### 6️⃣ **Sports Arena** (Code Sports)
- **Style**: Stade sportif dynamique
- **Typographie**: Teko (titres), Barlow (UI)
- **Couleurs**: Bleu team (#2563EB) + Jaune (#FBBF24)
- **Formes**: Coins coupés en diagonal (8px clip-path), borders épaisses (3px)
- **Effets**: Shadows audacieuses, transitions rapides (0.3s)
- **Détails**: Speed lines, énergie dynamique

## 🛠️ Variables CSS Custom Properties

Chaque thème définit ses propres variables:

```css
/* Shape & Style Variables */
--btn-radius: 8px;              /* Border radius des boutons */
--card-radius: 12px;            /* Border radius des cards */
--border-width: 2px;            /* Épaisseur des borders */
--border-style: solid;          /* Style de border */
--shadow-style: ...;            /* Ombre par défaut */
--shadow-hover: ...;            /* Ombre au survol */
--transition-speed: 0.2s;       /* Vitesse des transitions */
--transition-ease: ...;         /* Fonction d'easing */
--corner-clip: 0px;             /* Taille des coins coupés */
--btn-text-transform: uppercase;
--btn-letter-spacing: 2px;
```

## 📦 Classes Utilitaires Thématiques

### Boutons
```tsx
<button className="theme-btn">
  // Applique automatiquement:
  // - border-radius: var(--btn-radius)
  // - border-width: var(--border-width)
  // - box-shadow: var(--shadow-style)
  // - transitions adaptées au thème
</button>
```

### Cards
```tsx
<div className="theme-card">
  // Applique automatiquement:
  // - border-radius: var(--card-radius)
  // - border-width: var(--border-width)
  // - box-shadow: var(--shadow-style)
  // - hover effects thématiques
</div>
```

### Corner Brackets (Cyber/Space seulement)
```tsx
<div className="corner-brackets relative">
  // Ajoute des brackets dans les coins
  // qui s'illuminent au survol
</div>
```

## 🎯 Différenciation Visuelle

### Ce qui CHANGE entre les thèmes:

✅ **Formes des boutons**
- Cyber: Arrondis (8px)
- Space: Légèrement arrondis (6px)
- Samurai: Carrés (0px)
- Pixel: Carrés avec notches (4px cutouts)
- Mythic: Coins coupés en diagonal
- Sports: Coins coupés en diagonal

✅ **Style des borders**
- Cyber/Samurai/Mythic: 2px solid
- Space: 1px solid (technique)
- Pixel: 4px solid (rétro)
- Sports: 3px solid (audacieux)

✅ **Effets visuels**
- Cyber: Glow néon intense
- Space: Glow subtle + backdrop blur
- Samurai: Aucun glow (zen)
- Pixel: Hard shadows pixelisées
- Mythic: Double glow magique
- Sports: Shadows audacieuses

✅ **Vitesse des transitions**
- Cyber: 0.2s (rapide)
- Space: 0.25s (modéré)
- Samurai: 0.4s (lent, zen)
- Pixel: 0s (instant, pas de smooth)
- Mythic: 0.4s (épique)
- Sports: 0.3s (énergique)

✅ **Ornements et détails**
- Cyber/Space: Corner brackets
- Samurai: Ligne dorée subtile
- Pixel: Pixel cutouts
- Mythic: Clipped corners
- Sports: Speed lines (via clip-path)

## 💻 Utilisation dans les composants

### Bouton thématique
```tsx
import { Button } from './components/Button';

<Button variant="primary">
  // Utilise automatiquement:
  // - Les fonts du thème actif
  // - Les couleurs du thème
  // - Les formes du thème (via theme-btn)
  // - Les transitions du thème
</Button>
```

### Card thématique
```tsx
<div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] p-6">
  <h3>Mon titre</h3>
  <p className="text-[var(--text-secondary)]">Description</p>
</div>
```

### Utilisation des variables de couleur
```tsx
<div className="bg-[var(--brand-primary)]">
<p className="text-[var(--text-secondary)]">
<div className="border-[var(--border-default)]">
```

## 🎨 Classes d'effets disponibles

### Glow
```css
.glow              /* Glow constant */
.glow-hover        /* Glow au survol */
.glow-pulse        /* Animation de pulsation */
```

### Gradients
```css
.gradient-brand         /* Fond dégradé */
.gradient-brand-text    /* Texte dégradé */
```

### Backgrounds
```css
.bg-grid               /* Grille statique */
.bg-grid-animated      /* Grille animée */
```

### Scan Lines
```css
.scan-line        /* Ligne horizontale qui défile */
.scan-horizontal  /* Ligne verticale qui défile */
```

## 🔧 Personnalisation

Pour ajouter un nouveau thème:

1. Ajouter les variables CSS dans `globals.css`:
```css
[data-theme="mon_theme"] {
  /* Couleurs */
  --brand-primary: #...;
  --brand-secondary: #...;
  
  /* Formes */
  --btn-radius: ...;
  --card-radius: ...;
  --border-width: ...;
  
  /* Effets */
  --shadow-style: ...;
  --transition-speed: ...;
}
```

2. Ajouter dans le ThemeContext:
```tsx
export const themes = [
  // ...
  {
    id: 'mon_theme',
    name: 'Mon Theme',
    family: 'mon',
    unlockLevel: 0,
  }
];
```

## 📍 Pages de démonstration

- `/theme-showcase` - Vue d'ensemble des 6 thèmes avec previews
- `/theme-components` - Démonstration des composants dans le thème actif

## 🎯 Bonnes pratiques

1. ✅ **Toujours utiliser** les classes `theme-btn` et `theme-card` pour les éléments interactifs
2. ✅ **Utiliser** les variables CSS au lieu de valeurs en dur
3. ✅ **Ajouter** `corner-brackets` pour Cyber/Space themes
4. ✅ **Tester** tous les thèmes lors de changements de design
5. ❌ **Ne pas** utiliser de border-radius en dur
6. ❌ **Ne pas** utiliser de shadows/glows en dur
7. ❌ **Ne pas** mélanger des styles de thèmes différents

## 🚀 Performance

- Toutes les animations utilisent GPU acceleration (`transform`, `opacity`)
- Support `prefers-reduced-motion` pour accessibilité
- Variables CSS pour des changements de thème instantanés
- Pas de recalcul de layout lors des changements

## 📱 Responsive

Tous les thèmes sont fully responsive et s'adaptent automatiquement aux différentes tailles d'écran.

## ♿ Accessibilité

- Contraste WCAG AA minimum sur tous les thèmes
- Support `prefers-reduced-motion`
- Focus visible sur tous les éléments interactifs
- Tailles de police adaptées

---

**Développé avec ❤️ pour ByteBattle**
