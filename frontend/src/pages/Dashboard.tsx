import { Link } from 'react-router';
import { Button } from '../components/Button';
import { XPBar } from '../components/ProgressBar';
import { ProblemCard } from '../components/ProblemCard';
import { MatchCard } from '../components/MatchCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Swords, Play, Users, TrendingUp, Loader, Code2, PenTool, LayoutGrid } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { profileService } from '../services/profileService';
import { BadgeGrid, BadgeData } from '../components/BadgeCard';

// ─── Skill labels (display names) ────────────────────────────────────────────
const SKILL_LABELS: Record<string, string> = {
  Algorithm: 'Algorithm',
  CleanCode: 'Clean Code',
  DataStructures: 'Data Structures',
  DynamicProgramming: 'Dynamic Programming',
  Graph: 'Graph / Trees',
  Debug: 'Debugging',
  Speed: 'Speed',
};

// ─── Default (empty) skills shown while loading ────────────────────────────
const DEFAULT_SKILLS: Record<string, number> = {
  Algorithm: 0,
  CleanCode: 0,
  DataStructures: 0,
  DynamicProgramming: 0,
  Graph: 0,
  Debug: 0,
  Speed: 0,
};

const INTELLIGENCE_SKILL_KEYS: Record<string, keyof typeof DEFAULT_SKILLS> = {
  algo: 'Algorithm',
  clean_code: 'CleanCode',
  data_structures: 'DataStructures',
  dynamic_programming: 'DynamicProgramming',
  graphs: 'Graph',
  debugging: 'Debug',
  speed: 'Speed',
};

const mapIntelligenceSkillsToDashboard = (currentSkills: Record<string, number>): Record<string, number> => {
  const mappedSkills: Record<string, number> = { ...DEFAULT_SKILLS };

  Object.entries(INTELLIGENCE_SKILL_KEYS).forEach(([sourceKey, targetKey]) => {
    const rawValue = currentSkills?.[sourceKey];
    const normalizedValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    mappedSkills[targetKey] = Number.isFinite(normalizedValue) ? Math.round(Math.max(0, Math.min(100, normalizedValue))) : 0;
  });

  return mappedSkills;
};

