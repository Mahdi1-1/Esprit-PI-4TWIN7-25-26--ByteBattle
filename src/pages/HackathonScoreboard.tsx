import { useState } from 'react';
import { useParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Badge } from '../components/Badge';
import { Timer } from '../components/Timer';
import { mockUser, mockScoreboard, mockHackathons } from '../data/mockData';
import { Trophy, Flame, AlertTriangle } from 'lucide-react';

export function HackathonScoreboard() {
  const { id } = useParams();
  const hackathon = mockHackathons.find(h => h.id === id);
  const [filter, setFilter] = useState<'all' | 'top10' | 'myteam'>('all');

  if (!hackathon) {
    return <div>Hackathon not found</div>;
  }

  const isFrozen = hackathon.frozenTime && new Date() > hackathon.frozenTime;
  const filteredScoreboard = filter === 'top10' 
    ? mockScoreboard.slice(0, 10)
    : mockScoreboard;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar 
        isLoggedIn 
        userAvatar={mockUser.avatar} 
        username={mockUser.username} 
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="mb-2">{hackathon.name}</h1>
              <div className="flex items-center gap-4">
                <Badge variant={hackathon.status}>
                  {hackathon.status === 'ongoing' ? 'ONGOING' : 'FINISHED'}
                </Badge>
                {hackathon.status === 'ongoing' && (
                  <Timer endTime={hackathon.endTime} />
                )}
              </div>
            </div>
          </div>

          {/* Freeze Banner */}
          {isFrozen && (
            <div className="p-4 mb-4 bg-[var(--state-warning)]/10 border border-[var(--state-warning)]/20 rounded-[var(--radius-md)] flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[var(--state-warning)]" />
              <div>
                <p className="font-semibold text-[var(--state-warning)]">
                  SCOREBOARD FROZEN
                </p>
                <p className="text-caption text-[var(--text-muted)]">
                  Results are frozen until the end of the competition
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`
                px-4 py-2 rounded-[var(--radius-md)] text-[0.875rem] font-medium transition-colors
                ${filter === 'all'
                  ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)]'
                  : 'bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                }
              `}
            >
              All Teams
            </button>
            <button
              onClick={() => setFilter('top10')}
              className={`
                px-4 py-2 rounded-[var(--radius-md)] text-[0.875rem] font-medium transition-colors
                ${filter === 'top10'
                  ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)]'
                  : 'bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                }
              `}
            >
              Top 10
            </button>
          </div>
        </div>

        {/* Scoreboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[var(--border-strong)] bg-[var(--surface-1)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)]">
                  Rank
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)]">
                  Team
                </th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--text-primary)]">
                  Solved
                </th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--text-primary)]">
                  Penalty
                </th>
                {['A', 'B', 'C', 'D', 'E', 'F'].map((problem) => (
                  <th
                    key={problem}
                    className="px-4 py-3 text-center font-semibold text-[var(--text-primary)]"
                  >
                    {problem}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredScoreboard.map((entry) => (
                <tr
                  key={entry.rank}
                  className="border-b border-[var(--border-default)] hover:bg-[var(--surface-1)] transition-colors"
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {entry.rank === 1 && (
                        <Trophy className="w-5 h-5 text-[var(--brand-secondary)]" />
                      )}
                      <span className="font-semibold text-[var(--text-primary)]">
                        #{entry.rank}
                      </span>
                    </div>
                  </td>

                  {/* Team */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={entry.logo}
                        alt={entry.team}
                        className="w-8 h-8 rounded-full border border-[var(--border-default)]"
                      />
                      <span className="font-medium text-[var(--text-primary)]">
                        {entry.team}
                      </span>
                    </div>
                  </td>

                  {/* Solved */}
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-[var(--state-success)]">
                      {entry.solved}
                    </span>
                  </td>

                  {/* Penalty */}
                  <td className="px-4 py-3 text-center font-code text-[var(--text-secondary)]">
                    {entry.penalty}
                  </td>

                  {/* Problems */}
                  {Object.entries(entry.problems).map(([problem, data]: [string, any]) => (
                    <td key={problem} className="px-4 py-3">
                      <ProblemCell {...data} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Feed */}
        <div className="mt-8 p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
          <h3 className="mb-4">Live Activity</h3>
          <div className="space-y-2">
            <LiveFeedItem
              type="solve"
              message="Team Nova solved C"
              time="12:45"
              isFirstBlood
            />
            <LiveFeedItem
              type="clarification"
              message="Clarification: input format updated for Problem B"
              time="12:38"
            />
            <LiveFeedItem
              type="solve"
              message="Code Warriors solved E"
              time="12:34"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemCell({ 
  status, 
  time, 
  attempts, 
  firstBlood 
}: { 
  status: 'solved' | 'attempted' | 'unattempted';
  time: number;
  attempts: number;
  firstBlood: boolean;
}) {
  if (status === 'unattempted') {
    return (
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 rounded bg-[var(--surface-2)]" />
      </div>
    );
  }

  if (status === 'attempted') {
    return (
      <div className="flex items-center justify-center">
        <div className="px-2 py-1 bg-[var(--state-error)]/10 text-[var(--state-error)] rounded text-caption font-code">
          -{attempts}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className={`
        px-2 py-1 rounded text-caption font-code font-medium
        ${firstBlood 
          ? 'bg-[var(--brand-secondary)]/20 text-[var(--brand-secondary)] border border-[var(--brand-secondary)]/30' 
          : 'bg-[var(--state-success)]/10 text-[var(--state-success)]'
        }
      `}>
        <div className="flex items-center gap-1">
          {firstBlood && <Flame className="w-3 h-3" />}
          <span>{time}</span>
          {attempts > 1 && <span className="opacity-75">({attempts})</span>}
        </div>
      </div>
    </div>
  );
}

function LiveFeedItem({ 
  type, 
  message, 
  time, 
  isFirstBlood 
}: { 
  type: 'solve' | 'clarification' | 'announcement';
  message: string;
  time: string;
  isFirstBlood?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
      <span className="text-caption font-code text-[var(--text-muted)]">{time}</span>
      <div className="flex-1">
        <p className="text-[var(--text-primary)]">
          {message}
          {isFirstBlood && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)] rounded text-caption font-medium">
              <Flame className="w-3 h-3" />
              First Blood
            </span>
          )}
        </p>
      </div>
    </div>
  );
}