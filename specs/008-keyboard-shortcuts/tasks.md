# Tasks: Keyboard Shortcuts System

## Phase 1 — Core Engine + Global Navigation + Command Palette

### Task 1.1 — Create `useKeyboardShortcuts` hook
- **File**: `frontend/src/hooks/useKeyboardShortcuts.ts`
- **Action**: Create new file
- **Details**:
  - Define `KeyboardShortcut` interface with `id`, `key`, `ctrl?`, `shift?`, `alt?`, `action`, `description`, `category`, `when?`, `ignoreInputFocus?`
  - Hook accepts `KeyboardShortcut[]`
  - On mount: register each shortcut into context's map via `registerShortcuts()`
  - On unmount: unregister via `unregisterShortcuts()`
  - No direct DOM event listeners — delegation to context
- **Tests**: Verify shortcuts register/unregister on mount/unmount
- **Checklist**: `checklists/1.1-hook.md`

---

### Task 1.2 — Create `KeyboardShortcutsContext`
- **File**: `frontend/src/context/KeyboardShortcutsContext.tsx`
- **Action**: Create new file
- **Details**:
  - `KeyboardShortcutsProvider` component
  - Internal state: `shortcutMap: Map<string, RegisteredShortcut>`
  - Internal state: `commandPaletteOpen: boolean`, `helpModalOpen: boolean`
  - Single `window.addEventListener('keydown', handler)` in `useEffect`
  - Handler logic:
    1. Build key string: `[ctrl+][shift+][alt+]<key.toLowerCase()>`
    2. Look up in map
    3. If found: check `when()` guard → check input-focus suppression → call `action()` + `e.preventDefault()`
  - Input-focus suppression: if `shortcut.ctrl === false && shortcut.alt === false && shortcut.shift === false` and `activeElement` is input/textarea/select/contenteditable/monaco, suppress
  - Expose via context: `registerShortcuts`, `unregisterShortcuts`, `getAllShortcuts`, `isCommandPaletteOpen`, `setCommandPaletteOpen`, `isHelpModalOpen`, `setHelpModalOpen`
- **Tests**: Register a shortcut → simulate keydown → action fires. Register in input → single-key suppressed. Register with modifier → fires in input.
- **Checklist**: `checklists/1.2-context.md`

---

### Task 1.3 — Create `CommandPalette` component
- **File**: `frontend/src/components/CommandPalette.tsx`
- **Action**: Create new file
- **Details**:
  - Rendered via `ReactDOM.createPortal(jsx, document.body)` at `z-[9999]`
  - Backdrop: semi-transparent overlay, closes on click
  - Modal: `max-w-lg`, centered, themed with `var(--surface-1)`, `var(--border-default)`, `var(--brand-primary)`
  - Search input auto-focused on open
  - Command list:
    - When query is empty: show recent commands (from localStorage) + all commands grouped by category
    - When query is non-empty: fuzzy filter `label.toLowerCase().includes(query.toLowerCase())`
    - Group by category with section headers
  - Each command row: icon, label, category badge, shortcut badge (if exists)
  - Arrow keys: move `selectedIndex` (wrap around)
  - Enter: execute `filteredCommands[selectedIndex].action()`, close palette, save to recent
  - Escape: close
  - `role="dialog"`, `aria-modal="true"`, `aria-label="Command Palette"`
  - Command items: `role="option"` inside `role="listbox"`
  - `aria-activedescendant` for current selection
  - `prefers-reduced-motion`: skip entrance animation
- **Tests**: Open with Ctrl+K → type "prob" → "Go to Problems" visible → Enter → navigated. Arrow keys → selection moves. Escape → closes.
- **Checklist**: `checklists/1.3-palette.md`

---

### Task 1.4 — Create `ShortcutsHelpModal` component
- **File**: `frontend/src/components/ShortcutsHelpModal.tsx`
- **Action**: Create new file
- **Details**:
  - Portal at `z-[9998]` (below Command Palette)
  - Reads all shortcuts from context `getAllShortcuts()`
  - Groups by `category` with section headings
  - Multi-column grid layout (2 cols on desktop, 1 on mobile)
  - Each row: description text + `ShortcutBadge`
  - Escape to close
  - Themed with design system variables
- **Checklist**: `checklists/1.4-help-modal.md`

---

### Task 1.5 — Create `ShortcutBadge` component
- **File**: `frontend/src/components/ShortcutBadge.tsx`
- **Action**: Create new file
- **Details**:
  - Props: `combo: string` (e.g., "Ctrl+K", "Alt+P", "?")
  - Splits on `+`, renders each part as `<kbd>` with styling:
    - `bg-[var(--surface-2)]`, `border border-[var(--border-default)]`, `rounded-[var(--radius-sm)]`, `px-1.5 py-0.5 text-xs font-mono`
    - `+` separator between keys
  - Renders inline
- **Checklist**: N/A (trivial component)

---

### Task 1.6 — Create command definitions
- **File**: `frontend/src/constants/commands.ts`
- **Action**: Create new file
- **Details**:
  - `NAVIGATION_COMMANDS`: 10 nav entries with path, label, icon, shortcut
  - `SYSTEM_COMMANDS`: dark mode, language toggle, help
  - `THEME_COMMANDS`: 6 theme switch entries
  - `LANGUAGE_COMMANDS`: French, English, Arabic
  - `ACTION_COMMANDS`: New Post, Start Duel, Create Challenge (auth-gated)
  - Helper: `buildAllCommands(navigate, toggleColorScheme, setTheme, setLanguage, ...)` that takes context functions and returns fully wired `PaletteCommand[]`
