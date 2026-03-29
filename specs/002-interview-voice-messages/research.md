# Research: Interview AI Voice Messages

## Decision 1: STT Strategy — Client-Side vs Server-Side

**Decision**: Hybrid — Use **Web Speech API** (browser `SpeechRecognition`) as primary, with **Google Cloud STT** (existing backend `VoiceService`) as fallback.

**Rationale**:
- Web Speech API is free, has zero latency for short utterances, and works offline in Chrome.
- The backend `VoiceService.speechToText()` with Google Cloud Speech is already implemented and tested — it provides superior accuracy and supports both `fr-FR` and `en-US`.
- Safari's `SpeechRecognition` support is limited; the server fallback ensures coverage.

**Alternatives considered**:
- **OpenAI Whisper**: High quality but paid, requires API setup — rejected for cost.
- **Web Speech API only**: Free but unsupported on some browsers (Firefox partial, Safari limited).
- **Server-only (Google Cloud)**: Already implemented but costs money per API call.

## Decision 2: TTS Strategy — Client-Side vs Server-Side

**Decision**: Use **Web Speech API** (`SpeechSynthesis`) as primary, with **Google Cloud TTS** (existing backend `VoiceService.textToSpeech()`) as fallback.

**Rationale**:
- `SpeechSynthesis` is free, instant, and available in all modern browsers.
- Google Cloud TTS (Neural2 voices) produces better quality for long responses — useful as optional upgrade.
- The backend TTS endpoint (`GET /:id/messages/:index/audio`) already works.

**Alternatives considered**:
- **edge-tts**: Free Microsoft voices, good quality, but requires a Node.js dependency.
- **Google Cloud TTS only**: Already implemented but costs ~$4/1M chars.

## Decision 3: Audio Recording Format

**Decision**: WebM (Opus) via `MediaRecorder` with `mimeType: 'audio/webm'`.

**Rationale**: Native browser format, excellent compression (~1MB for 2 min), and directly supported by Google Cloud STT with `WEBM_OPUS` encoding (already configured in `VoiceService`).

## Decision 4: Audio File Lifecycle

**Decision**: No persistent storage. For client-side STT, audio never leaves the browser. For server fallback, files are processed in-memory (`memoryStorage()` in multer) and discarded.

**Rationale**: Existing controller already uses `memoryStorage()`. The `VoiceService.cleanupOldAudioFiles()` handles TTS output cleanup.

## Decision 5: Preview Mode

**Decision**: Implement as an optional UI toggle (default: OFF). When ON, after transcription, show editable text before sending.

**Rationale**: Most users prefer instant send for conversational flow. Power users who want accuracy can enable preview mode.
