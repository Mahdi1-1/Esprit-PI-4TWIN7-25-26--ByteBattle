import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Layout } from '../components/Layout';
import { Trophy, Target, Award, Loader2, Share2, Copy, Check, ExternalLink, Calendar, MessageSquare, Swords } from 'lucide-react';
import { profileService, type ProfileStats } from '../services/profileService';
import { BadgeGrid, type BadgeData } from '../components/BadgeCard';
import api from '../api/axios';

// ─── Types ─────────────────────────────────────────────────────
interface PublicProfileData {
  id: string;
  username: string;
  profileImage: string | null;
  bio: string | null;
  level: number;
  xp: number;
  elo: number;
  createdAt: string;
  _count: { submissions: number; discussions: number };
  badges: {
    key: string;
    name: string;
    ruleText: string;
    iconUrl: string;
    rarity: string;
    earnedAt: string;
  }[];
}

// ─── Helper: rank label based on elo ───────────────────────────
function eloRank(elo: number): { label: string; color: string } {
  if (elo >= 2400) return { label: 'Grandmaster', color: 'text-red-400' };
  if (elo >= 2000) return { label: 'Master', color: 'text-yellow-400' };
  if (elo >= 1600) return { label: 'Diamond', color: 'text-cyan-400' };
  if (elo >= 1400) return { label: 'Gold', color: 'text-yellow-500' };
  if (elo >= 1200) return { label: 'Silver', color: 'text-gray-400' };
  return { label: 'Bronze', color: 'text-orange-400' };
}

