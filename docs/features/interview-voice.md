# Interview AI Voice Messages

## Overview

The ByteBattle2 platform now supports fully bidirectional voice capabilities within the **Interview AI** module. This functionality allows users to practice verbal communication skills effectively by speaking directly to the AI and optionally listening to generated audio responses.

## Architecture & Systems

The system uses a hybrid model of local browser APIs and server-supported APIs.

### Speech-to-Text (STT) User Input
- **Microphone Integration:** The `VoiceRecorder` component handles local media streams via the `MediaRecorder` API. 
- **Audio Visualization:** Real-time volume levels are animated smoothly through a `WaveformVisualizer` built with the `Web Audio API` (`AnalyserNode`) and `<canvas>`.
- **Hybrid Engines:**
  - `Browser Mode`: Utilizes `window.SpeechRecognition` for instantaneous, local transcription.
  - `Server Mode`: Streams the recorded blob to the backend via `interviewsService.sendVoiceMessage` for higher accuracy processing (e.g. Google Cloud).
- **Preview Mode**: Users can configure the interface to pause after recording, allowing them to review and edit the transcribed text before committing it.

### Text-to-Speech (TTS) AI Output
- **Auto-Play:** `AudioPlayButton` is seamlessly integrated into AI `ChatMessage` bubbles. Users can playback the audio immediately or have it auto-play upon message receipt.
- **Hybrid Engines:**
  - `Browser Mode`: Uses `window.speechSynthesis` API for zero-latency, local device voices.
  - `Server Mode`: Requests generated premium MP3 streams via the `api.post('/voice/tts')` endpoint.

### Settings UI
Users control their preferred setup via the `VoiceSettingsPanel`. Settings are persisted automatically to `localStorage` via the `useVoiceSettings` hook.
- Preferences: `autoPlay`, `previewMode`, `sttMode` (browser/server), `ttsMode` (browser/server), `languageCode` (e.g. `fr-FR`).

## API Endpoints

### 1. `GET /voice/status`
Checks if the backend voice services (e.g. Google Cloud APIs) are correctly initialized and available.

### 2. `POST /interviews/:id/voice`
Handles incoming audio blobs for server-STT processing and returns the transcribed text along with the AI's contextual response.
- Requires `multipart/form-data` containing the `audio` blob.
- Accepts an optional `?languageCode=xx-XX` query parameter.

### 3. `POST /voice/tts`
Generates text-to-speech audio streams. (Fallback for when the pre-fetched Audio URL isn't sufficient).
- Requires a JSON body `{ "text": "...", "languageCode": "fr-FR" }`.

## File Structure & Hooks
- `frontend/src/components/interview/VoiceRecorder.tsx` - Main input interface.
- `frontend/src/components/interview/AudioPlayButton.tsx` - Playback control per message.
- `frontend/src/components/interview/WaveformVisualizer.tsx` - Audio visualization.
- `frontend/src/components/interview/VoiceSettingsPanel.tsx` - Configurations dropdown.
- `frontend/src/hooks/useVoiceRecorder.ts` - STT and recording states.
- `frontend/src/hooks/useAudioPlayer.ts` - TTS playback and status.
- `frontend/src/hooks/useVoiceSettings.ts` - Preferences persistence.

## Graceful Degradation
If microphone hardware is missing or the browser blocks `getUserMedia` capabilities, the interface gracefully falls back to text-only mode and disables recording controls.
