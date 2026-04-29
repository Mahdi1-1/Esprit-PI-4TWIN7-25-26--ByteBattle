import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import {
  MessageSquare, CheckCircle2, Flame, Plus, TrendingUp,
  Users, ArrowUpCircle, Eye, Zap, Hash, ChevronRight,
} from 'lucide-react';
import { discussionCategories } from '../data/discussionData';
import { discussionsService } from '../services/discussionsService';

export function ForumPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalPosts: 0, activeUsers: 0, solvedThreads: 0, thisWeek: 0 });
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    Promise.all([
      discussionsService.getStats(),
      discussionsService.getPopularTags(),
    ])
      .then(([s, tags]) => {
        setStats(s);
        if (Array.isArray(tags)) setPopularTags(tags.slice(0, 20));
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const displayCategories = discussionCategories.filter((c) => c.id !== 'all');

  const statCards = [
    { icon: <MessageSquare className="w-5 h-5" />, value: stats.totalPosts, label: 'Total Posts', colorClass: 'text-orange-500', bgClass: 'bg-orange-500/10' },
    { icon: <Users className="w-5 h-5" />, value: stats.activeUsers, label: 'Active Members', colorClass: 'text-green-500', bgClass: 'bg-green-500/10' },
    { icon: <CheckCircle2 className="w-5 h-5" />, value: stats.solvedThreads, label: 'Solved Threads', colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10' },
    { icon: <Zap className="w-5 h-5" />, value: stats.thisWeek, label: 'New This Week', colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  ];

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-500">
        
        {/* ── HERO BANNER ── */}
        <div className="relative rounded-2xl mb-12 p-10 sm:p-14 overflow-hidden border border-[var(--border-default)] bg-[var(--surface-1)] shadow-sm">
          {/* Subtle noise/gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-2)]/30 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-6">
                <Flame className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> Community Forum
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight mb-5 leading-tight">
                Welcome to <span className="text-[var(--brand-primary)]">ByteBattle</span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
                Ask questions, share your knowledge, connect with top coders, and level up your skills in our collaborative environment.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link to="/discussion">
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-all hover:scale-[1.02]">
                  <Eye className="w-4 h-4" /> Browse Posts
                </button>
              </Link>
              <Link to="/discussion/new">
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--brand-primary)] text-white font-semibold transition-all hover:opacity-90 hover:scale-[1.02] shadow-sm">
                  <Plus className="w-4 h-4" /> New Post
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {statCards.map((s) => (
            <div key={s.label} className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-default)] transition-all hover:shadow-md hover:border-[var(--brand-primary)]/40 group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bgClass} ${s.colorClass}`}>
                  {s.icon}
                </div>
              </div>
              <p className="text-3xl font-extrabold text-[var(--text-primary)] mb-1 tracking-tight">
                {loadingStats ? <span className="opacity-30 animate-pulse">—</span> : s.value.toLocaleString()}
              </p>
              <p className="text-sm font-medium text-[var(--text-secondary)] truncate">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* ══ COMMUNITIES ══ */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Hash className="w-5 h-5 text-[var(--brand-primary)]" /> Communities
              </h2>
              <Link to="/discussion" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayCategories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/discussion?category=${cat.id}`)}
                  className="flex items-center p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)] hover:bg-[var(--surface-2)] transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 mr-4 bg-[var(--surface-3)] border border-[var(--border-default)] group-hover:scale-105 transition-transform">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-[var(--text-primary)] transition-colors line-clamp-1">
                      {cat.label}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 truncate">/{cat.id}</p>
                  </div>
                  <ArrowUpCircle className="w-5 h-5 text-[var(--text-muted)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[var(--text-primary)] transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* ══ RIGHT SIDEBAR ══ */}
          <aside className="space-y-6">
            {/* Trending Tags */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--border-default)]">
                <TrendingUp className="w-4 h-4 text-[var(--text-secondary)]" />
                <h3 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider">Trending Tags</h3>
              </div>
              <div className="space-y-1">
                {popularTags.slice(0, 8).map((item, i) => (
                  <button
                    key={item.tag}
                    onClick={() => navigate(`/discussion?search=${encodeURIComponent(item.tag)}`)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[var(--text-muted)] w-4 text-center">
                        {i + 1}
                      </span>
                      <span className="font-medium text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                        #{item.tag}
                      </span>
                    </div>
                    <span className="text-xs font-medium bg-[var(--surface-3)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-default)]">
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
              <div className="flex items-center gap-2 mb-5">
                <Flame className="w-4 h-4 text-[var(--text-secondary)]" />
                <h3 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider">Rules & Etiquette</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Stay respectful & professional',
                  'No spamming or self-promotion',
                  'Focus on coding and algorithms',
                  'Mark your questions as solved',
                  'Search before creating new posts',
                ].map((rule, i) => (
                  <li key={rule} className="flex gap-3 text-sm text-[var(--text-secondary)] items-start">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[var(--surface-3)] border border-[var(--border-default)] text-[var(--text-muted)] text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}