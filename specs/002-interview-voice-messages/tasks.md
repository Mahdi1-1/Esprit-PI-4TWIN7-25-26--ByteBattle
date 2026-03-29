# Tasks: Interview AI Voice Messages

**Input**: Design documents from `/specs/002-interview-voice-messages/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story — US1 (STT), US2 (TTS), US3 (Coexistence), US4 (Preview)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and shared voice settings hook

- [ ] T001 Create directory `frontend/src/components/interview/`
- [ ] T002 [P] Create `useVoiceSettings` hook in `frontend/src/hooks/useVoiceSettings.ts` — manages `localStorage` preferences (autoPlay, previewMode, sttMode, ttsMode, languageCode)
- [ ] T003 [P] Add `GET /voice/status` endpoint in `backend/src/voice/voice.controller.ts` — returns `{ sttAvailable, ttsAvailable }` based on Google Cloud credentials presence
- [ ] T004 [P] Add `isAvailable()` method to `backend/src/voice/voice.service.ts` — returns boolean based on client initialization

**Checkpoint**: Directory structure and settings infrastructure ready

---

## Phase 2: User Story 1 — Envoyer un message vocal (STT) (Priority: P1) 🎯 MVP

**Goal**: User can click mic, record audio with wave animation + timer, get transcription in chat, AI responds

**Independent Test**: Start an interview, click mic, speak, stop — transcribed text appears as user message, AI responds

### Implementation for User Story 1

- [ ] T005 [US1] Create `WaveformVisualizer` component in `frontend/src/components/interview/WaveformVisualizer.tsx` — canvas-based real-time audio waveform driven by `audioLevel` (0–1), uses `requestAnimationFrame`
- [ ] T006 [US1] Create `useVoiceRecorder` hook in `frontend/src/hooks/useVoiceRecorder.ts` — full recording lifecycle: MediaRecorder setup, Web Audio API AnalyserNode for audio levels, 120s auto-stop timer, browser STT via `SpeechRecognition`, server STT fallback via `interviewsService.sendVoiceMessage()`, state machine (idle→recording→processing→preview→idle), error handling (mic denied, unsupported browser, empty transcript, network error)
- [ ] T007 [US1] Create `VoiceRecorder` component in `frontend/src/components/interview/VoiceRecorder.tsx` — renders Idle (mic button), Recording (WaveformVisualizer + timer + stop), Processing (spinner "Transcription en cours..."), stateful UI using `useVoiceRecorder` hook
- [ ] T008 [US1] Integrate `VoiceRecorder` into `AIInterviewPage.tsx` — remove inline `startRecording`/`stopRecording` (lines 140–216), remove `mediaRecorderRef`/`audioChunksRef` (lines 37–39), import `useVoiceRecorder` and `useVoiceSettings`, replace inline mic button in input area with `<VoiceRecorder />`
- [ ] T009 [US1] Add voice badge to `ChatMessage` component in `frontend/src/pages/AIInterviewPage.tsx` — show 🎤 icon for user messages where `isVoice: true`, show confidence indicator

**Checkpoint**: User can record voice, see waveform, get transcription in chat, AI responds. MVP complete.

---

## Phase 3: User Story 2 — Écouter les réponses IA (TTS) (Priority: P1)

**Goal**: Play/pause button on each AI message, reads text aloud via browser SpeechSynthesis or server TTS

**Independent Test**: Send a text message, click ▶ on AI response — hear the text read aloud, click ⏸ to pause

### Implementation for User Story 2

- [ ] T010 [US2] Create `useAudioPlayer` hook in `frontend/src/hooks/useAudioPlayer.ts` — browser TTS via `SpeechSynthesis.speak()` with voice selection, server TTS fallback via `GET /interviews/:id/messages/:index/audio`, state machine (idle→loading→playing→paused), auto-play support when `settings.autoPlay` is enabled
- [ ] T011 [US2] Create `AudioPlayButton` component in `frontend/src/components/interview/AudioPlayButton.tsx` — inline ▶/⏸ toggle with loading spinner, subtle animation during playback
- [ ] T012 [US2] Integrate `AudioPlayButton` into `ChatMessage` component in `frontend/src/pages/AIInterviewPage.tsx` — replace raw `<audio>` element for AI messages with `<AudioPlayButton />`, pass `useAudioPlayer` controls
- [ ] T013 [US2] Wire auto-play logic into `AIInterviewPage.tsx` — after AI response is received, if `settings.autoPlay` is true, call `player.play()` automatically

**Checkpoint**: Each AI message has ▶/⏸ button. Auto-play works when enabled.

---

## Phase 4: User Story 3 — Coexistence messages vocaux et texte (Priority: P2)

**Goal**: Voice and text messages coexist visually in the same thread, each clearly distinguishable

**Independent Test**: Send alternating text and voice messages — each type visually distinct in the timeline

### Implementation for User Story 3

- [ ] T014 [US3] Enhance `ChatMessage` in `frontend/src/pages/AIInterviewPage.tsx` — add mini audio player for voice user messages (re-listen original recording), differentiate styling between voice/text messages
- [ ] T015 [US3] Update message mapping in `handleSendMessage` and voice flow in `AIInterviewPage.tsx` — ensure `isVoice` and `audioUrl` are preserved in session state for both user and AI messages

**Checkpoint**: Voice and text messages are clearly distinguishable in the same conversation thread.

---

## Phase 5: User Story 4 — Prévisualisation et correction (Priority: P3)

**Goal**: After transcription, show editable preview with "Envoyer" / "Réenregistrer" before sending

**Independent Test**: Enable preview mode, record a message, edit the text, click "Envoyer" — edited text is sent

### Implementation for User Story 4

- [ ] T016 [US4] Add preview state rendering to `VoiceRecorder` component in `frontend/src/components/interview/VoiceRecorder.tsx` — editable textarea with transcribed text, "Envoyer" button, "Réenregistrer" button, only active when `settings.previewMode` is true
- [ ] T017 [US4] Wire preview callbacks in `useVoiceRecorder` hook in `frontend/src/hooks/useVoiceRecorder.ts` — `sendTranscript()` sends edited text, `reRecord()` resets and restarts recording, `setTranscript()` updates editable text

**Checkpoint**: Preview mode fully functional. Users can edit transcription before sending.

---

## Phase 6: User Story 5 — Voice Settings Panel (Priority: P2)

**Goal**: Settings dropdown to configure auto-play, preview mode, STT/TTS mode, and language

**Independent Test**: Open settings, toggle auto-play, switch STT to server — verify settings persist across page reload

### Implementation for User Story 5

- [ ] T018 [P] [US5] Create `VoiceSettingsPanel` component in `frontend/src/components/interview/VoiceSettingsPanel.tsx` — dropdown/popover with toggles for autoPlay, previewMode, dropdowns for sttMode, ttsMode, languageCode
- [ ] T019 [US5] Add settings gear icon to interview header in `frontend/src/pages/AIInterviewPage.tsx` — renders `<VoiceSettingsPanel />` when clicked, passes `useVoiceSettings` hook

**Checkpoint**: All voice settings are configurable and persisted in localStorage.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, documentation, and cleanup

- [ ] T020 [P] Add comprehensive error states to `VoiceRecorder` in `frontend/src/components/interview/VoiceRecorder.tsx` — mic denied message, unsupported browser fallback (hide mic button + tooltip), empty transcription warning, network error with retry
- [ ] T021 [P] Add `getLanguages` and voice service functions to `frontend/src/services/interviewsService.ts` — add `getVoiceStatus()` calling `GET /voice/status`
- [ ] T022 [P] Update feature documentation in `docs/features/interview-voice.md`
- [ ] T023 Run manual browser verification per plan.md verification steps (8 scenarios in Chrome + Firefox)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1 STT)**: Depends on T002 (useVoiceSettings)
- **Phase 3 (US2 TTS)**: Depends on T002 (useVoiceSettings). Can run in parallel with Phase 2.
- **Phase 4 (US3 Coexistence)**: Depends on Phase 2 + Phase 3 (both message types must exist)
- **Phase 5 (US4 Preview)**: Depends on Phase 2 (T006/T007 — recorder infrastructure)
- **Phase 6 (US5 Settings)**: Depends on T002. Can run in parallel with Phases 2–5.
- **Phase 7 (Polish)**: Depends on all user stories

### User Story Dependencies

```
T002 (useVoiceSettings) ─┬─► US1 (Phase 2) ─┐
                         ├─► US2 (Phase 3) ──┼─► US3 (Phase 4) ─► Polish
                         ├─► US4 (Phase 5) ──┘
                         └─► US5 (Phase 6) ──────────────────────►
```

### Parallel Opportunities

Within Phase 1:
```
T002 (useVoiceSettings) ║ T003 (voice/status endpoint) ║ T004 (isAvailable)
```

Between phases (after Phase 1):
```
Phase 2 (US1) ║ Phase 3 (US2) ║ Phase 6 (US5)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: User Story 1 — STT (T005–T009)
3. **STOP and VALIDATE**: Record voice → see transcription → AI responds
4. This alone delivers significant value

### Incremental Delivery

1. Phase 1 Setup → Foundation ready
2. Phase 2 US1 STT → **MVP!** Voice input works
3. Phase 3 US2 TTS → Bidirectional voice complete
4. Phase 4 US3 Coexistence → Visual polish
5. Phase 5 US4 Preview → Power user feature
6. Phase 6 US5 Settings → Configuration panel
7. Phase 7 Polish → Production-ready

---

## Notes

- Backend is ~95% complete — all tasks are frontend-focused
- [P] tasks = different files, no dependencies
- Commit after each phase for clean git history
- Test in Chrome first (best Web Speech API support), then Firefox
- The existing inline recording code in AIInterviewPage.tsx (lines 36–216) will be replaced by modular hooks + components
