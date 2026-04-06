import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import {
  MessageSquare, CheckCircle2, Flame, Plus, TrendingUp,
  Users, ArrowUpCircle, Eye, Zap,
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

  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── TOP BANNER ── */}
        <div
          className="rounded-[var(--radius-lg)] mb-6 px-6 py-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 18%, var(--surface-1)), var(--surface-2))',
            border: '1px solid color-mix(in srgb, var(--brand-primary) 25%, var(--border-default))',
          }}
        >
          <div
            className="absolute right-0 top-0 w-72 h-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at right, var(--brand-primary), transparent 70%)' }}
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-[var(--text-primary)]">b/ByteBattle</span>
              </div>
              <p className="text-sm text-[var(--text-muted)] max-w-sm">
                {t('discussion.subtitle')}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link to="/discussion">
                <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--brand-primary)] text-[var(--brand-primary)] text-sm font-semibold hover:bg-[var(--brand-primary)]/10 transition-colors">
                  <Eye className="w-4 h-4" />
                  Browse Posts
                </button>
              </Link>
              <Link to="/discussion/new">
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity">
                  <Plus className="w-4 h-4" />
                  New Post
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ══ LEFT / MAIN ══ */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <MessageSquare className="w-4 h-4" />, value: stats.totalPosts, label: 'Posts', color: 'var(--brand-primary)' },
                { icon: <Users className="w-4 h-4" />,         value: stats.activeUsers, label: 'Members', color: 'var(--state-success)' },
                { icon: <CheckCircle2 className="w-4 h-4" />,  value: stats.solvedThreads, label: 'Solved', color: 'var(--state-info)' },
                { icon: <Zap className="w-4 h-4" />,           value: stats.thisWeek, label: 'This week', color: 'var(--state-warning)' },
              ].map((s) => (
                <div key={s.label} className="theme-card px-4 py-3 flex items-center gap-3">
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <div>
                    <p className="font-bold text-[var(--text-primary)] tabular-nums text-lg leading-none">
                      {loadingStats ? '…' : s.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
<br></br>
            {/* Communities / categories */}
            <div className="theme-card divide-y divide-[var(--border-default)]">
              <div className="px-4 py-3 flex items-center justify-between">
                <h2 className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-wide">
                  Communities
                </h2>
                <Link to="/discussion" className="text-xs text-[var(--brand-primary)] font-semibold hover:underline">
                  View all posts →
                </Link>
              </div>
              {displayCategories.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/discussion?category=${cat.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3
                             hover:bg-[var(--surface-2)] transition-colors text-left group"
                >
                  {/* Number */}
                  <span className="text-xs font-bold text-[var(--text-muted)] w-5 shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: `color-mix(in srgb, ${cat.color} 15%, transparent)` }}
                  >
                    {cat.icon}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate group-hover:text-[var(--brand-primary)] transition-colors"
                      style={{ color: cat.color }}
                    >
                      b/{cat.label}
                    </p>
                  </div>
                  {/* Arrow */}
                  <ArrowUpCircle
                    className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  />
                </button>
              ))}
            </div>

          </div>

          {/* ══ RIGHT SIDEBAR ══ */}
          <aside className="lg:w-72 shrink-0 space-y-4">

            {/* Community info card */}
            <div className="theme-card overflow-hidden">
              <div
                className="h-14"
                style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary, var(--brand-primary)))' }}
              />
              <div className="px-4 pb-4 -mt-6">
                <div className="w-12 h-12 rounded-full bg-[var(--brand-primary)] flex items-center justify-center border-4 border-[var(--surface-1)] mb-3">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-[var(--text-primary)] mb-0.5">b/ByteBattle</p>
                <p className="text-xs text-[var(--text-muted)] mb-3">The ByteBattle community — discuss algorithms, challenges, duels & more.</p>
                <div className="flex gap-4 mb-4 text-center">
                  <div>
                    <p className="font-bold text-[var(--text-primary)] tabular-nums">
                      {loadingStats ? '…' : stats.totalPosts.toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Posts</p>
                  </div>
                  <div className="w-px bg-[var(--border-default)]" />
                  <div>
                    <p className="font-bold text-[var(--text-primary)] tabular-nums">
                      {loadingStats ? '…' : stats.activeUsers.toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Members</p>
                  </div>
                  <div className="w-px bg-[var(--border-default)]" />
                  <div>
                    <p className="font-bold text-[var(--state-success)] tabular-nums">
                      {loadingStats ? '…' : `+${stats.thisWeek}`}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">This week</p>
                  </div>
                </div>
                <Link to="/discussion/new" className="block">
                  <button className="w-full py-2 rounded-full bg-[var(--brand-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity">
                    + Create Post
                  </button>
                </Link>
              </div>
            </div>

            {/* Trending tags */}
            {popularTags.length > 0 && (
              <div className="theme-card px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[var(--brand-primary)]" />
                  <h3 className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-wide">
                    Trending Tags
                  </h3>
                </div>
                <div className="space-y-2">
                  {popularTags.slice(0, 8).map((item, i) => (
                    <button
                      key={item.tag}
                      onClick={() => navigate(`/discussion?search=${encodeURIComponent(item.tag)}`)}
                      className="w-full flex items-center justify-between text-sm
                                 hover:text-[var(--brand-primary)] transition-colors group"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-muted)] w-4 tabular-nums">
                          {i + 1}
                        </span>
                        <span className="font-medium text-[var(--text-secondary)] group-hover:text-[var(--brand-primary)]">
                          #{item.tag}
                        </span>
                      </span>
                      <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hot right now */}
            <div className="theme-card px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-wide">
                  ByteBattle Rules
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-[var(--text-muted)]">
                {[
                  'Be respectful to everyone',
                  'No spam or self-promotion',
                  'Keep it related to coding',
                  'Mark solutions as solved',
                  'Search before posting',
                ].map((rule, i) => (
                  <li key={rule} className="flex items-start gap-2">
                    <span className="font-bold text-[var(--brand-primary)] shrink-0">{i + 1}.</span>
                    {rule}
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