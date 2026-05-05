import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';

// Mock scrollIntoView globally before any component imports
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Mocks for heavy integrations and services
vi.mock('../services/interviewsService', () => ({
  interviewsService: {
    getSessions: vi.fn().mockResolvedValue([]),
    start: vi.fn().mockResolvedValue({
      id: 'session-1',
      difficulty: 'easy',
      domain: 'CLOUD_COMPUTING',
      language: 'EN',
      messages: [],
    }),
    sendMessage: vi.fn().mockResolvedValue({ reply: 'AI says hi' }),
    endInterview: vi.fn().mockResolvedValue({
      id: 'session-1',
      feedback: {
        overallScore: 8,
        technicalScore: 7,
        communicationScore: 6,
        problemSolvingScore: 9,
        verdict: 'HIRE',
        competencyScores: [],
        strengths: [],
        improvements: [],
        recommendedResources: [],
        closingMessage: 'Good job',
      },
    }),
  },
}));

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'interview.typePlaceholder': 'Type your message',
        'interview.title': 'Interview',
        'interview.end': 'End Interview',
      };
      return map[k] ?? k;
    },
    language: 'en',
  }),
}));

vi.mock('../hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => ({ currentMessageIndex: -1, state: 'idle', play: vi.fn(), pause: vi.fn(), resume: vi.fn() }),
}));

vi.mock('../hooks/useVoiceSettings', () => ({
  useVoiceSettings: () => ({ settings: { autoPlay: false }, updateSettings: vi.fn() }),
}));

vi.mock('../components/interview/VoiceRecorder', () => ({
  VoiceRecorder: (props: any) => <div data-testid="voice-recorder" />,
}));

vi.mock('../components/interview/VoiceSettingsPanel', () => ({
  VoiceSettingsPanel: () => <div data-testid="voice-settings" />,
}));

vi.mock('../components/Layout', () => ({
  Layout: ({ children }: any) => <div>{children}</div>,
}));

import { AIInterviewPage } from './AIInterviewPage';

describe('AIInterviewPage integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and allows setup flow navigation', async () => {
    render(<AIInterviewPage />);

    // Step 1: Verify domain selection UI appears
    expect(await screen.findByText('Cloud Computing')).toBeInTheDocument();
    expect(screen.getByText('Software Engineering')).toBeInTheDocument();

    // Click a domain
    const cloudBtn = screen.getByText('Cloud Computing');
    fireEvent.click(cloudBtn);

    // Step 2: Verify difficulty selection appears
    expect(await screen.findByText('Easy')).toBeInTheDocument();
    const easyBtn = screen.getByText('Easy');
    fireEvent.click(easyBtn);

    // Step 3: Verify language selection appears
    expect(await screen.findByText('English')).toBeInTheDocument();
    const engBtn = screen.getByText('English');
    fireEvent.click(engBtn);

    // Verify Start Interview button is present
    expect(screen.getByText('Start Interview')).toBeInTheDocument();
  });

  it('calls interviewsService.start when interview is started', async () => {
    const { interviewsService } = await import('../services/interviewsService');

    render(<AIInterviewPage />);

    // Navigate to start screen
    fireEvent.click(await screen.findByText('Cloud Computing'));
    fireEvent.click(await screen.findByText('Easy'));
    fireEvent.click(await screen.findByText('English'));

    // Click start
    fireEvent.click(screen.getByText('Start Interview'));

    // Verify service was called with correct params
    await waitFor(() => {
      expect(interviewsService.start).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'CLOUD_COMPUTING',
          difficulty: 'easy',
          language: 'EN',
        })
      );
    });
  });
});
