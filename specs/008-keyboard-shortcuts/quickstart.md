# Quickstart: Keyboard Shortcuts System

## What is this feature?

A complete keyboard shortcut system for ByteBattle2 that includes:
- **Global navigation** via `Alt+<letter>` hotkeys
- A **Command Palette** (`Ctrl+K`) — like VS Code
- **Page-specific shortcuts** for the code editor, forum, leaderboard, interview
- A **help overlay** (`?`) showing all available shortcuts

## Architecture

```
KeyboardShortcutsProvider (Context)
  ├── Single global keydown listener
  ├── ShortcutMap (O(1) lookup)
  ├── CommandPalette (Ctrl+K)
  └── ShortcutsHelpModal (?)
          
useKeyboardShortcuts(shortcuts[])
  ├── Registers into provider's map on mount
  └── Unregisters on unmount
```

## Key files

| File | Purpose |
|------|---------|
| `src/hooks/useKeyboardShortcuts.ts` | Core hook — components use this to register shortcuts |
| `src/context/KeyboardShortcutsContext.tsx` | Provider with single global keydown listener |
| `src/components/CommandPalette.tsx` | Ctrl+K modal |
| `src/components/ShortcutsHelpModal.tsx` | ? help overlay |
| `src/components/ShortcutBadge.tsx` | `<kbd>` display component |
| `src/constants/commands.ts` | All command definitions |

## Quick reference — Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Command Palette |
| `?` | Keyboard shortcuts help |
| `Escape` | Close modal/palette |
| `Alt+H` | Dashboard |
| `Alt+P` | Problems |
| `Alt+F` | Forum |
| `Alt+D` | Duels |
| `Alt+L` | Leaderboard |
| `Ctrl+Shift+D` | Toggle dark/light |
| `Ctrl+Shift+L` | Toggle language |

## How to add a shortcut to a new page

```typescript
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

function MyPage() {
  useKeyboardShortcuts([
    {
      id: 'mypage.do-thing',
      key: 'Enter',
      ctrl: true,
      action: () => doThing(),
      description: 'Do the thing',
      category: 'editor',
    },
  ]);

  return <div>...</div>;
}
```

The shortcut automatically registers when the page mounts and unregisters when it unmounts.
