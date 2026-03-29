import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Layout } from '../components/Layout';
import { Trophy, TrendingUp, Medal, Loader } from 'lucide-react';
import { leaderboardService } from '../services/leaderboardService';
import { profileService } from '../services/profileService';

type LeaderboardTab = 'global' | 'monthly' | 'language';

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  elo: number;
  duelsWon: number;
  duelsLost: number;
  duelsTotal: number;
  winRate: number;
  isCurrentUser?: boolean;
}

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  useEffect(() => {
    leaderboardService.getLanguages().then(res => {
      setLanguages(res.languages || []);
      if (res.languages?.length > 0) setSelectedLanguage(res.languages[0]);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const langParam = activeTab === 'language' && selectedLanguage ? selectedLanguage : undefined;
        // if sorting by language, winRate makes more sense for W/L ratios
        const sortParam = langParam ? 'winRate' : 'elo';

        const [leaderboardRes, myRankRes] = await Promise.allSettled([
          leaderboardService.getGlobal({ sort: sortParam, limit: 50, language: langParam }),
          leaderboardService.getMyRank(),
        ]);

        if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value?.data?.length) {
          setEntries(leaderboardRes.value.data.map((u: any, i: number) => ({
            rank: i + 1,
            username: u.username,
            avatar: profileService.getPhotoUrl(u.profileImage, u.username),
            elo: u.elo || 0,
            duelsWon: u.duelsWon || 0,
            duelsLost: u.duelsLost || 0,
            duelsTotal: u.duelsTotal || 0,
            winRate: u.winRate || 0,
          })));
        }

        if (myRankRes.status === 'fulfilled' && myRankRes.value) {
          setMyRank({
            rank: myRankRes.value.rank || 0,
            username: myRankRes.value.username,
            avatar: profileService.getPhotoUrl(myRankRes.value.profileImage, myRankRes.value.username),
            elo: myRankRes.value.elo || 0,
            duelsWon: myRankRes.value.duelsWon || 0,
            duelsLost: myRankRes.value.duelsLost || 0,
            duelsTotal: myRankRes.value.duelsTotal || 0,
            winRate: myRankRes.value.winRate || 0,
            isCurrentUser: true,
          });
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [activeTab, selectedLanguage]);

  const currentUserEntry = myRank || entries.find(e => e.isCurrentUser);

  return (
    <Layout>
      <Navbar />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="mb-2">Leaderboard</h1>
              <p className="text-[var(--text-secondary)]">
                The best developers on ByteBattle
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border-default)] overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabButton
                active={activeTab === 'global'}
                onClick={() => setActiveTab('global')}
              >
                Global
              </TabButton>
              <TabButton
                active={activeTab === 'monthly'}
                onClick={() => setActiveTab('monthly')}
              >
                This Month
              </TabButton>
              <TabButton
                active={activeTab === 'language'}
                onClick={() => setActiveTab('language')}
              >
                By Language
              </TabButton>
            </div>

            {/* Language Filter */}
            {activeTab === 'language' && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="text-[var(--text-secondary)]">Language:</span>
                <select
                  className="px-4 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang} style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-primary)' }}>{lang}</option>
                  ))}
                  {languages.length === 0 && <option value="" style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-primary)' }}>No data</option>}
                </select>
              </div>
            )}

            {/* Current User Card */}
            {currentUserEntry && (
              <div className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-secondary)]/10 border border-[var(--brand-primary)]/30 rounded-[var(--radius-lg)]">
                <p className="text-caption text-[var(--text-muted)] mb-3">Your Position</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-[var(--brand-primary)]/20 rounded-full">
                      <span className="font-semibold text-[var(--brand-primary)]">
                        #{currentUserEntry.rank}
                      </span>
                    </div>
                    <img
                      src={currentUserEntry.avatar}
                      alt={currentUserEntry.username}
                      className="w-12 h-12 rounded-full border-2 border-[var(--brand-primary)]"
                    />
                    <div>
                      <h3>{currentUserEntry.username}</h3>
                      <p className="text-caption text-[var(--text-muted)]">
                        {currentUserEntry.duelsWon}W / {currentUserEntry.duelsLost}L - {currentUserEntry.winRate.toFixed(1)}% WR
                      </p>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--brand-primary)]" />
                    <span className="text-h2 font-semibold text-[var(--brand-primary)]">
                      {currentUserEntry.elo}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {entries.slice(0, 3).map((entry, index) => (
                <PodiumCard
                  key={entry.rank}
                  rank={entry.rank}
                  username={entry.username}
                  avatar={entry.avatar}
                  elo={entry.elo}
                  wins={entry.duelsWon}
                  losses={entry.duelsLost}
                  highlight={index === 0}
                />
              ))}
            </div>

            {/* Full Leaderboard Table */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--surface-2)]">
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-[var(--text-primary)]">
                      Rang
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-[var(--text-primary)]">
                      Joueur
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right font-semibold text-[var(--text-primary)]">
                      Elo
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right font-semibold text-[var(--text-primary)] hidden sm:table-cell">
                      Victoires
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right font-semibold text-[var(--text-primary)] hidden sm:table-cell">
                      Défaites
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right font-semibold text-[var(--text-primary)]">
                      Win Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-[var(--text-muted)]">
                        {activeTab === 'language' && languages.length === 0
                          ? "No language data available yet."
                          : "No players found"}
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr
                        key={entry.rank}
                        className={`
                      border-b border-[var(--border-default)]
                      hover:bg-[var(--surface-2)]
                      transition-colors
                      ${entry.isCurrentUser ? 'bg-[var(--brand-primary)]/5' : ''}
                    `}
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2">
                            {entry.rank <= 3 && (
                              <Trophy
                                className={`w-5 h-5 ${entry.rank === 1 ? 'text-[var(--brand-secondary)]' :
                                  entry.rank === 2 ? 'text-gray-400' :
                                    'text-orange-400'
                                  }`}
                              />
                            )}
                            <span className="font-semibold text-[var(--text-primary)]">
                              #{entry.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <img
                              src={entry.avatar}
                              alt={entry.username}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[var(--border-default)]"
                            />
                            <span className="font-medium text-[var(--text-primary)] truncate max-w-[120px] sm:max-w-none">
                              {entry.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                          <span className="font-semibold text-[var(--brand-primary)]">
                            {entry.elo}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[var(--state-success)] hidden sm:table-cell">
                          {entry.duelsWon}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[var(--state-error)] hidden sm:table-cell">
                          {entry.duelsLost}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[var(--text-secondary)]">
                          {entry.winRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 text-[0.875rem] font-medium
        border-b-2 transition-colors
        ${active
          ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }
      `}
    >
      {children}
    </button>
  );
}

function PodiumCard({
  rank,
  username,
  avatar,
  elo,
  wins,
  losses,
  highlight
}: {
  rank: number;
  username: string;
  avatar: string;
  elo: number;
  wins: number;
  losses: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        p-6 rounded-[var(--radius-lg)] text-center
        ${highlight
          ? 'bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-secondary)]/20 border-2 border-[var(--brand-primary)] glow'
          : 'bg-[var(--surface-1)] border border-[var(--border-default)]'
        }
      `}
    >
      <div className="mb-4">
        {rank === 1 ? (
          <Medal className="w-12 h-12 mx-auto text-[var(--brand-secondary)]" />
        ) : rank === 2 ? (
          <Medal className="w-10 h-10 mx-auto text-gray-400" />
        ) : (
          <Medal className="w-10 h-10 mx-auto text-orange-400" />
        )}
      </div>

      <img
        src={avatar}
        alt={username}
        className={`
          mx-auto mb-3 rounded-full
          ${highlight
            ? 'w-20 h-20 border-4 border-[var(--brand-primary)]'
            : 'w-16 h-16 border-2 border-[var(--border-default)]'
          }
        `}
      />

      <h3 className="mb-1">{username}</h3>
      <p className="text-h2 font-semibold text-[var(--brand-primary)] mb-2">
        {elo}
      </p>
      <p className="text-caption text-[var(--text-muted)]">
        {wins}W / {losses}L
      </p>
    </div>
  );
}