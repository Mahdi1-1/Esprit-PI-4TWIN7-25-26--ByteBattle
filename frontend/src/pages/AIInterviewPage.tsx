import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { useLanguage } from '../context/LanguageContext';
import {
  Bot, Send, Play, StopCircle, RotateCcw, Clock, Star, TrendingUp,
  ChevronRight, Code2, MessageSquare, BarChart3, Mic, MicOff,
  Sparkles, Target, Lightbulb, Award, BookOpen, ArrowLeft,
  CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';
import {
  interviewTopics,
  difficultyLevels,
  mockInterviewSession,
  mockCompletedSession,
  pastInterviews,
  type InterviewTopic,
  type InterviewDifficulty,
  type InterviewMessage,
  type InterviewSession,
  type InterviewSummary,
} from '../data/interviewData';

type ViewMode = 'setup' | 'interview' | 'review';

export function AIInterviewPage() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [selectedTopic, setSelectedTopic] = useState<InterviewTopic | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<InterviewDifficulty | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleStartInterview = () => {
    if (!selectedTopic || !selectedDifficulty) return;
    setSession(mockInterviewSession);
    setViewMode('interview');
  };

  const handleSendMessage = () => {
    if (!userInput.trim() || !session) return;
    const newMsg: InterviewMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSession({ ...session, messages: [...session.messages, newMsg] });
    setUserInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: InterviewMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: "That's a good approach! Let me follow up on that. Can you think of any edge cases that might break your solution? Consider empty inputs, duplicates, and very large datasets.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSession((prev) => prev ? { ...prev, messages: [...prev.messages, aiMsg] } : null);
      setIsTyping(false);
    }, 2000);
  };

  const handleEndInterview = () => {
    setSession(mockCompletedSession);
    setViewMode('review');
  };

  if (viewMode === 'review' && session?.summary) {
    return <ReviewView summary={session.summary} onBack={() => setViewMode('setup')} />;
  }

  if (viewMode === 'interview' && session) {
    return (
      <Layout>
        <Navbar />
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4">
          {/* Interview Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center glow">
                <Bot className="w-6 h-6 text-[var(--bg-primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] font-title">{t('interview.title')}</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {interviewTopics.find((tp) => tp.id === session.topic)?.label} • {session.difficulty}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <Clock className="w-4 h-4" />
                <span>{session.duration} min</span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleEndInterview}>
                <StopCircle className="w-4 h-4" />
                {t('interview.end')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 160px)' }}>
            {/* Chat Area */}
            <div className="lg:col-span-2 flex flex-col theme-card overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {session.messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
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
                <div className="flex gap-2">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder={t('interview.typePlaceholder')}
                    rows={2}
                    className="flex-1 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors resize-none"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={handleSendMessage}
                      disabled={!userInput.trim()}
                      className="flex-1 px-3 rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-4 overflow-y-auto">
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

  // Setup View
  return (
    <Layout>
      <Navbar />
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center glow">
            <Bot className="w-10 h-10 text-[var(--bg-primary)]" />
          </div>
          <h1 className="text-3xl font-bold gradient-brand-text font-title">{t('interview.title')}</h1>
          <p className="text-[var(--text-muted)] mt-2 max-w-lg mx-auto">{t('interview.subtitle')}</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: t('interview.totalSessions'), value: '12', icon: <MessageSquare className="w-5 h-5" /> },
            { label: t('interview.avgScore'), value: '81%', icon: <Star className="w-5 h-5" /> },
            { label: t('interview.bestScore'), value: '91%', icon: <Award className="w-5 h-5" /> },
            { label: t('interview.streak'), value: '5 days', icon: <TrendingUp className="w-5 h-5" /> },
          ].map((stat) => (
            <div key={stat.label} className="theme-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)]">
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Setup Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Topic Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--brand-primary)]" />
                {t('interview.selectTopic')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {interviewTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`text-left p-4 rounded-[var(--card-radius)] border transition-all ${
                      selectedTopic === topic.id
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 ring-1 ring-[var(--brand-primary)]/20'
                        : 'border-[var(--border-default)] bg-[var(--surface-1)] hover:border-[var(--brand-primary)]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{topic.icon}</span>
                      <div>
                        <h3 className="font-medium text-[var(--text-primary)]">{topic.label}</h3>
                        <p className="text-xs text-[var(--text-muted)]">{topic.questionCount} questions</p>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{topic.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--brand-primary)]" />
                {t('interview.selectDifficulty')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {difficultyLevels.map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => setSelectedDifficulty(diff.id)}
                    className={`text-left p-4 rounded-[var(--card-radius)] border transition-all ${
                      selectedDifficulty === diff.id
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 ring-1 ring-[var(--brand-primary)]/20'
                        : 'border-[var(--border-default)] bg-[var(--surface-1)] hover:border-[var(--brand-primary)]/40'
                    }`}
                  >
                    <h3 className="font-medium text-[var(--text-primary)] mb-1">{diff.label}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">{diff.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                disabled={!selectedTopic || !selectedDifficulty}
                onClick={handleStartInterview}
                className="w-full md:w-auto glow-hover"
              >
                <Play className="w-5 h-5" />
                {t('interview.startInterview')}
              </Button>
            </div>
          </div>

          {/* Past Interviews */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--brand-primary)]" />
              {t('interview.pastSessions')}
            </h2>
            <div className="space-y-3">
              {pastInterviews.map((pi) => {
                const topicInfo = interviewTopics.find((tp) => tp.id === pi.topic);
                return (
                  <button
                    key={pi.id}
                    onClick={() => {
                      setSession(mockCompletedSession);
                      setViewMode('review');
                    }}
                    className="w-full text-left theme-card p-4 hover:border-[var(--brand-primary)]/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{topicInfo?.icon}</span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{topicInfo?.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${pi.score >= 80 ? 'text-[var(--state-success)]' : pi.score >= 60 ? 'text-[var(--state-warning)]' : 'text-[var(--state-error)]'}`}>
                        {pi.score}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span className="capitalize">{pi.difficulty}</span>
                      <span>•</span>
                      <span>{pi.duration} min</span>
                      <span>•</span>
                      <span>{pi.date}</span>
                    </div>
                    {/* Score bar */}
                    <div className="mt-2 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pi.score}%`,
                          backgroundColor: pi.score >= 80 ? 'var(--state-success)' : pi.score >= 60 ? 'var(--state-warning)' : 'var(--state-error)',
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ───── Chat Message Component ───── */

function ChatMessage({ message, ...rest }: { message: InterviewMessage } & React.HTMLAttributes<HTMLDivElement>) {
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
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
        isAI
          ? 'bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)]'
          : 'bg-[var(--surface-3)]'
      }`}>
        {isAI ? <Bot className="w-5 h-5 text-[var(--bg-primary)]" /> : <span className="text-sm">👤</span>}
      </div>
      <div className={`max-w-[75%] space-y-2 ${isAI ? '' : 'items-end'}`}>
        <div className={`px-4 py-3 rounded-[var(--radius-lg)] text-sm leading-relaxed whitespace-pre-wrap ${
          isAI
            ? 'bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-primary)]'
            : 'bg-[var(--brand-primary)] text-[var(--bg-primary)]'
        }`}>
          {message.content}
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
            <span className={`font-medium ${
              message.feedback.score >= 80 ? 'text-[var(--state-success)]' : message.feedback.score >= 60 ? 'text-[var(--state-warning)]' : 'text-[var(--state-error)]'
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

function ReviewView({ summary, onBack }: { summary: InterviewSummary; onBack: () => void }) {
  const { t } = useLanguage();

  const scoreColor = (score: number) =>
    score >= 80 ? 'var(--state-success)' : score >= 60 ? 'var(--state-warning)' : 'var(--state-error)';

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

        {/* Overall Score */}
        <div className="theme-card p-8 text-center mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 font-title">{t('interview.reviewTitle')}</h2>
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
            { label: t('interview.technical'), score: summary.technicalScore, icon: <Code2 className="w-5 h-5" /> },
            { label: t('interview.communication'), score: summary.communicationScore, icon: <MessageSquare className="w-5 h-5" /> },
            { label: t('interview.problemSolving'), score: summary.problemSolvingScore, icon: <Lightbulb className="w-5 h-5" /> },
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

        {/* Recommendation */}
        <div className="theme-card p-5">
          <h3 className="text-sm font-semibold text-[var(--brand-primary)] flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" />
            {t('interview.recommendation')}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{summary.recommendation}</p>
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
