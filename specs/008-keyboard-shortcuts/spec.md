# Feature Specification: Keyboard Shortcuts System

**Feature Branch**: `008-keyboard-shortcuts`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: Implement a comprehensive keyboard shortcut system for ByteBattle2 enabling full keyboard-driven navigation and interaction — Command Palette, global navigation, page-specific actions, and a help overlay.

## Clarifications

### Session 2026-03-28

- Q: Should shortcuts fire when the user is typing in an `<input>`, `<textarea>`, or Monaco editor? → A: **No** — global single-key shortcuts (J, K, N, ?, etc.) are suppressed when focus is inside an editable element. Modifier shortcuts (`Ctrl+K`, `Alt+H`, etc.) always fire because they include a modifier key.
- Q: Should shortcuts be persisted/customizable? → A: **No** — V1 ships with fixed bindings. Customization can come later.
- Q: Should the Command Palette be available to unauthenticated users? → A: Yes, but the command list will be filtered — only public navigation ("Go to Login", "Go to Signup") is available.
- Q: What happens if a shortcut conflicts with a browser/OS shortcut? → A: We use `Alt+` prefix for navigation (which has no browser conflict) and `Ctrl+Shift+` for system actions. `Ctrl+K` (Command Palette) is safe in all browsers. We `e.preventDefault()` only on our registered combos.
- Q: Should the shortcut system respect reduced-motion preferences? → A: The Command Palette will skip entrance animations if `prefers-reduced-motion: reduce` is set.

---

## User Scenarios & Testing

### User Story 1 — Global Navigation Shortcuts (Priority: P1)

A logged-in user presses `Alt+P` from any page and is instantly navigated to `/problems`. All `Alt+<letter>` shortcuts work from any page except when a modal is open.

**Why this priority**: Navigation shortcuts give the biggest productivity boost with the least complexity.

**Independent Test**: Log in → press `Alt+P` → URL changes to `/problems`. Press `Alt+F` → URL changes to `/discussion`. Press `Alt+H` → URL changes to `/dashboard`.

**Acceptance Scenarios**:

1. **Given** a logged-in user on `/dashboard`, **When** they press `Alt+P`, **Then** the app navigates to `/problems`.
2. **Given** a logged-in user on `/problems`, **When** they press `Alt+D`, **Then** the app navigates to `/duel`.
3. **Given** a logged-in user on `/leaderboard`, **When** they press `Alt+F`, **Then** the app navigates to `/discussion`.
4. **Given** the Command Palette is open, **When** the user presses `Alt+P`, **Then** the palette closes first, then navigates to `/problems`.
5. **Given** a user with focus in a search `<input>`, **When** they press `Alt+P`, **Then** the app navigates (modifier shortcuts always work even in inputs).
6. **Given** a guest (not logged in) on `/`, **When** they press `Alt+P`, **Then** nothing happens (routes require auth).

---

### User Story 2 — Command Palette (Priority: P1)

A user presses `Ctrl+K` and a centered modal appears with a search input and a filterable list of commands. They type "prob" and the list shows "Go to Problems". They press `Enter` and are navigated. The palette supports arrow-key navigation and categories.

**Why this priority**: The Command Palette is the single most impactful keyboard feature — it provides discovery of ALL actions.

**Independent Test**: Press `Ctrl+K` → palette appears → type "dark" → see "Switch to Dark Mode" → press Enter → theme toggles → palette closes.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they press `Ctrl+K`, **Then** a modal overlay appears centered on screen with an auto-focused search input and a list of commands grouped by category.
2. **Given** the palette is open, **When** the user types "prob", **Then** only commands matching "prob" (e.g., "Go to Problems") are shown.
3. **Given** the palette shows filtered results, **When** the user presses `↓` twice then `Enter`, **Then** the third command executes.
4. **Given** the palette is open, **When** the user presses `Escape`, **Then** the palette closes and focus returns to the previous element.
5. **Given** the palette is already open, **When** the user presses `Ctrl+K` again, **Then** the palette closes (toggle behavior).
6. **Given** the palette is open and the search is "go to", **When** the list shows 8 navigation commands, **Then** each shows its icon, label, category tag, and keyboard shortcut hint (e.g., `Alt+P`).
7. **Given** a guest user, **When** they press `Ctrl+K`, **Then** the palette shows only public commands: "Go to Login", "Go to Signup", "Switch Theme", "Switch Language".

---

### User Story 3 — Code Editor Shortcuts (Priority: P2)

A user on `/problem/:id` or `/duel/room/:id` presses `Ctrl+Enter` to run their code and `Ctrl+Shift+Enter` to submit it. These shortcuts work ONLY when focus is NOT inside the Monaco editor (Monaco has its own keybinding layer).

**Why this priority**: These are the most frequent actions for the core coding experience but require coordination with Monaco's own shortcut system.

**Independent Test**: Navigate to `/problem/some-id` → write code → click outside Monaco → press `Ctrl+Enter` → code runs. Press `Ctrl+Shift+Enter` → code submits.

