import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { useLanguage } from '../context/LanguageContext';
import {
  Bot, Send, Play, StopCircle, RotateCcw, Clock, Star, TrendingUp,
  ChevronRight, ChevronLeft, Code2, MessageSquare, BarChart3, Mic, MicOff,
  Sparkles, Target, Lightbulb, Award, BookOpen, ArrowLeft, Globe,
  CheckCircle2, XCircle, AlertTriangle, ThumbsUp, ThumbsDown, Minus,
} from 'lucide-react';
import {
  interviewDomains,
  difficultyLevels,
  type InterviewDomain,
  type InterviewLanguage,
  type InterviewMessage,
  type InterviewSession,
  type InterviewFeedback,
  type InterviewSummary,
  type CompetencyScore,
  getVerdictStyling,
  getDomainById,
} from '../data/interviewData';
import { interviewsService } from '../services/interviewsService';
import { VoiceRecorder } from '../components/interview/VoiceRecorder';
import { useVoiceSettings } from '../hooks/useVoiceSettings';
import { AudioPlayButton } from '../components/interview/AudioPlayButton';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { VoiceSettingsPanel } from '../components/interview/VoiceSettingsPanel';

type ViewMode = 'setup' | 'interview' | 'review';
type SetupStep = 'domain' | 'difficulty' | 'language';

