import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Layout } from '../components/Layout';
import { Badge } from '../components/Badge';
import { Loader, Trophy, Medal, Award } from 'lucide-react';
import { hackathonsService } from '../services/hackathonsService';
import { HackathonPageSkeleton, HackathonError } from '../components/HackathonSkeletons';

export function HackathonResults() {
  const { id } = useParams<{ id: string }>();
  const [scoreboard, setScoreboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    hackathonsService.getScoreboard(id)
      .then(setScoreboard)
      .catch(() => setError('Failed to load results'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <HackathonPageSkeleton />;

  if (error || !scoreboard) {
    return (
      <HackathonError
        title={error ? 'Error' : 'Results not available'}
        message={error || 'The results for this hackathon are not available yet.'}
        onRetry={() => {
          setLoading(true);
          setError(null);
          hackathonsService.getScoreboard(id!).then(setScoreboard).catch(() => setError('Failed to load')).finally(() => setLoading(false));
        }}
      />
    );
  }

  const podiumIcons = [Trophy, Medal, Award];

  return (
    <Layout>
      <Navbar />
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2">🏆 Final Results</h1>
          <p className="text-[var(--text-secondary)]">{scoreboard.title}</p>
        </div>

        {/* Podium */}
        <div className="flex justify-center gap-6 mb-12">
          {scoreboard.rows.slice(0, 3).map((row: any, i: number) => {
            const Icon = podiumIcons[i] || Trophy;
            const heights = ['h-40', 'h-32', 'h-28'];
            const colors = ['text-yellow-500', 'text-gray-400', 'text-orange-600'];
            return (
              <div key={row.teamId} className="text-center">
                <Icon className={`w-8 h-8 mx-auto mb-2 ${colors[i]}`} />
                <div className={`w-32 ${heights[i]} bg-[var(--surface-1)] border border-[var(--border-default)] rounded-t-lg flex flex-col items-center justify-end pb-3`}>
                  <span className="font-bold text-2xl text-[var(--text-primary)]">#{row.rank}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] mt-1 truncate px-2">{row.teamName}</span>
                  <span className="text-xs text-[var(--text-muted)]">{row.solved} solved • {row.penalty} penalty</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full results table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="py-3 px-4 text-left text-[var(--text-muted)]">#</th>
                <th className="py-3 px-4 text-left text-[var(--text-muted)]">Team</th>
                <th className="py-3 px-4 text-center text-[var(--text-muted)]">Solved</th>
                <th className="py-3 px-4 text-center text-[var(--text-muted)]">Penalty</th>
                {scoreboard.challengeIds?.map((_: string, i: number) => (
                  <th key={i} className="py-3 px-4 text-center text-[var(--text-muted)]">
                    {String.fromCharCode(65 + i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scoreboard.rows.map((row: any) => (
                <tr key={row.teamId} className="border-b border-[var(--border-default)] hover:bg-[var(--surface-1)]">
                  <td className="py-3 px-4 font-bold text-[var(--text-primary)]">{row.rank}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-[var(--text-primary)]">{row.teamName}</span>
                    <span className="block text-xs text-[var(--text-muted)]">
                      {row.members?.map((m: any) => m.userId).join(', ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-[var(--text-primary)]">{row.solved}</td>
                  <td className="py-3 px-4 text-center text-[var(--text-muted)]">{row.penalty}</td>
                  {scoreboard.challengeIds?.map((cId: string, i: number) => {
                    const p = row.problems?.[cId];
                    if (!p || p.status === 'unattempted') {
                      return <td key={i} className="py-3 px-4 text-center text-[var(--text-muted)]">—</td>;
                    }
                    if (p.status === 'solved') {
                      return (
                        <td key={i} className="py-3 px-4 text-center">
                          <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${p.isFirstBlood ? 'bg-green-800 text-green-200' : 'bg-green-500/20 text-green-500'}`}>
                            +{p.attempts > 1 ? p.attempts : ''} ({p.time})
                            {p.isFirstBlood && ' 🩸'}
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={i} className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-500">
                          -{p.attempts}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center">
          <Link to="/hackathon" className="text-[var(--brand-primary)] hover:underline">
            ← Back to Hackathons
          </Link>
        </div>
      </div>
    </Layout>
  );
}