// ─── Component ─────────────────────────────────────────────────
export function PublicProfile() {
  const { username } = useParams<{ username: string }>();

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activity, setActivity] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch all data in parallel
  useEffect(() => {
    if (!username) return;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, statsRes, activityRes] = await Promise.all([
          api.get(`/users/username/${encodeURIComponent(username)}`),
          api.get(`/users/username/${encodeURIComponent(username)}/stats`),
          api.get(`/users/username/${encodeURIComponent(username)}/activity`, { params: { limit: 10 } }),
        ]);
        setProfile(profileRes.data);
        setStats(statsRes.data);
        setActivity(Array.isArray(activityRes.data) ? activityRes.data : []);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [username]);

  // ─── Share logic ─────────────────────────────────────────────
  const shareUrl = `${window.location.origin}/u/${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.username}'s ByteBattle Profile`,
        text: `Check out ${profile?.username}'s profile on ByteBattle!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  // ─── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--brand-primary)]" />
            <p className="text-[var(--text-muted)]">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Error state ────────────────────────────────────────────
  if (error || !profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="text-6xl">👤</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{error || 'User not found'}</h1>
            <p className="text-[var(--text-muted)]">This profile doesn't exist or has been removed.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Go Home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Computed values ────────────────────────────────────────
  const rank = eloRank(stats?.elo ?? profile.elo);
  const xpToNext = 1000 * profile.level;
  const xpProgress = Math.min((profile.xp / xpToNext) * 100, 100);
  const joinedDate = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Map badges to BadgeData format for BadgeGrid
  const badgeGridData: BadgeData[] = profile.badges.map((b, i) => ({
    id: `${b.key}-${i}`,
    earnedAt: b.earnedAt,
    badge: {
      id: `${b.key}-${i}`,
      key: b.key,
      name: b.name,
      rarity: b.rarity,
      ruleText: b.ruleText,
      iconUrl: b.iconUrl,
    },
  }));

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">

        {/* ─── Hero Card ──────────────────────────────────────── */}
        <div className="relative bg-[var(--surface-1)] border border-[var(--border-default)] rounded-2xl overflow-hidden">
          {/* Gradient banner */}
          <div className="h-32 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-primary)] opacity-80" />

          <div className="relative px-6 pb-6 -mt-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              {/* Avatar */}
              <img
                src={profileService.getPhotoUrl(profile.profileImage, profile.username)}
                alt={profile.username}
                referrerPolicy="no-referrer"
                className="w-28 h-28 rounded-full border-4 border-[var(--surface-1)] object-cover bg-[var(--surface-2)] shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
                }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-[var(--text-primary)]">{profile.username}</h1>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--surface-2)] ${rank.color}`}>
                    {rank.label}
                  </span>
                </div>
                {profile.bio && (
                  <p className="text-[var(--text-secondary)] mt-1 max-w-lg">{profile.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {joinedDate}
                  </span>
                </div>
              </div>

              {/* Share button */}
              <div className="flex gap-2 self-start sm:self-end mt-4 sm:mt-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                  title="Copy profile link"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                  title="Share profile"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Level */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--text-secondary)]">Level</span>
              <Target className="w-4 h-4 text-[var(--brand-primary)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">{profile.level}</div>
            <div className="w-full bg-[var(--surface-2)] rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] h-2 rounded-full transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1 tabular-nums">{profile.xp} / {xpToNext} XP</div>
          </div>

          {/* Elo */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--text-secondary)]">Elo Rating</span>
              <Trophy className="w-4 h-4 text-[var(--brand-primary)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">{stats?.elo ?? profile.elo}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              Rank #{stats?.leaderboardPosition ?? '-'} of {stats?.totalUsers ?? 0}
            </div>
          </div>

          {/* Challenges */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--text-secondary)]">Challenges Solved</span>
              <Award className="w-4 h-4 text-[var(--brand-primary)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">{stats?.challengesSolved ?? 0}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {profile._count.submissions} total submissions
            </div>
          </div>

          {/* Duels */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--text-secondary)]">Duels</span>
              <Swords className="w-4 h-4 text-[var(--brand-primary)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
              <span className="text-green-400">{stats?.duelsWon ?? 0}</span>
              <span className="text-[var(--text-muted)] text-lg mx-1">/</span>
              <span className="text-red-400">{stats?.duelsLost ?? 0}</span>
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {(stats?.winRate ?? 0).toFixed(1)}% win rate
            </div>
          </div>
        </div>

        {/* ─── Badges & Activity ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Badges — wider */}
          <div className="lg:col-span-3 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              🏆 Badges & Achievements
              {badgeGridData.length > 0 && (
                <span className="text-sm font-normal text-[var(--text-muted)]">({badgeGridData.length})</span>
              )}
            </h2>
            <BadgeGrid
              badges={badgeGridData}
              size="sm"
              limit={15}
              emptyMessage="No badges earned yet."
            />
          </div>

          {/* Activity feed */}
          <div className="lg:col-span-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              ⚡ Recent Activity
            </h2>
            {activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((a: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b border-[var(--border-default)] last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center flex-shrink-0 text-sm">
                      {a.type === 'solved'     && '✓'}
                      {a.type === 'duel_won'   && '⚔️'}
                      {a.type === 'duel_lost'  && '💔'}
                      {a.type === 'discussion' && '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] leading-snug">
                        {a.type === 'solved'     && <>Solved <span className="font-semibold">"{a.problem}"</span></>}
                        {a.type === 'duel_won'   && <>Won duel vs <span className="font-semibold">{a.opponent}</span></>}
                        {a.type === 'duel_lost'  && <>Lost duel vs <span className="font-semibold">{a.opponent}</span></>}
                        {a.type === 'discussion' && <>Posted <span className="font-semibold">"{a.title}"</span></>}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {new Date(a.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] italic">No recent activity.</p>
            )}
          </div>
        </div>

        {/* ─── Detailed Statistics ─────────────────────────────── */}
        {stats && (
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">📊 Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Duels Won', value: stats.duelsWon, color: 'text-green-400' },
                { label: 'Duels Lost', value: stats.duelsLost, color: 'text-red-400' },
                { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, color: 'text-[var(--brand-primary)]' },
                { label: 'Challenges', value: stats.challengesSolved, color: 'text-[var(--text-primary)]' },
                { label: 'Discussions', value: stats.discussionsCount, color: 'text-[var(--text-primary)]' },
                { label: 'Comments', value: stats.commentsCount, color: 'text-[var(--text-primary)]' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xs text-[var(--text-muted)] mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
