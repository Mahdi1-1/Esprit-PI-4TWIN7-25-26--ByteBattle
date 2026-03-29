# Research: Keyboard Shortcuts System

## Existing Codebase Analysis

### Current Keyboard Handling

1. **`sidebar.tsx`** — Already has `Ctrl+B` toggle via `window.addEventListener('keydown', ...)` inside a `useEffect`. Pattern: single-purpose, tightly coupled.

2. **`GraphVisualizer.tsx`** — Has `Escape` (exit fullscreen) and `Space` (play/pause) via a similar `useEffect` + `window.addEventListener('keydown')`. Pattern: ad-hoc, per-component.

3. **`Problem.tsx`** — Monaco's `editor.onKeyDown()` blocks Ctrl+C/V inside the editor for anticheat. Pattern: Monaco-specific interception.

4. **`CanvasEditor.tsx`** — Has `visibilitychange` listener but no keyboard shortcuts beyond Excalidraw's built-in ones.

5. **`useAnticheat.ts`** — Blocks copy/paste/contextmenu globally. Important: our shortcut system must NOT conflict with anticheat (e.g., we must not re-enable paste via a shortcut).

### No Central Shortcut System Exists

There is no `useKeyboardShortcuts` hook, no `KeyboardShortcutsContext`, no `CommandPalette` component. Every keyboard interaction is ad-hoc.

---

## Context Providers Chain (App.tsx)

```
StrictMode
  ErrorBoundary
    LanguageProvider
      ThemeProvider
        FontSizeProvider
          AuthProvider
            EditorThemeProvider
              RouterProvider + Toaster
```

The new `KeyboardShortcutsProvider` should wrap just inside `EditorThemeProvider` and outside `RouterProvider`, so it has access to all context values (auth, theme, language) and can navigate via `window.location` or `navigate()`.

**Problem**: `RouterProvider` creates its own React tree — we can't use `useNavigate()` from outside it. 

**Solution**: The provider will go INSIDE the route tree by wrapping a Layout component, OR use `router.navigate()` from the router instance directly (since `router` is exported from `routes.tsx`).

---

## Route Map (for Command Palette)

From `routes.tsx`:

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/` | Landing | No |
| `/login` | UnifiedLogin | No |
| `/dashboard` | Dashboard | Yes (user) |
| `/problems` | Problems | Yes (user) |
| `/problem/:id` | Problem | Yes (user) |
| `/duel` | DuelMatchmaking | Yes (user) |
| `/duel/room/:id` | DuelRoom | Yes (user) |
| `/hackathon` | Hackathon | Yes (user) |
| `/leaderboard` | Leaderboard | Yes (user) |
| `/themes` | Themes | Yes (user) |
| `/canvas` | CanvasCatalog | Yes (user) |
| `/discussion` | DiscussionPage | Yes (user) |
| `/interview` | AIInterviewPage | Yes (user) |
| `/settings` | Settings | Yes (user) |
| `/sketchpad` | SketchpadPage | Yes (user) |
| `/data-structures` | DataStructuresPage | Yes (user) |
| `/admin/*` | Admin pages | Yes (admin) |

---

## Keyboard Event Considerations

### Modifier Key Detection

```typescript
// Cross-platform: Cmd on Mac = Ctrl on Windows/Linux
const isModifier = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;
```

### Input Focus Detection

```typescript
const isEditableElement = (el: Element | null): boolean => {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  // Monaco editor wraps in a div with class "monaco-editor"
  if (el.closest('.monaco-editor')) return true;
  return false;
};
```

### Key Normalization

`KeyboardEvent.key` values are case-sensitive and locale-dependent. We normalize:
- `e.key.toLowerCase()` for letter keys
- Keep special keys as-is: `Enter`, `Escape`, `Backspace`, `F11`, `ArrowUp`, `ArrowDown`, `/`, `?`

---

## Libraries Considered

| Library | Stars | Size | Decision |
|---------|-------|------|----------|
| `react-hotkeys-hook` | 2.8K | 3KB | Too simple — no registry, no command palette |
| `tinykeys` | 3.5K | 700B | Tiny but no React integration, no focus awareness |
| `mousetrap` | 11K | 4KB | No React, no TypeScript, abandoned |
| **Custom hook** | — | ~2KB | Best fit — full control, type-safe, zero deps |

**Decision**: Build custom. The requirements (focus suppression, context integration, registry for help modal, Command Palette) are too specific for a generic library.

---

## Performance Strategy

### Single Global Listener

Instead of N `addEventListener` calls (one per `useKeyboardShortcuts` call), we use ONE global listener in the context provider that dispatches to a `Map<string, ShortcutHandler>`:

```typescript
// Key format: "ctrl+shift+enter", "alt+p", "j", "?"
const shortcutMap = new Map<string, RegisteredShortcut>();

function buildKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}
```

Lookup is O(1). Registration/unregistration is O(1).

---

## Monaco Editor Integration

Monaco captures keyboard events before they reach the DOM. For `Ctrl+Enter` and `Ctrl+Shift+Enter` to work inside the editor:

```typescript
editor.addAction({
  id: 'bytebattle-run',
  label: 'Run Code',
  keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
  run: () => handleRun(),
});

editor.addAction({
  id: 'bytebattle-submit',
  label: 'Submit Code',
  keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
  run: () => handleSubmit(),
});
```

This registers the actions IN Monaco's keybinding system, so they fire even when Monaco has focus.

---

## Accessibility Notes

- All modals (`CommandPalette`, `ShortcutsHelpModal`) must have `role="dialog"`, `aria-modal="true"`, `aria-label`.
- Focus trap inside modals (Tab cycles within the modal).
- `Escape` always closes the topmost modal.
- Command Palette items have `role="option"` inside a `role="listbox"`.
- `aria-activedescendant` tracks the currently highlighted command.
- Keyboard shortcut badges use `<kbd>` elements with proper styling.
