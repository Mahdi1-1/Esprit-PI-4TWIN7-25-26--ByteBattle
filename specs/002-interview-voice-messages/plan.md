# Implementation Plan: Interview AI Voice Messages

**Feature Branch**: `002-interview-voice-messages`  
**Spec**: [spec.md](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/specs/002-interview-voice-messages/spec.md)  
**Research**: [research.md](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/specs/002-interview-voice-messages/research.md)

## Technical Context

| Area            | Status                                                     |
|-----------------|------------------------------------------------------------|
| Backend STT/TTS | ✅ Already implemented in `VoiceService` (Google Cloud)     |
| Backend Routes  | ✅ Already implemented (`POST /:id/voice`, `GET /:id/messages/:index/audio`) |
| Frontend Record | ⚠️ Basic MediaRecorder exists, but missing: wave animation, timer, 120s auto-stop, preview mode, error handling |
| Frontend TTS    | ⚠️ Basic auto-play exists, but missing: per-message play/pause, Web Speech API client-side TTS, settings toggle |
| Chat Message UI | ⚠️ Basic `<audio>` element exists, but missing: voice badges, play button styling, recording state indicators |

**Key insight**: The backend is feature-complete. This plan focuses **95% on frontend** work.

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modular Architecture    | ✅ | New hooks and components in proper directories |
| II. Naming Conventions     | ✅ | camelCase hooks, PascalCase components |
| V. API-First               | ✅ | All endpoints already documented with Swagger |
| VIII. Game Metrics & Scoring | N/A | Voice feature doesn't affect scoring |

## Architecture Decision: Hybrid STT/TTS

Per the user's specification:

- **Primary**: Web Speech API (browser-native, free, zero-latency)
- **Fallback**: Google Cloud via existing backend endpoints (better quality, but costs money)
- The user toggles between modes via a settings panel stored in `localStorage`

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│                                                      │
│  ┌──────────────┐    ┌──────────────┐               │
│  │ useVoice     │    │ useAudio     │               │
│  │ Recorder     │    │ Player       │               │
│  │              │    │              │               │
│  │ Browser STT ◄┼──┐ │ Browser TTS ◄┼──┐           │
│  │ Server STT  ◄┼──┤ │ Server TTS  ◄┼──┤           │
│  └──────────────┘  │ └──────────────┘  │           │
│                    │                    │           │
│  ┌──────────────┐  │                    │           │
│  │ useVoice     ├──┘                    │           │
│  │ Settings     ├───────────────────────┘           │
│  └──────────────┘                                    │
└──────────────────┬──────────────────────────────────┘
                   │ (server fallback only)
┌──────────────────▼──────────────────────────────────┐
│                    Backend                           │
│  POST /interviews/:id/voice  → VoiceService.stt()   │
│  GET  /interviews/:id/messages/:idx/audio → tts()   │
└─────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### Component 1: Frontend Hooks (`frontend/src/hooks/`)

New, modular custom hooks that encapsulate all voice logic, separated from UI:

---

#### [NEW] [useVoiceRecorder.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/hooks/useVoiceRecorder.ts)

Custom hook handling the full recording lifecycle:

- **MediaRecorder** setup with `audio/webm` mime type
- **Web Audio API** (`AnalyserNode`) for real-time audio level (wave animation data)
- **Timer** with 120-second auto-stop
- **Browser STT** mode: Uses `webkitSpeechRecognition` / `SpeechRecognition` for instant transcription
- **Server STT** mode: Sends the audio `Blob` to `interviewsService.sendVoiceMessage()`
- **Error handling**: mic permission denied, unsupported browser, empty transcription, network errors
- **State machine**: `idle → recording → processing → preview → idle`
- Exposes: `{ state, startRecording, stopRecording, cancelRecording, transcript, setTranscript, sendTranscript, reRecord, elapsedTime, audioLevel, error, isSupported }`

---

#### [NEW] [useAudioPlayer.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/hooks/useAudioPlayer.ts)

Custom hook for playing TTS audio on AI messages:

- **Browser TTS** mode: Uses `SpeechSynthesis.speak()` with natural voice selection
- **Server TTS** mode: Fetches audio URL from `GET /interviews/:id/messages/:index/audio`, plays via `HTMLAudioElement`
- **State machine**: `idle → loading → playing → paused → idle`
- Handles auto-play when `settings.autoPlay` is enabled
- Exposes: `{ state, play, pause, resume, stop, currentMessageIndex }`

---

#### [NEW] [useVoiceSettings.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/hooks/useVoiceSettings.ts)

Persists user preferences in `localStorage`:

- `autoPlay` (boolean, default: false)
- `previewMode` (boolean, default: false)
- `sttMode` ('browser' | 'server', default: 'browser')
- `ttsMode` ('browser' | 'server', default: 'browser')
- `languageCode` (string, default: 'fr-FR')

---

### Component 2: Frontend UI Components (`frontend/src/components/interview/`)

---

#### [NEW] [VoiceRecorder.tsx](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/components/interview/VoiceRecorder.tsx)

