# API Contracts: Interview AI Voice Messages

## Existing Endpoints (Already Implemented — No Changes Needed)

### `POST /interviews/:id/voice`
Send a voice message. Receives audio, transcribes, sends to AI, generates TTS response.

**Request**: `multipart/form-data`

| Field        | Type   | Required | Description                           |
|--------------|--------|----------|---------------------------------------|
| audio        | File   | ✅       | Audio file (WebM/Opus, MP3, WAV, OGG) |
| languageCode | string | ❌       | STT language (`fr-FR` default)        |

**Response**: `200 OK`
```json
{
  "userMessage": {
    "role": "user",
    "content": "transcribed text...",
    "timestamp": "2026-03-25T00:00:00.000Z",
    "isVoice": true,
    "transcript": "transcribed text...",
    "confidence": 0.95
  },
  "aiMessage": {
    "role": "ai",
    "content": "AI response text...",
    "timestamp": "2026-03-25T00:00:01.000Z",
    "audioUrl": "/uploads/audio/tts-uuid.mp3",
    "isVoice": true
  },
  "tokensUsed": 5
}
```

**Error Responses**:
- `400`: Invalid audio format or missing file
- `403`: No tokens remaining / session not active
- `404`: Session not found

---

### `GET /interviews/:id/messages/:index/audio`
Get or generate TTS audio for a specific message.

**Response**: `200 OK`
```json
{
  "audioUrl": "/uploads/audio/tts-uuid.mp3"
}
```

**Behavior**: If audio is already cached, returns existing URL. Otherwise generates TTS and caches the result.

---

## New Frontend Contracts (Client-Side Hooks)

### `useVoiceRecorder` Hook

```typescript
interface UseVoiceRecorderReturn {
  state: 'idle' | 'recording' | 'processing' | 'preview';
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  transcript: string | null;
  setTranscript: (text: string) => void;
  sendTranscript: () => void;
  reRecord: () => void;
  elapsedTime: number;        // seconds
  audioLevel: number;         // 0-1 normalized
  error: string | null;
  isSupported: boolean;       // MediaRecorder supported?
}
```

### `useAudioPlayer` Hook

```typescript
interface UseAudioPlayerReturn {
  state: 'idle' | 'loading' | 'playing' | 'paused';
  play: (messageIndex: number, text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  currentMessageIndex: number | null;
}
```

### `useVoiceSettings` Hook

```typescript
interface VoiceSettings {
  autoPlay: boolean;
  previewMode: boolean;
  sttMode: 'browser' | 'server';
  ttsMode: 'browser' | 'server';
  languageCode: string;
}

interface UseVoiceSettingsReturn {
  settings: VoiceSettings;
  updateSettings: (patch: Partial<VoiceSettings>) => void;
}
```
