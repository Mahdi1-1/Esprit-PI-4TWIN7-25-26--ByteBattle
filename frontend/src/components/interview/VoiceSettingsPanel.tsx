import React, { useState, useRef, useEffect } from 'react';
import { Settings, Volume2, Mic2, Edit3, Globe } from 'lucide-react';
import { VoiceSettings } from '../../hooks/useVoiceSettings';
import { interviewsService } from '../../services/interviewsService';

interface VoiceSettingsPanelProps {
  settings: VoiceSettings;
  updateSettings: (patch: Partial<VoiceSettings>) => void;
}

export function VoiceSettingsPanel({ settings, updateSettings }: VoiceSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // For languages, we use standard codes
  const languages = [
    { code: 'fr-FR', label: 'Français' },
    { code: 'en-US', label: 'English (US)' },
    { code: 'es-ES', label: 'Español' },
  ];

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-md transition-colors ${
          isOpen ? 'bg-[var(--surface-3)] text-[var(--brand-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
        }`}
        title="Paramètres vocaux"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-xl z-50 overflow-hidden animate-slide-in">
          <div className="px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-2)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-[var(--brand-primary)]" />
              Paramètres vocaux
            </h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  <Volume2 className="w-4 h-4" />
                  Auto-play réponses IA
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${settings.autoPlay ? 'bg-[var(--state-success)]' : 'bg-[var(--surface-4)]'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.autoPlay ? 'left-4.5 shadow-sm' : 'left-0.5'}`} />
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={settings.autoPlay}
                    onChange={(e) => updateSettings({ autoPlay: e.target.checked })}
                  />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  <Edit3 className="w-4 h-4" />
                  Prévisualiser avant envoi
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${settings.previewMode ? 'bg-[var(--brand-primary)]' : 'bg-[var(--surface-4)]'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.previewMode ? 'left-4.5 shadow-sm' : 'left-0.5'}`} />
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={settings.previewMode}
                    onChange={(e) => updateSettings({ previewMode: e.target.checked })}
                  />
                </div>
              </label>
            </div>

            <div className="h-px bg-[var(--border-default)] w-full" />

            {/* Selects */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Langue
                </label>
                <select
                  value={settings.languageCode}
                  onChange={(e) => updateSettings({ languageCode: e.target.value })}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-muted)]">Moteur STT (Micro)</label>
                  <select
                    value={settings.sttMode}
                    onChange={(e) => updateSettings({ sttMode: e.target.value as 'browser' | 'server' })}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="browser">Navigateur (Rapide)</option>
                    <option value="server">Cloud (Précis)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-muted)]">Moteur TTS (Voix)</label>
                  <select
                    value={settings.ttsMode}
                    onChange={(e) => updateSettings({ ttsMode: e.target.value as 'browser' | 'server' })}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="browser">Navigateur (Local)</option>
                    <option value="server">Cloud (Premium)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