**Acceptance Scenarios**:

1. **Given** a user on `/problem/:id` with focus outside Monaco, **When** they press `Ctrl+Enter`, **Then** `handleRun()` is called.
2. **Given** a user on `/problem/:id` with focus outside Monaco, **When** they press `Ctrl+Shift+Enter`, **Then** `handleSubmit()` is called.
3. **Given** a user on `/duel/room/:id` with focus outside Monaco, **When** they press `Ctrl+Enter`, **Then** `handleTestCode()` is called.
4. **Given** a user on `/problem/:id` with focus **inside** Monaco, **When** they press `Ctrl+Enter`, **Then** Monaco's own command fires (if any) — our global handler does NOT interfere.
5. **Given** a user on `/problem/:id`, **When** they press `F11`, **Then** the editor panel toggles fullscreen.

---

### User Story 4 — Forum Shortcuts (Priority: P2)

A user on `/discussion` presses `J`/`K` to navigate between posts, `Enter` to open the selected post, and `N` to create a new post. These single-key shortcuts are disabled when typing in the search bar.

**Why this priority**: The forum is a secondary feature but keyboard navigation (J/K/Enter) follows a well-known pattern (Gmail, Reddit, HN) that power users expect.

**Independent Test**: Navigate to `/discussion` → press `J` → first post is highlighted → press `J` → second post highlighted → press `Enter` → navigated to post detail.

**Acceptance Scenarios**:

1. **Given** a user on `/discussion` with no post selected, **When** they press `J`, **Then** the first post gets a visible selection border.
2. **Given** post #2 is selected, **When** the user presses `J`, **Then** post #3 is selected and scrolled into view.
3. **Given** post #3 is selected, **When** the user presses `K`, **Then** post #2 is selected.
4. **Given** post #2 is selected, **When** the user presses `Enter`, **Then** the app navigates to `/discussion/<post-id>`.
5. **Given** the user is on `/discussion`, **When** they press `N`, **Then** the new-post form/modal opens.
6. **Given** focus is inside the search input, **When** the user presses `J`, **Then** the letter "j" is typed in the input (shortcut suppressed).
7. **Given** the user is on `/discussion/:id`, **When** they press `Backspace` (not in an input), **Then** the app navigates back to `/discussion`.

---

### User Story 5 — System Shortcuts (Priority: P2)

A user presses `Ctrl+Shift+D` to toggle dark/light mode, `Ctrl+Shift+L` to toggle language (FR↔EN), and `?` to open the keyboard shortcuts help overlay.

**Why this priority**: System shortcuts affect the global app state and provide discoverability.

**Independent Test**: Press `?` → shortcuts modal appears showing all shortcuts by category. Press `Ctrl+Shift+D` → color scheme toggles. Press `Ctrl+Shift+L` → language switches.

**Acceptance Scenarios**:

1. **Given** any page, **When** the user presses `?` (not in an input), **Then** a modal shows all keyboard shortcuts organized by category.
2. **Given** the help modal is open, **When** the user presses `Escape`, **Then** the modal closes.
3. **Given** the app is in dark mode, **When** the user presses `Ctrl+Shift+D`, **Then** it switches to light mode.
4. **Given** the app language is French, **When** the user presses `Ctrl+Shift+L`, **Then** it switches to English.
5. **Given** the user is in any text input and presses `?`, **Then** the `?` character is typed — the help modal does NOT open.

---

### User Story 6 — Leaderboard & Interview Shortcuts (Priority: P3)

The leaderboard supports `J`/`K` navigation and `1`/`2`/`3` tab switching. The AI Interview page supports `Ctrl+Enter` to send messages and `Ctrl+M` for mic toggle.

**Why this priority**: These are secondary pages with lower traffic.

**Independent Test**: Navigate to `/leaderboard` → press `1` → global tab activates → press `J` → first user highlighted. Navigate to `/interview` → type a message → press `Ctrl+Enter` → message sent.

**Acceptance Scenarios**:

1. **Given** a user on `/leaderboard`, **When** they press `1`, **Then** the "Global" tab activates.
2. **Given** a user on `/leaderboard`, **When** they press `J`, **Then** the next user row is highlighted.
3. **Given** a user on `/leaderboard`, **When** they press `M`, **Then** the view scrolls to "my rank" row.
4. **Given** a user on `/interview` with text in the input, **When** they press `Ctrl+Enter`, **Then** the message is sent.
5. **Given** a user on `/interview`, **When** they press `Ctrl+M`, **Then** the voice recorder toggles.

---

## Technical Architecture

### Component Overview

```
App.tsx
 └─ KeyboardShortcutsProvider  ← NEW (wraps everything, provides context)
     ├─ GlobalShortcutListener  ← NEW (handles Alt+*, Ctrl+K, ?, Ctrl+Shift+D/L)
     ├─ CommandPalette          ← NEW (modal UI)
     ├─ ShortcutsHelpModal      ← NEW (? help overlay)
     └─ ... existing providers & router
```

### File Plan