Replaces the inline mic button in `AIInterviewPage.tsx`. Renders different states:

- **Idle**: Mic icon button
- **Recording**: Pulsing wave animation (driven by `audioLevel`), elapsed time counter, stop button
- **Processing**: Spinner with "Transcription en cours..."
- **Preview**: Editable text area with "Envoyer" and "Réenregistrer" buttons

---

#### [NEW] [AudioPlayButton.tsx](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/components/interview/AudioPlayButton.tsx)

Small inline button rendered inside each AI `ChatMessage`:

- ▶ (idle) → ⏸ (playing) toggle
- Loading spinner when TTS is being generated
- Subtle animation during playback

---

#### [NEW] [WaveformVisualizer.tsx](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/components/interview/WaveformVisualizer.tsx)

Canvas-based real-time audio waveform visualization:

- Receives `audioLevel` (0–1) from `useVoiceRecorder`
- Renders animated bars or sine wave
- Uses `requestAnimationFrame` for smooth 60fps

---

#### [NEW] [VoiceSettingsPanel.tsx](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/components/interview/VoiceSettingsPanel.tsx)

Small settings dropdown or modal:

- Toggle: Auto-play responses
- Toggle: Preview mode
- Dropdown: STT mode (Browser / Server)
- Dropdown: TTS mode (Browser / Server)
- Dropdown: Language (Français / English)

---

### Component 3: Frontend Page Integration

---

#### [MODIFY] [AIInterviewPage.tsx](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/pages/AIInterviewPage.tsx)

- Remove inline `startRecording` / `stopRecording` functions (lines 140–216)
- Remove inline `mediaRecorderRef` and `audioChunksRef` state (lines 37–39)
- Import and use `useVoiceRecorder`, `useAudioPlayer`, `useVoiceSettings` hooks
- Replace inline mic button with `<VoiceRecorder />` component in input area
- Add voice settings gear icon in interview header
- Pass `autoPlay` setting to handle AI response audio

---

#### [MODIFY] [ChatMessage component](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/frontend/src/pages/AIInterviewPage.tsx#L570-L634) (inside AIInterviewPage.tsx)

- Add voice badge (🎤 icon) to user messages where `isVoice: true`
- Replace raw `<audio>` element with `<AudioPlayButton />` for AI messages
- Show transcription confidence indicator for voice messages

---

### Component 4: Backend (Minimal Changes)

The backend is already feature-complete. Only minor improvements:

---

#### [MODIFY] [voice.service.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/voice/voice.service.ts)

- Add graceful fallback when Google Cloud credentials are missing — return a clear error message instead of throwing `BadRequestException` with generic text
- Add `isAvailable()` method to let the frontend check if server-side voice is operational

---

#### [MODIFY] [voice.controller.ts](file:///home/mahdi-masmoudi/Bureau/ByteBattle2-officiel/backend/src/voice/voice.controller.ts)

- Add `GET /voice/status` endpoint returning `{ sttAvailable: boolean, ttsAvailable: boolean }` — used by frontend to decide whether to show the "Server" option in voice settings

---

## Verification Plan

### Automated Tests

No existing tests found for the interview or voice modules. Given the feature is ~95% frontend, the primary verification is browser-based.

### Manual Verification (Browser Tests)

1. **STT Flow (Browser mode)**
   - Open `http://localhost:3000/interview-ai`
   - Start an interview session (any topic/difficulty)
   - Click the mic button → verify recording animation (wave + timer) starts
   - Speak for ~5 seconds → click stop
   - Verify transcription appears in the chat as a user message with 🎤 badge
   - Verify AI responds normally to the transcribed text

2. **STT Flow (Server mode)**
   - Open Voice Settings → switch STT to "Server"
   - Record a voice message → verify it goes through `POST /interviews/:id/voice`
   - Check backend logs for `🎤 Processing voice message` and `📝 Transcribed` entries

3. **TTS Flow (Browser mode)**
   - Send a text message → wait for AI response
   - Click ▶ on an AI message → verify browser reads the text aloud
   - Click ⏸ → verify audio pauses

4. **TTS Flow (Server mode)**
   - Switch TTS to "Server" in Voice Settings
   - Click ▶ on an AI message → verify loading spinner, then audio plays from server URL

5. **120-second limit**
   - Start recording → wait 2 minutes (or use DevTools to fast-forward timer)
   - Verify recording auto-stops and message is sent

6. **Error handling**
   - Deny mic permission → verify error message displayed
   - Test in a private/incognito window to check unsupported browser fallback

7. **Preview mode**
   - Enable preview in Voice Settings
   - Record a message → verify editable text preview appears
   - Modify text → click "Envoyer" → verify modified text is sent
   - Click "Réenregistrer" → verify new recording starts

8. **Auto-play**  
   - Enable auto-play in Voice Settings
   - Send a message → verify AI response audio plays automatically

> **Note**: These tests should be run in Chrome (best support) and Firefox (to test fallback behavior). Safari testing is optional but recommended.
