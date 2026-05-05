import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceSettings, VoiceSettings } from './useVoiceSettings';

const KEY='bytebattle_voice_settings';
beforeEach(()=>{localStorage.clear();});

describe('useVoiceSettings()', () => {
  it('should return defaults when nothing stored', () => {
    const {result}=renderHook(()=>useVoiceSettings());
    expect(result.current.settings.autoPlay).toBe(false); expect(result.current.settings.languageCode).toBe('fr-FR');
  });
  it('should load stored settings', () => {
    localStorage.setItem(KEY,JSON.stringify({autoPlay:true,languageCode:'en-US'}));
    const {result}=renderHook(()=>useVoiceSettings());
    expect(result.current.settings.autoPlay).toBe(true); expect(result.current.settings.languageCode).toBe('en-US');
  });
  it('should persist on update', () => {
    const {result}=renderHook(()=>useVoiceSettings());
    act(()=>{result.current.updateSettings({autoPlay:true});});
    expect(JSON.parse(localStorage.getItem(KEY)!).autoPlay).toBe(true);
  });
  it('should merge partial updates', () => {
    const {result}=renderHook(()=>useVoiceSettings());
    act(()=>{result.current.updateSettings({ttsMode:'server'});}); 
    expect(result.current.settings.ttsMode).toBe('server'); expect(result.current.settings.autoPlay).toBe(false);
  });
  it('should fall back to defaults on malformed localStorage', () => {
    localStorage.setItem(KEY,'not-json-{{{');
    const {result}=renderHook(()=>useVoiceSettings()); expect(result.current.settings.languageCode).toBe('fr-FR');
  });
});