export function AIInterviewPage() {
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [setupStep, setSetupStep] = useState<SetupStep>('domain');
  const [selectedDomain, setSelectedDomain] = useState<InterviewDomain | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<InterviewLanguage>('FR');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [pastSessionIndex, setPastSessionIndex] = useState(0);

  // Voice Settings configuration
  const { settings, updateSettings } = useVoiceSettings();

  const player = useAudioPlayer({ sessionId: session?.id || '', settings });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  useEffect(() => {
    const fetchPastSessions = async () => {
      try {
        const res = await interviewsService.getSessions();
        if (Array.isArray(res)) {
          setPastSessions(res.map((s: any) => ({
            id: s.id,
            topic: s.topic,
            domain: s.domain,
            difficulty: s.difficulty,
            verdict: s.verdict,
            score: s.feedback?.overallScore || 0,
            duration: s.duration || 30,
            date: new Date(s.createdAt).toLocaleDateString(),
          })));
        }
      } catch (err) {
        console.error('Failed to load past sessions:', err);
      }
    };
    fetchPastSessions();
  }, []);

  const handleStartInterview = async () => {
    if (!selectedDomain || !selectedDifficulty || !selectedLanguage) return;
    try {
      const res = await interviewsService.start({
        domain: selectedDomain,
        difficulty: selectedDifficulty,
        language: selectedLanguage,
      });
      if (res?.id) {
        setSession({
          id: res.id,
          difficulty: res.difficulty || selectedDifficulty,
          domain: res.domain || selectedDomain,
          language: res.language || selectedLanguage,
          topic: res.topic,
          status: 'active',
          tokensUsed: res.tokensUsed || 0,
          duration: 30,
          messages: (res.messages || []).map((m: any) => ({
            id: m.id || `ai-${Date.now()}`,
            role: m.role === 'assistant' ? 'ai' : m.role,
            content: m.content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            audioUrl: m.audioUrl,
            isVoice: m.isVoice,
          })),
        });
      } else {
        console.error('Failed to start interview: no session returned');
        return;
      }
    } catch (err) {
      console.error('Failed to start interview:', err);
      return;
    }
    setViewMode('interview');
  };

  const processMessageSending = async (inputStr: string, isVoice = false, voiceAudioUrl?: string, originalBlobUrl?: string) => {
    if (!inputStr.trim() || !session) return;

    // Add user message to UI immediately
    const userMsgId = `user-${Date.now()}`;
    const newMsg: InterviewMessage = {
      id: userMsgId,
      role: 'user',
      content: inputStr,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoice,
      audioUrl: originalBlobUrl,
    };

    setSession({ ...session, messages: [...session.messages, newMsg] });
    setUserInput('');
    setIsTyping(true);

    try {
      let aiResponseContent = '';
      let replyAudioUrl = voiceAudioUrl;

      const res = await interviewsService.sendMessage(session.id, { content: inputStr });
      if (res?.reply) {
        aiResponseContent = res.reply;

        const aiMsg: InterviewMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: aiResponseContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          audioUrl: replyAudioUrl,
        };

        setSession((prev) => {
          if (!prev) return null;
          const newMessages = [...prev.messages, aiMsg];
          if (settings.autoPlay) {
            setTimeout(() => {
              player.play(newMessages.length - 1, aiResponseContent, replyAudioUrl);
            }, 100);
          }
          return { ...prev, messages: newMessages };
        });

      } else {
        throw new Error('No reply');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const aiMsg: InterviewMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: "Sorry, I couldn't process your message. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSession((prev) => prev ? { ...prev, messages: [...prev.messages, aiMsg] } : null);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => {
    processMessageSending(userInput, false);
  };

  const handleVoiceMessageSent = (data: { transcript: string; audioUrl?: string; originalBlobUrl?: string }) => {
    if (!data.audioUrl) {
      processMessageSending(data.transcript, true, undefined, data.originalBlobUrl);
    } else {
      processMessageSending(data.transcript, true, data.audioUrl, data.originalBlobUrl);
    }
  };

  const handleEndInterview = async () => {
    if (session) {
      try {
        const res = await interviewsService.endInterview(session.id);
        if (res?.feedback) {
          setSession({ ...session, status: 'completed', feedback: res.feedback, verdict: res.verdict });
        } else {
          setSession({ ...session, status: 'completed' });
        }
      } catch (err) {
        console.error('Failed to end interview:', err);
        setSession({ ...session, status: 'completed' });
      }
    }
    setViewMode('review');
  };

  if (viewMode === 'review' && session?.feedback) {
    const summary: InterviewSummary = {
      ...session.feedback,
      verdictLabel: getVerdictStyling(session.feedback.verdict).label,
      verdictColor: getVerdictStyling(session.feedback.verdict).color,
    };
    return <ReviewView
      summary={summary}
      domain={session.domain}
      difficulty={session.difficulty}
      onBack={() => {
        setViewMode('setup');
        setSelectedDomain(null);
        setSelectedDifficulty(null);
        setSetupStep('domain');
      }}
    />;
  }

  if (viewMode === 'interview' && session) {
    const domainInfo = getDomainById(session.domain);
    return (
      <Layout>
        <Navbar />
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4">
          {/* Interview Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center glow shrink-0">
                <Bot className="w-6 h-6 text-[var(--bg-primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] font-title">{t('interview.title')}</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {domainInfo?.icon} {domainInfo?.label} • {session.difficulty}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <VoiceSettingsPanel settings={settings} updateSettings={updateSettings} />

              <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] border-l border-[var(--border-default)] pl-3">
                <Globe className="w-4 h-4" />
                <span>{session.language === 'EN' ? '🇬🇧 EN' : '🇫🇷 FR'}</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] border-l border-[var(--border-default)] pl-3">
                <Clock className="w-4 h-4" />
                <span>{session.duration} min</span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleEndInterview} className="ml-2">
                <StopCircle className="w-4 h-4" />
                {t('interview.end')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[calc(100vh-200px)] lg:min-h-[calc(100vh-160px)]">
            {/* Chat Area */}
            <div className="lg:col-span-2 flex flex-col theme-card overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {session.messages.map((msg, index) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    playerState={player.currentMessageIndex === index ? player.state : 'idle'}
                    onPlay={() => player.play(index, msg.content, msg.audioUrl)}
                    onPause={player.pause}
                    onResume={player.resume}
                  />
                ))}
                {isTyping && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Bot className="w-5 h-5 text-[var(--brand-primary)]" />
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-[var(--border-default)] p-3">
                <div className="flex gap-2 relative">
                  <VoiceRecorder
                    sessionId={session.id}
                    settings={settings}
                    onMessageSent={handleVoiceMessageSent}
                    disabled={isTyping}
                  />

                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder={t('interview.typePlaceholder')}
                    rows={1}
                    className="flex-1 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors resize-none"
                    disabled={isTyping}
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isTyping}
                    className="w-10 flex-shrink-0 flex justify-center items-center rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-4 overflow-y-auto">
              {/* Domain Info */}
              {domainInfo && (
                <div className="theme-card p-4" style={{ borderLeft: `4px solid ${domainInfo.color}` }}>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-2">
                    <span className="text-xl">{domainInfo.icon}</span>
                    {domainInfo.label}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-3">{domainInfo.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {domainInfo.subTopics.slice(0, 4).map(sub => (
                      <span key={sub} className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="theme-card p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-[var(--brand-secondary)]" />
                  {t('interview.tips')}
                </h3>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <li className="flex gap-2"><ChevronRight className="w-3 h-3 text-[var(--brand-primary)] shrink-0 mt-0.5" /> Think out loud - explain your reasoning</li>
                  <li className="flex gap-2"><ChevronRight className="w-3 h-3 text-[var(--brand-primary)] shrink-0 mt-0.5" /> Clarify requirements before coding</li>
                  <li className="flex gap-2"><ChevronRight className="w-3 h-3 text-[var(--brand-primary)] shrink-0 mt-0.5" /> Start with brute force, then optimize</li>
                  <li className="flex gap-2"><ChevronRight className="w-3 h-3 text-[var(--brand-primary)] shrink-0 mt-0.5" /> Discuss time/space complexity</li>
                  <li className="flex gap-2"><ChevronRight className="w-3 h-3 text-[var(--brand-primary)] shrink-0 mt-0.5" /> Test with edge cases</li>
                </ul>
              </div>

              {/* Quick Actions */}
              <div className="theme-card p-4 space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{t('interview.quickActions')}</h3>
                {[
                  { label: 'Ask for a hint', icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { label: 'Request clarification', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                  { label: 'Submit code solution', icon: <Code2 className="w-3.5 h-3.5" /> },
                  { label: 'Discuss complexity', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => setUserInput(action.label)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] bg-[var(--surface-2)] hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] rounded-[var(--radius-md)] transition-colors text-left"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Setup View with 3-step flow
  return (
    <Layout>
      <Navbar />
      <div className="w-full px-4 sm:px-8 lg:px-16 py-12" style={{ lineHeight: 1.6 }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center glow" style={{ borderRadius: 16 }}>
            <Bot className="w-11 h-11 text-[var(--bg-primary)]" />
          </div>
          <h1 className="text-4xl font-bold gradient-brand-text font-title">{t('interview.title')}</h1>
          <p className="text-[var(--text-muted)] mt-3 max-w-xl mx-auto text-base">{t('interview.subtitle')}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {(['domain', 'difficulty', 'language'] as SetupStep[]).map((step, idx) => (
              <React.Fragment key={step}>
                <div className={`flex items-center gap-2 ${setupStep === step ? 'text-[var(--brand-primary)]' :
                  (setupStep === 'difficulty' && idx === 0) || (setupStep === 'language' && idx <= 1)
                    ? 'text-[var(--state-success)]' : 'text-[var(--text-muted)]'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${setupStep === step
                    ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)]'
                    : (setupStep === 'difficulty' && idx === 0) || (setupStep === 'language' && idx <= 1)
                      ? 'bg-[var(--state-success)] text-white'
                      : 'bg-[var(--surface-2)]'
                    }`}>
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {step === 'domain' ? 'Domain' : step === 'difficulty' ? 'Difficulty' : 'Language'}
                  </span>
                </div>
                {idx < 2 && <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Domain Selection */}
        {setupStep === 'domain' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--brand-primary)]" />
              Select your interview domain
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {interviewDomains.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => {
                    setSelectedDomain(domain.id);
                    setSetupStep('difficulty');
                  }}
                  className="text-left border transition-all hover:scale-[1.02]"
                  style={{
                    padding: '20px 16px',
                    borderRadius: 16,
                    borderColor: selectedDomain === domain.id ? domain.color : 'var(--border-default)',
                    backgroundColor: selectedDomain === domain.id ? `${domain.color}10` : 'var(--surface-1)',
                  }}
                >
                  <div className="text-3xl mb-3">{domain.icon}</div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{domain.label}</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">{domain.subTopics.length} topics</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Difficulty Selection */}
        {setupStep === 'difficulty' && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setSetupStep('domain')}
              className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to domain selection
            </button>

            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--brand-primary)]" />
              Select difficulty level
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              {getDomainById(selectedDomain!)?.icon} {getDomainById(selectedDomain!)?.label}
            </p>

            <div className="space-y-4">
              {difficultyLevels.map((diff) => {
                const domainInfo = getDomainById(selectedDomain!);
                const duration = domainInfo?.estimatedDurations[diff.id as keyof typeof domainInfo.estimatedDurations];
                return (
                  <button
                    key={diff.id}
                    onClick={() => {
                      setSelectedDifficulty(diff.id);
                      setSetupStep('language');
                    }}
                    className="w-full text-left border transition-all"
                    style={{
                      padding: 24,
                      borderRadius: 16,
                      borderColor: selectedDifficulty === diff.id ? diff.color : 'var(--border-default)',
                      backgroundColor: selectedDifficulty === diff.id ? `${diff.color}10` : 'var(--surface-1)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">{diff.label}</h3>
                      <span className="text-sm text-[var(--text-muted)]">{duration}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{diff.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Language Selection */}
        {setupStep === 'language' && (
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => setSetupStep('difficulty')}
              className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to difficulty selection
            </button>

            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[var(--brand-primary)]" />
              Select interview language
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedLanguage('FR')}
                className={`p-6 border-2 transition-all ${selectedLanguage === 'FR'
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10'
                  : 'border-[var(--border-default)] bg-[var(--surface-1)] hover:border-[var(--brand-primary)]/40'}`}
                style={{ borderRadius: 16 }}
              >
                <div className="text-4xl mb-3">🇫🇷</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Français</h3>
                <p className="text-sm text-[var(--text-muted)]">French interview</p>
              </button>
              <button
                onClick={() => setSelectedLanguage('EN')}
                className={`p-6 border-2 transition-all ${selectedLanguage === 'EN'
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10'
                  : 'border-[var(--border-default)] bg-[var(--surface-1)] hover:border-[var(--brand-primary)]/40'}`}
                style={{ borderRadius: 16 }}
              >
                <div className="text-4xl mb-3">🇬🇧</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">English</h3>
                <p className="text-sm text-[var(--text-muted)]">English interview</p>
              </button>
            </div>

            {/* Start Button */}
            <div className="mt-8 text-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartInterview}
                className="glow-hover"
                style={{ paddingInline: 48, paddingBlock: 18, borderRadius: 16, fontSize: '1.1rem' }}
              >
                <Play className="w-6 h-6" />
                Start Interview
              </Button>
              <p className="text-sm text-[var(--text-muted)] mt-3">
                {getDomainById(selectedDomain!)?.icon} {getDomainById(selectedDomain!)?.label} • {selectedDifficulty} • {selectedLanguage === 'FR' ? '🇫🇷 Français' : '🇬🇧 English'}
              </p>
            </div>
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-16 w-full"></div>
      </div>
    </Layout>
  );
}

/* ───── Chat Message Component ───── */

interface ChatMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  message: InterviewMessage & { audioUrl?: string, isVoice?: boolean };
  playerState?: 'idle' | 'loading' | 'playing' | 'paused';
  onPlay?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

function ChatMessage({ message, playerState = 'idle', onPlay, onPause, onResume, ...rest }: ChatMessageProps) {
  if (message.role === 'system') {
    return (
      <div className="text-center py-3">
        <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
          {message.content}
        </span>
      </div>
    );
  }

  const isAI = message.role === 'ai';

  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${isAI
        ? 'bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)]'
        : 'bg-[var(--surface-3)]'
        }`}>
        {isAI ? <Bot className="w-5 h-5 text-[var(--bg-primary)]" /> : <span className="text-sm">👤</span>}
      </div>
      <div className={`max-w-[75%] space-y-2 ${isAI ? '' : 'items-end'}`}>
        <div className={`px-4 py-3 rounded-[var(--radius-lg)] text-sm leading-relaxed whitespace-pre-wrap flex flex-col relative group ${isAI
          ? 'bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-primary)] pl-12'
          : 'bg-[var(--brand-primary)] text-[var(--bg-primary)]'
          }`}>

          {isAI && onPlay && onPause && onResume && (
            <div className="absolute left-3 top-3">
              <AudioPlayButton
                isCurrentMessage={playerState !== 'idle'}
                state={playerState}
                onPlay={onPlay}
                onPause={onPause}
                onResume={onResume}
              />
            </div>
          )}

          {message.isVoice && !isAI && (
            <div className="flex items-center gap-1.5 mb-2 text-xs opacity-90 border-b border-[var(--bg-primary)]/20 pb-1.5">
              <Mic className="w-3.5 h-3.5" />
              <span>Voice message transcribed</span>
              {message.audioUrl && (
                <button
                  onClick={() => {
                    const audio = new Audio(message.audioUrl);
                    audio.play();
                  }}
                  className="ml-auto p-1 hover:bg-white/20 rounded-full transition-colors"
                  title="Replay your message"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          {message.content}

          {message.audioUrl && isAI && (
            <div className="mt-2 pt-2 border-t border-[var(--border-default)] opacity-90">
              <audio controls src={message.audioUrl} className="h-8 max-w-[200px]" />
            </div>
          )}
        </div>

        {/* Code Block */}
        {message.codeBlock && (
          <div className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-default)]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface-2)] text-xs text-[var(--text-muted)]">
              <span>{message.codeBlock.language}</span>
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <pre className="p-3 bg-[var(--surface-1)] text-xs font-mono text-[var(--text-primary)] overflow-x-auto">
              <code>{message.codeBlock.code}</code>
            </pre>
          </div>
        )}

        {/* Feedback Badge */}
        {message.feedback && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className={`font-medium ${message.feedback.score >= 80 ? 'text-[var(--state-success)]' : message.feedback.score >= 60 ? 'text-[var(--state-warning)]' : 'text-[var(--state-error)]'
              }`}>
              Score: {message.feedback.score}/100
            </span>
          </div>
        )}

        <span className="text-[10px] text-[var(--text-muted)]">{message.timestamp}</span>
      </div>
    </div>
  );
}

/* ───── Review View ───── */

interface ReviewViewProps {
  summary: InterviewSummary;
  domain: InterviewDomain;
  difficulty: string;
  onBack: () => void;
}

function ReviewView({ summary, domain, difficulty, onBack }: ReviewViewProps) {
  const { t } = useLanguage();
  const domainInfo = getDomainById(domain);
  const verdictStyle = getVerdictStyling(summary.verdict);

  const scoreColor = (score: number) =>
    score >= 80 ? 'var(--state-success)' : score >= 60 ? 'var(--state-warning)' : 'var(--state-error)';

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'HIRE': return <ThumbsUp className="w-5 h-5" />;
      case 'NO_HIRE': return <ThumbsDown className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  return (
    <Layout>
      <Navbar />
      <div className="max-w-[960px] mx-auto px-6 lg:px-10 py-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('interview.backToSetup')}
        </button>

        {/* Domain & Difficulty Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-2xl">{domainInfo?.icon}</span>
          <span className="text-lg font-semibold text-[var(--text-primary)]">{domainInfo?.label}</span>
          <span className="text-[var(--text-muted)]">•</span>
          <span className="text-lg text-[var(--text-secondary)] capitalize">{difficulty}</span>
        </div>

        {/* Overall Score + Verdict */}
        <div className="theme-card p-8 text-center mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 font-title">{t('interview.reviewTitle')}</h2>

          {/* Verdict Badge */}
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6"
            style={{ backgroundColor: verdictStyle.bgColor, color: verdictStyle.color }}
          >
            {getVerdictIcon(summary.verdict)}
            <span className="text-lg font-bold">{verdictStyle.label}</span>
          </div>

          <div
            className="w-28 h-28 mx-auto rounded-full border-4 flex items-center justify-center mb-4"
            style={{ borderColor: scoreColor(summary.overallScore) }}
          >
            <span className="text-4xl font-bold" style={{ color: scoreColor(summary.overallScore) }}>
              {summary.overallScore}
            </span>
          </div>
          <p className="text-[var(--text-muted)]">{t('interview.overallScore')}</p>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: t('interview.technical'), score: summary.technicalScore ?? 0, icon: <Code2 className="w-5 h-5" /> },
            { label: t('interview.communication'), score: summary.communicationScore ?? 0, icon: <MessageSquare className="w-5 h-5" /> },
            { label: t('interview.problemSolving'), score: summary.problemSolvingScore ?? 0, icon: <Lightbulb className="w-5 h-5" /> },
          ].map((item) => (
            <div key={item.label} className="theme-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: scoreColor(item.score) }}>{item.icon}</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
                <span className="ml-auto text-lg font-bold" style={{ color: scoreColor(item.score) }}>{item.score}</span>
              </div>
              <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${item.score}%`, backgroundColor: scoreColor(item.score) }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Competency Scores */}
        {summary.competencyScores && summary.competencyScores.length > 0 && (
          <div className="theme-card p-5 mb-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[var(--brand-primary)]" />
              Competency Breakdown
            </h3>
            <div className="space-y-3">
              {summary.competencyScores.map((comp: CompetencyScore, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm text-[var(--text-secondary)] w-40">{comp.competency}</span>
                  <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${comp.score * 10}%`, backgroundColor: scoreColor(comp.score) }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right" style={{ color: scoreColor(comp.score) }}>
                    {comp.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="theme-card p-5">
            <h3 className="text-sm font-semibold text-[var(--state-success)] flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4" />
              {t('interview.strengths')}
            </h3>
            <ul className="space-y-2">
              {summary.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 className="w-4 h-4 text-[var(--state-success)] shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="theme-card p-5">
            <h3 className="text-sm font-semibold text-[var(--state-warning)] flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" />
              {t('interview.improvements')}
            </h3>
            <ul className="space-y-2">
              {summary.improvements.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                  <AlertTriangle className="w-4 h-4 text-[var(--state-warning)] shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommended Resources */}
        {summary.recommendedResources && summary.recommendedResources.length > 0 && (
          <div className="theme-card p-5 mb-6">
            <h3 className="text-sm font-semibold text-[var(--brand-primary)] flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4" />
              Recommended Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.recommendedResources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-[var(--surface-2)] hover:bg-[var(--brand-primary)]/10 rounded-[var(--radius-md)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center">
                    {resource.type === 'course' ? <BookOpen className="w-4 h-4 text-[var(--brand-primary)]" /> :
                      resource.type === 'article' ? <Code2 className="w-4 h-4 text-[var(--brand-primary)]" /> :
                        <Target className="w-4 h-4 text-[var(--brand-primary)]" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{resource.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">{resource.type}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Closing Message */}
        <div className="theme-card p-5">
          <h3 className="text-sm font-semibold text-[var(--brand-primary)] flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" />
            Final Words
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{summary.closingMessage}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button variant="primary" size="md" onClick={onBack}>
            <RotateCcw className="w-4 h-4" />
            {t('interview.newSession')}
          </Button>
          <Button variant="secondary" size="md" onClick={onBack}>
            {t('interview.backToSetup')}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
