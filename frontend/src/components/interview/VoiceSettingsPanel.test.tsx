import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VoiceSettingsPanel } from './VoiceSettingsPanel';

vi.mock('../../services/interviewsService', () => ({
  interviewsService: {},
}));

const baseSettings = {
  autoPlay: false,
  previewMode: false,
  languageCode: 'en-US',
  sttMode: 'browser' as const,
  ttsMode: 'browser' as const,
};

describe('VoiceSettingsPanel', () => {
  it('opens and closes panel', () => {
    const updateSettings = vi.fn();

    render(<VoiceSettingsPanel settings={baseSettings} updateSettings={updateSettings} />);

    expect(screen.queryByText('Voice settings')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Voice settings'));
    expect(screen.getByText('Voice settings')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Voice settings')).not.toBeInTheDocument();
  });

  it('updates toggles and select values', () => {
    const updateSettings = vi.fn();

    render(<VoiceSettingsPanel settings={baseSettings} updateSettings={updateSettings} />);

    fireEvent.click(screen.getByTitle('Voice settings'));

    fireEvent.click(screen.getByText('Auto-play AI replies'));
    expect(updateSettings).toHaveBeenCalledWith({ autoPlay: true });

    fireEvent.click(screen.getByText('Preview before sending'));
    expect(updateSettings).toHaveBeenCalledWith({ previewMode: true });

    const languageSelect = screen.getByDisplayValue('English (US)');
    fireEvent.change(languageSelect, { target: { value: 'fr-FR' } });
    expect(updateSettings).toHaveBeenCalledWith({ languageCode: 'fr-FR' });
  });
});