export function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [recommendedProblems, setRecommendedProblems] = useState<any[]>([]);
  const [allProblems, setAllProblems] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [skills, setSkills] = useState<Record<string, number>>(DEFAULT_SKILLS);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'code' | 'canvas'>('all');

  useEffect(() => {
    const formatDurationMinutes = (startedAt?: string, endedAt?: string): number => {
      if (!startedAt || !endedAt) return 0;
      const start = new Date(startedAt).getTime();
      const end = new Date(endedAt).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
      return Math.max(0, (end - start) / 60000);
    };

    const fetchDashboardData = async () => {
      try {
        // En attendant que ces routes backend soient créées conformément aux spécifications
        // On effectue des requêtes réelles. Si elles échouent (404), on set des tableaux vides
        const [problemsRes, matchesRes, badgesRes] = await Promise.allSettled([
          api.get('/challenges/recommended'), // Route for upcoming FR-07
          api.get('/duels/history?limit=5'),
          api.get('/badges/user/me'),
        ]);

        if (problemsRes.status === 'fulfilled') {
          const data = problemsRes.value.data;
          // Backend may return a paginated object { data: [...] } or a plain array
          const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          setRecommendedProblems(arr.slice(0, 3));
        }

        if (matchesRes.status === 'fulfilled') {
          const data = matchesRes.value.data;
          const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          const mapped = arr.map((duel: any) => {
            const isPlayer1 = duel.player1Id === user?.id;
            const meScore = isPlayer1 ? Number(duel.player1Score || 0) : Number(duel.player2Score || 0);
            const opponentScore = isPlayer1 ? Number(duel.player2Score || 0) : Number(duel.player1Score || 0);
            const meTests = isPlayer1 ? Number(duel.player1Tests || 0) : Number(duel.player2Tests || 0);
            const opponentTests = isPlayer1 ? Number(duel.player2Tests || 0) : Number(duel.player1Tests || 0);
            const opponent = isPlayer1 ? duel.player2 : duel.player1;
            const result = duel.winnerId
              ? (duel.winnerId === user?.id ? 'win' : 'loss')
              : 'draw';

            return {
              id: duel.id,
              opponent: opponent?.username || 'Opponent',
              opponentAvatar: profileService.getPhotoUrl(opponent?.profileImage, opponent?.username || 'opponent'),
              result,
              problem: duel.challenge?.title || 'Unknown challenge',
              difficulty: duel.challenge?.difficulty || duel.difficulty || 'medium',
              score: `${meScore} - ${opponentScore}`,
              tests: `${meTests} tests • Opp ${opponentTests}`,
              duration: formatDurationMinutes(duel.startedAt, duel.endedAt),
              date: new Date(duel.createdAt).toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              }),
            };
          });

          setRecentMatches(mapped.slice(0, 3));
        }

        if (badgesRes.status === 'fulfilled') {
          const data = badgesRes.value.data;
          const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          setBadges(arr);
        }

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSkills = async () => {
      try {
        // Try the intelligence engine first so the dashboard reflects M3 scores.
        let skillsData: Record<string, number> | null = null;
        try {
          const intelligenceProfile = await profileService.getIntelligenceProfile();
          if (intelligenceProfile?.updated_skills) {
            skillsData = mapIntelligenceSkillsToDashboard(intelligenceProfile.updated_skills);
          } else if (intelligenceProfile?.current_skills) {
            skillsData = mapIntelligenceSkillsToDashboard(intelligenceProfile.current_skills);
          }
        } catch {
          // Intelligence engine unavailable — silent fallback
        }

        // Fallback: old dashboard endpoints
        if (!skillsData) {
          try {
            const mlRes = await api.get('/ml/skills');
            if (mlRes.data && mlRes.data.source === 'ml') {
              const { source, ...scores } = mlRes.data;
              skillsData = scores;
            }
          } catch {
            // ML service unavailable — silent fallback
          }
        }

        if (!skillsData) {
          try {
            const res = await api.get('/users/me/skills');
            if (res.data && typeof res.data === 'object') {
              skillsData = res.data;
            }
          } catch {
            // Heuristic endpoint unavailable — keep default skills at 0
          }
        }

        if (skillsData) {
          setSkills(skillsData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des skills:', error);
      } finally {
        setLoadingSkills(false);
      }
    };

    fetchDashboardData();
    fetchSkills();
  }, []);

  const handleViewAll = async () => {
    if (showAll) {
      setShowAll(false);
      setTypeFilter('all');
      return;
    }
    setShowAll(true);
    if (allProblems.length > 0) return; // déjà chargé
    setLoadingAll(true);
    try {
      const res = await api.get('/challenges?limit=100');
      const data = res.data;
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setAllProblems(arr);
    } catch {
      // fallback: utiliser les recommandés comme base
      setAllProblems(recommendedProblems);
    } finally {
      setLoadingAll(false);
    }
  };

  const displayedProblems = showAll ? allProblems : recommendedProblems;
  const filteredProblems = typeFilter === 'all'
    ? displayedProblems
    : displayedProblems.filter(p => (p.kind ?? p.type ?? '').toLowerCase() === typeFilter);

  return (
    <Layout>


      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome & Quick Actions */}
            <section>
              <h2 className="mb-4">{t('dashboard.welcome')}, {user?.username}! 👋</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/duel/matchmaking" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Swords className="w-8 h-8 text-[var(--brand-primary)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">{t('dashboard.quickduel')}</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      {t('dashboard.quickduel.desc')}
                    </p>
                  </div>
                </Link>

                <Link to="/problems" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--brand-secondary)]/20 to-[var(--brand-secondary)]/5 border border-[var(--brand-secondary)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Play className="w-8 h-8 text-[var(--brand-secondary)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">{t('dashboard.solo')}</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      {t('dashboard.solo.desc')}
                    </p>
                  </div>
                </Link>

                <Link to="/hackathon" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--state-info)]/20 to-[var(--state-info)]/5 border border-[var(--state-info)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Users className="w-8 h-8 text-[var(--state-info)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">{t('dashboard.hackathon')}</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      {t('dashboard.hackathon.desc')}
                    </p>
                  </div>
                </Link>
              </div>
            </section>

            {/* Recommended Problems */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2>{showAll ? 'Tous les problèmes' : t('dashboard.recommended')}</h2>
                  {showAll && (
                    <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                      <button
                        onClick={() => setTypeFilter('all')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${typeFilter === 'all' ? 'bg-[var(--brand-primary)] text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Tous ({allProblems.length})
                      </button>
                      <button
                        onClick={() => setTypeFilter('code')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${typeFilter === 'code' ? 'bg-[var(--brand-primary)] text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        Code ({allProblems.filter(p => (p.kind ?? p.type ?? '').toLowerCase() === 'code').length})
                      </button>
                      <button
                        onClick={() => setTypeFilter('canvas')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${typeFilter === 'canvas' ? 'bg-purple-500 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Canvas ({allProblems.filter(p => (p.kind ?? p.type ?? '').toLowerCase() === 'canvas').length})
                      </button>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleViewAll}>
                  {showAll ? '← Réduire' : t('dashboard.viewall')}
                </Button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center p-8"><Loader className="animate-spin text-[var(--brand-primary)]" /></div>
                ) : loadingAll ? (
                  <div className="flex items-center justify-center gap-2 p-8 text-[var(--text-muted)]">
                    <Loader className="animate-spin w-5 h-5 text-[var(--brand-primary)]" />
                    <span className="text-sm">Chargement des problèmes…</span>
                  </div>
                ) : filteredProblems.length > 0 ? (
                  filteredProblems.map((problem) => (
                    <ProblemCard
                      key={problem._id || problem.id}
                      id={problem._id || problem.id}
                      title={problem.title}
                      difficulty={problem.difficulty as any}
                      tags={problem.tags}
                      solveRate={problem.solveRate || 0}
                      avgTime={problem.avgTime || 0}
                      status={problem.status || 'new'}
                      type={problem.kind ?? problem.type}
                    />
                  ))
                ) : (
                  <div className="text-center p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] text-[var(--text-muted)]">
                    {showAll && typeFilter !== 'all'
                      ? `Aucun problème de type ${typeFilter === 'code' ? 'Code' : 'Canvas'} disponible.`
                      : 'Aucun problème recommandé pour le moment.'}
                  </div>
                )}
              </div>
            </section>

            {/* Recent Matches */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2>{t('dashboard.recent')}</h2>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    {t('dashboard.history')}
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    opponent={match.opponent}
                    opponentAvatar={match.opponentAvatar}
                    result={match.result as any}
                    problem={match.problem}
                    difficulty={match.difficulty}
                    score={match.score}
                    tests={match.tests}
                    duration={match.duration}
                    date={match.date}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={profileService.getPhotoUrl(user?.profileImage, user?.username)}
                  alt={user?.username}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full border-4 border-[var(--brand-primary)] glow"
                />
                <div className="flex-1">
                  <h3 className="mb-1">{user?.username}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-caption text-[var(--text-muted)]">
                      Elo: <span className="font-semibold text-[var(--brand-primary)]">{user?.elo}</span>
                    </span>
                  </div>
                </div>
              </div>

              <XPBar
                current={user?.xp || 0}
                max={1000 * (user?.level || 1)}
                level={user?.level || 1}
              />

              <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                <Link to="/themes">
                  <Button variant="secondary" size="sm" className="w-full">
                    <TrendingUp className="w-4 h-4" />
                    {t('dashboard.unlock')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Skills Radar */}
            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              <h3 className="mb-4">{t('dashboard.skills')}</h3>
              {loadingSkills ? (
                <div className="flex justify-center py-6">
                  <Loader className="animate-spin text-[var(--brand-primary)]" />
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(skills).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-caption text-[var(--text-secondary)]">
                          {SKILL_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-caption font-medium text-[var(--text-primary)]">
                          {Math.round(value)}%
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] transition-all duration-700"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              <div className="flex items-center justify-between mb-4">
                <h3>{t('dashboard.badges')}</h3>
                {badges.length > 0 && (
                  <Link to="/profile" className="text-xs text-[var(--brand-primary)] hover:underline">
                    View all {badges.length} →
                  </Link>
                )}
              </div>
              <BadgeGrid
                badges={badges}
                size="sm"
                limit={6}
                emptyMessage="Complete challenges to earn badges!"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}