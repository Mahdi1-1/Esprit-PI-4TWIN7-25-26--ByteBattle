# Data Model: Interview AI Voice Messages

## Existing Entities (No Schema Changes Needed)

The current `InterviewSession` model stores messages as a JSON array. Each message object is extended with optional voice-related fields:

### InterviewMessage (JSON structure within `messages[]`)

| Field        | Type     | Required | Description                                        |
|--------------|----------|----------|----------------------------------------------------|
| role         | string   | ✅       | `'user'` or `'ai'`                                |
| content      | string   | ✅       | Text content (or transcription for voice messages) |
| timestamp    | string   | ✅       | ISO timestamp                                      |
| code         | string   | ❌       | Code block (if code review)                        |
| language     | string   | ❌       | Programming language                               |
| isVoice      | boolean  | ❌       | `true` if the message originated from voice input  |
| confidence   | number   | ❌       | STT transcription confidence (0–1)                 |
| audioUrl     | string   | ❌       | URL to TTS output (for AI messages)                |

> **Note**: No Prisma schema migration is needed. The `messages` field is already `Json[]`, and these fields are part of the JSON payload.

## New Frontend State Models

### RecordingState (enum)

```
idle → recording → processing → preview → idle
```

| State      | Description                              |
|------------|------------------------------------------|
| idle       | Default. Mic button visible.             |
| recording  | MediaRecorder active. Wave animation on. |
| processing | Audio sent. Waiting for transcription.   |
| preview    | Transcription done. Editable text shown. |

### PlaybackState (per AI message)

```
idle → loading → playing → paused → idle
```

| State   | Description                            |
|---------|----------------------------------------|
| idle    | Play button (▶) visible.               |
| loading | TTS being generated. Spinner shown.    |
| playing | Audio playing. Pause button (⏸) shown. |
| paused  | Audio paused. Play button returns.     |

### VoiceSettings (user preference, localStorage)

| Property      | Type    | Default | Description                                 |
|---------------|---------|---------|---------------------------------------------|
| autoPlay      | boolean | false   | Auto-play AI responses.                     |
| previewMode   | boolean | false   | Show transcription preview before sending.  |
| sttMode       | string  | 'browser' | `'browser'` or `'server'`.               |
| ttsMode       | string  | 'browser' | `'browser'` or `'server'`.               |
| languageCode  | string  | 'fr-FR' | STT/TTS language.                           |
