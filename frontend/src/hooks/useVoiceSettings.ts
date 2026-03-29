import { useState, useEffect } from 'react';

export interface VoiceSettings {
  autoPlay: boolean;
  previewMode: boolean;
  sttMode: 'browser' | 'server';
  ttsMode: 'browser' | 'server';
  languageCode: string;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  autoPlay: false,
  previewMode: false,
  sttMode: 'browser',
  ttsMode: 'browser',
  languageCode: 'fr-FR',
};

const SETTINGS_KEY = 'bytebattle_voice_settings';

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (err) {
      console.warn('Failed to parse voice settings from localStorage:', err);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (patch: Partial<VoiceSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  return { settings, updateSettings };
}
