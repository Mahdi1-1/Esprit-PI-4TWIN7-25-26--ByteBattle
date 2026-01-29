import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { mockUser, mockLeaderboard } from '../data/mockData';
import { Trophy, TrendingUp, Medal } from 'lucide-react';

type LeaderboardTab = 'global' | 'monthly' | 'language';

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');

  const currentUserEntry = mockLeaderboard.find(e => e.isCurrentUser);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar 
        isLoggedIn 
        userAvatar={mockUser.avatar} 
        username={mockUser.username} 
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Classement</h1>
          <p className="text-[var(--text-secondary)]">
            Les meilleurs développeurs de ByteBattle
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--border-default)]">
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
            Ce Mois
          </TabButton>
          <TabButton
            active={activeTab === 'language'}
            onClick={() => setActiveTab('language')}
          >
            Par Langage
          </TabButton>
        </div>

        {/* Current User Card */}
        {currentUserEntry && (
          <div className="mb-6 p-6 bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-secondary)]/10 border border-[var(--brand-primary)]/30 rounded-[var(--radius-lg)]">
            <p className="text-caption text-[var(--text-muted)] mb-3">Votre Position</p>
            <div className="flex items-center gap-6">
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
                    {currentUserEntry.wins}W / {currentUserEntry.losses}L
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
          {mockLeaderboard.slice(0, 3).map((entry, index) => (
            <PodiumCard
              key={entry.rank}
              rank={entry.rank}
              username={entry.username}
              avatar={entry.avatar}
              elo={entry.elo}
              wins={entry.wins}
              losses={entry.losses}
              highlight={index === 0}
            />
          ))}
        </div>

        {/* Full Leaderboard Table */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--surface-2)]">
                <th className="px-6 py-4 text-left font-semibold text-[var(--text-primary)]">
                  Rang
                </th>
                <th className="px-6 py-4 text-left font-semibold text-[var(--text-primary)]">
                  Joueur
                </th>
                <th className="px-6 py-4 text-right font-semibold text-[var(--text-primary)]">
                  Elo
                </th>
                <th className="px-6 py-4 text-right font-semibold text-[var(--text-primary)]">
                  Victoires
                </th>
                <th className="px-6 py-4 text-right font-semibold text-[var(--text-primary)]">
                  Défaites
                </th>
                <th className="px-6 py-4 text-right font-semibold text-[var(--text-primary)]">
                  Win Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboard.map((entry) => (
                <tr
                  key={entry.rank}
                  className={`
                    border-b border-[var(--border-default)] 
                    hover:bg-[var(--surface-2)] 
                    transition-colors
                    ${entry.isCurrentUser ? 'bg-[var(--brand-primary)]/5' : ''}
                  `}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {entry.rank <= 3 && (
                        <Trophy
                          className={`w-5 h-5 ${
                            entry.rank === 1 ? 'text-[var(--brand-secondary)]' :
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={entry.avatar}
                        alt={entry.username}
                        className="w-10 h-10 rounded-full border border-[var(--border-default)]"
                      />
                      <span className="font-medium text-[var(--text-primary)]">
                        {entry.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-[var(--brand-primary)]">
                      {entry.elo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[var(--state-success)]">
                    {entry.wins}
                  </td>
                  <td className="px-6 py-4 text-right text-[var(--state-error)]">
                    {entry.losses}
                  </td>
                  <td className="px-6 py-4 text-right text-[var(--text-secondary)]">
                    {Math.round((entry.wins / (entry.wins + entry.losses)) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
