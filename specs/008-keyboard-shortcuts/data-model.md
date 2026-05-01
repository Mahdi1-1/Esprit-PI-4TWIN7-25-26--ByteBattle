# Data Model: Keyboard Shortcuts System

## No Database Changes Required

This feature is entirely client-side. No Prisma schema changes, no new API endpoints, no migrations.

---

## Client-Side State

### 1. Shortcut Registry (In-Memory)

Held in React Context. Not persisted.

```typescript
interface RegisteredShortcut {
  id: string;
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  action: () => void;
  description: string;
  category: ShortcutCategory;
  when?: () => boolean;
  ignoreInputFocus: boolean;
}

type ShortcutCategory =
  | 'navigation'
  | 'editor'
  | 'forum'
  | 'duel'
  | 'leaderboard'
  | 'interview'
  | 'system';

// Map key: normalized combo string, e.g. "alt+p", "ctrl+k", "j"
type ShortcutMap = Map<string, RegisteredShortcut>;
```

### 2. Command Palette State (In-Memory)

```typescript
interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  filteredCommands: PaletteCommand[];
}

interface PaletteCommand {
  id: string;
  label: string;
  icon?: React.ReactNode;
  category: string;
  shortcut?: string;        // Display string like "Alt+P"
  action: () => void;
  keywords?: string[];       // Extra search terms
  requiresAuth?: boolean;
}
```

### 3. Recent Commands (localStorage)

```typescript
// Key: "bb2_recent_commands"
// Value: JSON string[]
// Max length: 5

// Example:
["global.go-problems", "system.toggle-dark", "nav.go-forum"]
```

### 4. Help Modal Visibility (In-Memory)

```typescript
interface ShortcutsHelpState {
  isOpen: boolean;
}
```

---

## Static Command Registry

Not stored in DB — hardcoded in `src/constants/commands.ts`:

```typescript
const NAVIGATION_COMMANDS: PaletteCommand[] = [
  { id: 'nav.dashboard',   label: 'Go to Dashboard',     path: '/dashboard',   shortcut: 'Alt+H', icon: Home },
  { id: 'nav.problems',    label: 'Go to Problems',      path: '/problems',    shortcut: 'Alt+P', icon: Code2 },
  { id: 'nav.canvas',      label: 'Go to Canvas',        path: '/canvas',      shortcut: 'Alt+C', icon: PenTool },
  { id: 'nav.forum',       label: 'Go to Forum',         path: '/discussion',  shortcut: 'Alt+F', icon: MessageSquare },
  { id: 'nav.duel',        label: 'Go to Duels',         path: '/duel',        shortcut: 'Alt+D', icon: Swords },
  { id: 'nav.interview',   label: 'Go to Interview',     path: '/interview',   shortcut: 'Alt+I', icon: Bot },
  { id: 'nav.leaderboard', label: 'Go to Leaderboard',   path: '/leaderboard', shortcut: 'Alt+L', icon: Trophy },
  { id: 'nav.hackathon',   label: 'Go to Hackathons',    path: '/hackathon',   shortcut: 'Alt+K', icon: Users },
  { id: 'nav.settings',    label: 'Go to Settings',      path: '/settings',    shortcut: 'Alt+S', icon: Settings },
  { id: 'nav.themes',      label: 'Go to Themes',        path: '/themes',      shortcut: 'Alt+T', icon: Palette },
];

const SYSTEM_COMMANDS: PaletteCommand[] = [
  { id: 'sys.dark-mode',   label: 'Toggle Dark/Light Mode', shortcut: 'Ctrl+Shift+D', action: toggleColorScheme },
  { id: 'sys.language',    label: 'Switch Language (FR↔EN)', shortcut: 'Ctrl+Shift+L', action: toggleLanguage },
  { id: 'sys.help',        label: 'Show Keyboard Shortcuts', shortcut: '?', action: openHelp },
];

const THEME_COMMANDS: PaletteCommand[] = [
  { id: 'theme.cyber',   label: 'Switch to Cyber Arena',  action: () => setTheme('cyber') },
  { id: 'theme.space',   label: 'Switch to Space Ops',    action: () => setTheme('space') },
  { id: 'theme.samurai', label: 'Switch to Samurai Dojo', action: () => setTheme('samurai') },
  { id: 'theme.pixel',   label: 'Switch to Pixel Arcade', action: () => setTheme('pixel') },
  { id: 'theme.mythic',  label: 'Switch to Mythic RPG',   action: () => setTheme('mythic') },
  { id: 'theme.sports',  label: 'Switch to Sports Arena', action: () => setTheme('sports') },
];
```
