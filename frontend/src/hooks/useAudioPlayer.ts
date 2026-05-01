import { useState, useRef, useEffect, useCallback } from 'react';
import { interviewsService } from '../services/interviewsService';
import { VoiceSettings } from './useVoiceSettings';

export type AudioPlayerState = 'idle' | 'loading' | 'playing' | 'paused';

interface UseAudioPlayerProps {
  sessionId: string;
  settings: VoiceSettings;
}

export function useAudioPlayer({ sessionId, settings }: UseAudioPlayerProps) {
  const [state, setState] = useState<AudioPlayerState>('idle');
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stop();
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setState('idle');
    setCurrentMessageIndex(null);
  }, []);

  // Set up audio element listeners
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    
    const handleEnded = () => {
      setState('idle');
      setCurrentMessageIndex(null);
    };

    const handlePause = () => {
      // Only set to paused if it didn't just end
      if (audio.currentTime > 0 && !audio.ended) {
        setState('paused');
      }
    };

    const handlePlay = () => setState('playing');

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, []);

  const getVoicesForLanguage = (langCode: string) => {
    if (!synthRef.current) return [];
    const voices = synthRef.current.getVoices();
    // Try exact match like fr-FR, then primary tag like fr
    const primary = langCode.split('-')[0];
    return voices.filter(v => v.lang.startsWith(langCode) || v.lang.startsWith(primary));
  };

  const playBrowserTTS = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel(); // Stop any current speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    utterance.lang = settings.languageCode;
    
    const voices = getVoicesForLanguage(settings.languageCode);
    const googleVoice = voices.find(v => v.name.includes('Google'));
    const premiumVoice = voices.find(v => v.name.includes('Premium') || v.name.includes('Enhanced'));
    
    // Prefer Google/Premium voices, otherwise take the first matching one
    if (googleVoice) utterance.voice = googleVoice;
    else if (premiumVoice) utterance.voice = premiumVoice;
    else if (voices.length > 0) utterance.voice = voices[0];

    utterance.onstart = () => setState('playing');
    utterance.onend = () => {
      setState('idle');
      setCurrentMessageIndex(null);
    };
    utterance.onerror = (e) => {
       console.error("SpeechSynthesis error:", e);
       setState('idle');
       setCurrentMessageIndex(null);
    };

    synthRef.current.speak(utterance);
  };

  const play = async (index: number, text: string, audioUrl?: string) => {
    // If it's the same message and we are paused, just resume
    if (currentMessageIndex === index) {
      resume();
      return;
    }

    stop(); // stop previous playback
    setCurrentMessageIndex(index);
    setState('loading');

    try {
      if (settings.ttsMode === 'server') {
          // If server mode, and we don't have a cached audioUrl, we would normally fetch it
          // Wait, the API contract is GET /interviews/:id/messages/:index/audio
          // We can just set the src to that endpoint. Actually wait, how do we get the audio?
          // If we already have audioUrl from the server response, we use it directly.
          if (audioUrl) {
              if (audioRef.current) {
                  audioRef.current.src = audioUrl;
                  await audioRef.current.play();
              }
          } else {
              // We need to fetch it from the backend API if we don't have it URL yet
              // This requires an API endpoint. The backend VoiceController has GET /voice/voices, but not GET /messages/:index/audio natively
              // Wait, in plan.md I said GET /api/interviews/:id/messages/:messageId/audio
              // Let's check the interviews service contract.
              // Actually, wait, standard sendMessage doesn't generate TTS unless voice mode is used.
              // If we don't have audioUrl, and we want server TTS, we should call /voice/tts and pass the text.
              
              const res = await interviewsService.getTtsAudio(text, settings.languageCode);
              if (res?.audioUrl && audioRef.current) {
                  audioRef.current.src = res.audioUrl;
                  await audioRef.current.play();
              } else {
                 throw new Error("No audio returned from server");
              }
          }
      } else {
        // Browser Mode
        playBrowserTTS(text);
      }
    } catch (err) {
      console.error('Audio playback failed:', err);
      // Fallback to browser TTS if server fails
      if (settings.ttsMode === 'server') {
          console.log("Falling back to Browser TTS");
          playBrowserTTS(text);
      } else {
          setState('idle');
          setCurrentMessageIndex(null);
      }
    }
  };

  const pause = () => {
    if (state !== 'playing') return;
    
    if (settings.ttsMode === 'browser' && synthRef.current) {
      synthRef.current.pause();
      setState('paused');
    } else if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      // event listener takes care of state
    }
  };

  const resume = () => {
    if (state !== 'paused') return;
    
    if (settings.ttsMode === 'browser' && synthRef.current) {
      synthRef.current.resume();
      setState('playing');
    } else if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      // event listener takes care of state
    }
  };

  return {
    state,
    play,
    pause,
    resume,
    stop,
    currentMessageIndex
  };
}