- **Checklist**: N/A (data file)

---

### Task 1.7 — Wire `KeyboardShortcutsProvider` into App.tsx
- **File**: `frontend/src/App.tsx`
- **Action**: Edit existing file
- **Details**:
  - Option A: Add a `<ShortcutsLayout>` wrapper component rendered inside `RouterProvider` that provides navigation and calls `useKeyboardShortcuts` for global shortcuts
  - Option B: Use `router.navigate()` directly from the context (since `router` is exported)
  - Chosen: **Option B** — import `router` from `routes.tsx` into the context. No need to change route tree.
  - Wrap `<RouterProvider>` with `<KeyboardShortcutsProvider>`
  - Render `<CommandPalette />` and `<ShortcutsHelpModal />` inside the provider
- **Checklist**: `checklists/1.7-app-integration.md`

---

## Phase 2 — Code Editor + Forum + System Shortcuts

### Task 2.1 — Problem.tsx editor shortcuts
- **File**: `frontend/src/pages/Problem.tsx`
- **Action**: Edit existing file
- **Details**:
  - Import `useKeyboardShortcuts`
  - Register `Ctrl+Enter` → `handleRun()` with `when: () => !isMonacoFocused()`
  - Register `Ctrl+Shift+Enter` → `handleSubmit()` with `when: () => !isMonacoFocused()`
  - Register `F11` → toggle fullscreen
  - In Monaco `onMount`: add `editor.addAction()` for Ctrl+Enter and Ctrl+Shift+Enter so they work from inside the editor too
  - Add helper `isMonacoFocused()`: `document.activeElement?.closest('.monaco-editor') !== null`
- **Checklist**: `checklists/2.1-problem.md`

---

### Task 2.2 — DuelRoom.tsx editor shortcuts
- **File**: `frontend/src/pages/DuelRoom.tsx`
- **Action**: Edit existing file
- **Details**:
  - Same as Task 2.1 but `Ctrl+Enter` → `handleTestCode()`
  - Monaco `editor.addAction()` for `Ctrl+Enter`
- **Checklist**: `checklists/2.2-duel.md`

---

### Task 2.3 — DiscussionPage.tsx forum shortcuts
- **File**: `frontend/src/pages/DiscussionPage.tsx`
- **Action**: Edit existing file
- **Details**:
  - Add state: `selectedPostIndex: number` (default -1 = none selected)
  - Register shortcuts:
    - `J` → `setSelectedPostIndex(i => Math.min(i + 1, posts.length - 1))`
    - `K` → `setSelectedPostIndex(i => Math.max(i - 1, 0))`
    - `Enter` → `navigate('/discussion/' + posts[selectedPostIndex].id)` if index >= 0
    - `N` → open new post form
    - `1`-`7` → select category by index
  - When `selectedPostIndex` changes, scroll the post into view via `ref.scrollIntoView()`
  - Add visual selection: `ring-2 ring-[var(--brand-primary)]` on the selected post card
- **Checklist**: `checklists/2.3-forum.md`

---

### Task 2.4 — DiscussionDetailPage.tsx shortcuts
- **File**: `frontend/src/pages/DiscussionDetailPage.tsx`
- **Action**: Edit existing file
- **Details**:
  - `Backspace` → `navigate('/discussion')` (when not in input)
  - `U` → upvote post
  - `Shift+U` → downvote post
  - `R` → focus reply textarea
  - `Ctrl+Enter` → submit reply (when textarea is focused)
- **Checklist**: `checklists/2.4-forum-detail.md`

---

## Phase 3 — Leaderboard + Interview + Polish

### Task 3.1 — Leaderboard.tsx shortcuts
- **File**: `frontend/src/pages/Leaderboard.tsx`
- **Action**: Edit existing file
- **Details**:
  - Add `selectedRowIndex` state
  - `J`/`K` → navigate rows
  - `Enter` → view profile (if applicable)
  - `1`/`2`/`3` → switch tabs (global/language/weekly)
  - `M` → scroll to current user's rank
- **Checklist**: `checklists/3.1-leaderboard.md`

---

### Task 3.2 — AIInterviewPage.tsx shortcuts
- **File**: `frontend/src/pages/AIInterviewPage.tsx`
- **Action**: Edit existing file
- **Details**:
  - `Ctrl+Enter` → send message
  - `Ctrl+M` → toggle voice recorder
  - `Ctrl+Shift+M` → toggle TTS auto-play
  - `Escape` → stop recording
- **Checklist**: `checklists/3.2-interview.md`

---

### Task 3.3 — Navbar shortcut hints
- **File**: `frontend/src/components/Navbar.tsx`
- **Action**: Edit existing file
- **Details**:
  - Import `ShortcutBadge`
  - Add `<ShortcutBadge combo="Alt+P" />` next to "Problems" link, etc.
  - Only show badges on desktop (hide on mobile with `hidden sm:inline`)
- **Checklist**: `checklists/3.3-navbar-hints.md`

---

### Task 3.4 — Final integration testing
- **Action**: Manual testing
- **Details**:
  - Test all shortcuts on Chrome, Firefox, Safari
  - Test with anticheat active (Problem.tsx, DuelRoom.tsx) — verify no conflict
  - Test Command Palette with all command categories
  - Test `?` help modal shows all registered shortcuts
  - Test Escape closes modals in correct stacking order
  - Test single-key shortcuts are suppressed in all input elements
  - Test modifier shortcuts fire from inside inputs
  - Test focus returns to previous element after closing Command Palette
  - Verify no console errors or memory leaks (shortcuts properly unregistered)