| File | Type | Description |
|------|------|-------------|
| `src/hooks/useKeyboardShortcuts.ts` | Hook | Core engine — registers/unregisters key listeners, modifier detection, input suppression |
| `src/context/KeyboardShortcutsContext.tsx` | Context | Exposes `registerShortcuts()`, `unregisterShortcuts()`, full shortcut registry for help modal |
| `src/components/CommandPalette.tsx` | Component | Ctrl+K modal — search, fuzzy filter, arrow-key nav, command execution |
| `src/components/ShortcutsHelpModal.tsx` | Component | `?` modal — renders all shortcuts grouped by category |
| `src/components/ShortcutBadge.tsx` | Component | Small `<kbd>` badge to display a shortcut combo (e.g., `Ctrl+K`) |

### Integration Points

| Existing File | Change |
|---|---|
| `App.tsx` | Wrap with `<KeyboardShortcutsProvider>` |
| `pages/Problem.tsx` | Call `useKeyboardShortcuts()` for Ctrl+Enter (run), Ctrl+Shift+Enter (submit) |
| `pages/DuelRoom.tsx` | Same as Problem.tsx |
| `pages/DiscussionPage.tsx` | J/K/Enter/N navigation |
| `pages/Leaderboard.tsx` | J/K/1-3/M navigation |
| `pages/AIInterviewPage.tsx` | Ctrl+Enter (send), Ctrl+M (mic) |
| `components/Navbar.tsx` | Display `ShortcutBadge` hints in dropdown items |

### Core Hook API

```typescript
// src/hooks/useKeyboardShortcuts.ts

interface KeyboardShortcut {
  id: string;                // unique key, e.g. "global.go-problems"
  key: string;               // the key to listen for (e.g. "p", "k", "Enter", "F11", "?")
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;       // human-readable, e.g. "Go to Problems"
  category: 'navigation' | 'editor' | 'forum' | 'duel' | 'leaderboard' | 'interview' | 'system';
  when?: () => boolean;      // optional guard — shortcut only fires if this returns true
  ignoreInputFocus?: boolean; // default: single-key shortcuts are suppressed in inputs; modifier shortcuts fire always
}

function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void;
```

### Input Focus Suppression Logic

```
IF the active element is <input>, <textarea>, <select>, or [contenteditable],
  AND the shortcut has NO modifier (ctrl/alt/shift are all false),
  AND ignoreInputFocus is NOT explicitly set to true,
THEN do NOT fire the shortcut.
```

This ensures typing `j` in a search box does NOT trigger "next post".

### Command Palette Commands

The command list is built from:

1. **Static navigation commands** — hardcoded map of `{ label, path, icon, shortcut? }`
2. **Theme commands** — one entry per theme: "Switch to Cyber Arena", etc.
3. **Language commands** — "Switch to French", "Switch to English"
4. **System commands** — "Toggle Dark Mode", "Open Settings"
5. **Auth-gated commands** — only shown if authenticated: "New Post", "Start Duel", etc.

Fuzzy matching uses a simple `label.toLowerCase().includes(query.toLowerCase())` — no external library needed.

---

## Data Model

No database changes required. This feature is entirely frontend.

The only persisted data is the user's preference for the Command Palette "recent commands" list, stored in `localStorage`:

```typescript
// localStorage key: "bb2_recent_commands"
// Value: JSON array of command IDs (last 5)
["global.go-problems", "system.toggle-dark", "nav.go-forum"]
```

---

## API Contracts

No API changes required. This feature is entirely frontend.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Monaco editor captures Ctrl+Enter | Code editor shortcuts won't fire via our system | Use Monaco's `editor.addAction()` API to register Ctrl+Enter/Ctrl+Shift+Enter directly inside Monaco, and call our handlers from there |
| Shortcut conflicts with browser defaults | Ctrl+D (bookmark) would be hijacked | We avoid Ctrl+D globally. Only use Ctrl+Shift+D for dark mode toggle. All global nav uses Alt+ prefix which has no browser conflicts |
| Single-key shortcuts firing in text inputs | Typing "j" in search would navigate | The `useKeyboardShortcuts` hook checks `document.activeElement` tag and suppresses single-key shortcuts in editable elements |
| Performance — too many keydown listeners | Sluggish keypress response | Single global listener in the context provider dispatches to a Map lookup (O(1)). Individual `useKeyboardShortcuts` calls register into the central map, not separate `addEventListener` calls |
| Command Palette appearing behind modals | Z-index stacking | Command Palette renders at `z-[9999]` in a React portal attached to `document.body` |
| Accessibility — screen readers | Shortcuts may conflict with AT keys | All shortcuts use modifier keys that don't conflict with common screen reader commands. The `?` help modal is ARIA-labeled and keyboard-navigable |

---

## Out of Scope (V1)

- Custom keybinding configuration (user-defined shortcuts)
- Vim/Emacs mode for the code editor
- Shortcut recording/macro system
- Gamepad/controller support
- Per-page shortcut scopes beyond what is listed above
