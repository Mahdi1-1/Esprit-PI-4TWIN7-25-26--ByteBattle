import { useState, useRef, useEffect, useCallback } from 'react';
import { interviewsService } from '../services/interviewsService';
import { VoiceSettings } from './useVoiceSettings';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'preview';

interface UseVoiceRecorderProps {
  sessionId: string;
  settings: VoiceSettings;
  onMessageSent: (message: { transcript: string; audioUrl?: string; originalBlobUrl?: string }) => void;
}

export function useVoiceRecorder({ sessionId, settings, onMessageSent }: UseVoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timeout>();

  // Browser STT
  const recognitionRef = useRef<any>(null);

  // Check browser support
  const isSupported = typeof window !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  useEffect(() => {
    // Initialize SpeechRecognition if using browser mode
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
      }
    }

    return () => {
      stopAllTracks();
    };
  }, []);

  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore errors if already stopped
      }
    }
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    // Normalize to 0-1 range (max is roughly 255 but usually much lower)
    const level = Math.min(1, average / 128);
    
    setAudioLevel(level);
    
    if (state === 'recording') {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [state]);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript(null);
      setElapsedTime(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analysis setup
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // MediaRecorder setup
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        handleRecordingStop();
      };

      // Browser STT setup
      if (settings.sttMode === 'browser' && recognitionRef.current) {
        recognitionRef.current.lang = settings.languageCode;
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };
        recognitionRef.current.start();
      }

      mediaRecorder.start(100); // collect 100ms chunks
      setState('recording');
      updateAudioLevel();

      // Timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          if (prev >= 119) {
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error('Recording error:', err);
      if (err.name === 'NotAllowedError') {
        setError("L'accès au microphone a été refusé. Veuillez l'autoriser dans les paramètres de votre navigateur.");
      } else {
        setError("Erreur lors de l'accès au microphone.");
      }
      setState('idle');
      stopAllTracks();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current && settings.sttMode === 'browser') {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      stopAllTracks();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      // Don't process the audio
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    stopAllTracks();
    setState('idle');
    setTranscript(null);
    setAudioLevel(0);
    setElapsedTime(0);
  };

  const handleRecordingStop = async () => {
    setState('processing');
    
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    try {
      let finalTranscript = transcript || '';
      let replyAudioUrl: string | undefined = undefined;

      if (settings.sttMode === 'server') {
        // Server mode: always use server STT
        try {
          const res = await interviewsService.sendVoiceMessage(sessionId, audioBlob, settings.languageCode);
          finalTranscript = res.userMessage?.transcript || '';
          replyAudioUrl = res.audioUrl;
        } catch (sttErr: any) {
          console.warn('Server STT failed:', sttErr);
          setError("Le service de transcription vocale n'est pas disponible. Tapez votre message à la place.");
          setState('idle');
          return;
        }
      }
      // In browser mode, we use the transcript from SpeechRecognition — no server fallback

      if (!finalTranscript.trim()) {
        setError("Aucun texte détecté. Parlez clairement près du micro, ou tapez votre message.");
        setState('idle');
        return;
      }

      setTranscript(finalTranscript);

      const originalBlobUrl = URL.createObjectURL(audioBlob);

      if (settings.previewMode) {
        // Store blob URL so we can send it later if they don't re-record
        (window as any).__lastAudioBlobUrl = originalBlobUrl; 
        setState('preview');
      } else {
        // Send immediately
        onMessageSent({ transcript: finalTranscript, audioUrl: replyAudioUrl, originalBlobUrl });
        setState('idle');
        setTranscript(null);
      }

    } catch (err) {
      console.error('Transcription error:', err);
      setError("Erreur lors de l'envoi du message vocal.");
      setState('idle');
    }
  };

  const sendTranscript = () => {
    if (transcript?.trim()) {
      onMessageSent({ 
        transcript, 
        originalBlobUrl: (window as any).__lastAudioBlobUrl 
      });
      setState('idle');
      setTranscript(null);
      (window as any).__lastAudioBlobUrl = null;
    }
  };

  const reRecord = () => {
    setState('idle');
    setTranscript(null);
    startRecording();
  };

  return {
    state,
    startRecording,
    stopRecording,
    cancelRecording,
    transcript,
    setTranscript,
    sendTranscript,
    reRecord,
    elapsedTime,
    audioLevel,
    error,
    isSupported
  };
}
