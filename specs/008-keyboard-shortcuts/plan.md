# Implementation Plan: Keyboard Shortcuts System

## Phase Overview

| Phase | Scope | Stories | Effort |
|-------|-------|---------|--------|
| **Phase 1** | Core engine + Global navigation + Command Palette | US-1, US-2 | 2 days |
| **Phase 2** | Code editor + Forum + System shortcuts | US-3, US-4, US-5 | 1.5 days |
| **Phase 3** | Leaderboard + Interview + Polish | US-6 | 0.5 day |

---

## Phase 1 — Core Engine + Global Navigation + Command Palette

### Step 1.1: Create `useKeyboardShortcuts` hook

**File**: `frontend/src/hooks/useKeyboardShortcuts.ts`

- Accept an array of `KeyboardShortcut` definitions
- On mount, register each shortcut into the global context's `ShortcutMap`
- On unmount, unregister them
- No `addEventListener` inside the hook — all listening is done centrally

### Step 1.2: Create `KeyboardShortcutsContext`

**File**: `frontend/src/context/KeyboardShortcutsContext.tsx`

- Single global `keydown` listener on `window`
- Maintains a `Map<string, RegisteredShortcut>` of all active shortcuts
- On each keydown:
  1. Build the normalized key combo string
  2. Look up in the map
  3. Check `when()` guard if present
  4. Check input-focus suppression rules
  5. Call `action()` and `e.preventDefault()`
- Expose `registerShortcuts`, `unregisterShortcuts`, `getAllShortcuts`, `openCommandPalette`, `openHelpModal`

### Step 1.3: Create `CommandPalette` component

**File**: `frontend/src/components/CommandPalette.tsx`

- Rendered via React Portal on `document.body` at `z-[9999]`
- Auto-focus search input on open
- Filter commands with `label.toLowerCase().includes(query)`
- Arrow-key navigation with `selectedIndex`
- Enter to execute, Escape to close
- Shows recent commands at top when query is empty
- Groups by category with section headers

### Step 1.4: Create `ShortcutsHelpModal` component

**File**: `frontend/src/components/ShortcutsHelpModal.tsx`

- Reads all shortcuts from context via `getAllShortcuts()`
- Groups by `category`
- Displays in a multi-column grid
- Each row: description + `<kbd>` badge

### Step 1.5: Create `ShortcutBadge` component

**File**: `frontend/src/components/ShortcutBadge.tsx`

- Renders `<kbd>` elements with proper styling
- Parses combo strings like "Ctrl+K" into individual key badges

### Step 1.6: Wire into `App.tsx`

- Wrap the existing provider chain with `<KeyboardShortcutsProvider>`
- Since we need `useNavigate()`, the provider will be a component rendered inside the RouterProvider's tree (via a wrapper layout component), OR we'll use the exported `router` object's `.navigate()` method

### Step 1.7: Register global navigation shortcuts

**File**: `frontend/src/constants/commands.ts`

- Define all navigation commands, theme commands, language commands, system commands
- Register navigation shortcuts (`Alt+H`, `Alt+P`, etc.) inside the provider
- Register `Ctrl+K` (Command Palette toggle)
- Register `?` (Help modal toggle)
- Register `Escape` (close any open modal)
- Register `Ctrl+Shift+D` (dark mode toggle)
- Register `Ctrl+Shift+L` (language toggle)

---

## Phase 2 — Code Editor + Forum + System Shortcuts

### Step 2.1: Problem.tsx — Editor shortcuts

- Call `useKeyboardShortcuts()` with:
  - `Ctrl+Enter` → `handleRun()` (with `when: () => !isMonacoFocused`)
  - `Ctrl+Shift+Enter` → `handleSubmit()` (with `when: () => !isMonacoFocused`)
  - `F11` → toggle editor fullscreen
- Also register Ctrl+Enter/Ctrl+Shift+Enter directly in Monaco via `editor.addAction()` so they work with focus inside Monaco too

### Step 2.2: DuelRoom.tsx — Editor shortcuts

- Same pattern as Problem.tsx:
  - `Ctrl+Enter` → `handleTestCode()`
  - `Ctrl+Shift+Enter` → submit (if we add a separate submit)

### Step 2.3: DiscussionPage.tsx — Forum shortcuts

- Add `selectedPostIndex` state
- Call `useKeyboardShortcuts()` with:
  - `J` → increment `selectedPostIndex` (+ scroll into view)
  - `K` → decrement `selectedPostIndex`
  - `Enter` → navigate to selected post
  - `N` → open new post form
  - `1`-`7` → select category
- Add visible selection border on the selected post card

### Step 2.4: DiscussionDetailPage.tsx — Detail shortcuts

- `Backspace` → navigate back to `/discussion`
- `U` → upvote current post
- `Shift+U` → downvote
- `R` → focus reply textarea
- `Ctrl+Enter` → submit reply (when reply textarea is focused)

---

## Phase 3 — Leaderboard + Interview + Polish

### Step 3.1: Leaderboard.tsx

- Add `selectedRowIndex` state
- `J`/`K` → navigate rows
- `Enter` → view profile
- `1`/`2`/`3` → switch tabs
- `M` → scroll to my rank

### Step 3.2: AIInterviewPage.tsx

- `Ctrl+Enter` → send message
- `Ctrl+M` → toggle mic
- `Ctrl+Shift+M` → toggle TTS auto-play
- `Escape` → stop recording

### Step 3.3: Polish & Integration

- Add `ShortcutBadge` hints to Navbar dropdown menu items
- Add "Press ? for keyboard shortcuts" hint in the footer or Navbar
- Test all shortcuts for conflicts
- Test with anticheat enabled (Problem.tsx, DuelRoom.tsx)
- Verify shortcuts don't fire in Monaco, inputs, textareas
- Test Command Palette with all command categories
- Verify Escape closes modals in correct order (Command Palette > Help > other modals)

---

## Dependency Graph

```
Step 1.1 (hook) ─────────┐
Step 1.2 (context) ───────┤─── Step 1.6 (App.tsx) ─── Step 1.7 (global shortcuts)
Step 1.3 (palette) ───────┤
Step 1.4 (help modal) ────┘
Step 1.5 (badge) ──────── standalone

Phase 2 depends on Phase 1 (context must exist)
Phase 3 depends on Phase 1 (context must exist)
Phase 2 & 3 are independent of each other
```
