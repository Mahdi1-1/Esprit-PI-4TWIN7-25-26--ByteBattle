import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Badge } from '../../components/Badge';
import { Loader, Activity, BarChart3 } from 'lucide-react';
import { hackathonsService } from '../../services/hackathonsService';
import { Skeleton } from '../../components/ui/skeleton';

export function AdminHackathonMonitoring() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    try {
      const result = await hackathonsService.getMonitoring(id);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3"><Skeleton className="h-6 w-6 rounded" /><Skeleton className="h-7 w-48" /></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (<div key={i} className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4 space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-16" /></div>))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-[var(--brand-primary)]" />
          <h1 className="text-2xl font-bold">Real-time Monitoring</h1>
          <Badge variant={data?.status}>{data?.status}</Badge>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Submissions', value: data?.totalSubmissions },
            { label: 'Acceptance Rate', value: data?.acceptanceRate },
            { label: 'Active Teams', value: `${data?.activeTeams}/${data?.totalTeams}` },
            { label: 'Idle Teams', value: data?.idleTeams },
          ].map((stat) => (
            <div key={stat.label} className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
              <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value ?? '—'}</p>
            </div>
          ))}
        </div>

        {/* Problems solved distribution */}
        {data?.problemsSolvedDistribution && (
          <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Problems Solved Distribution
            </h3>
            <div className="flex items-end gap-4 h-32">
              {Object.entries(data.problemsSolvedDistribution).map(([cId, count]: [string, any], i) => (
                <div key={cId} className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 bg-[var(--brand-primary)] rounded-t"
                    style={{ height: `${Math.max(4, (count / data.totalTeams) * 100)}%` }}
                  />
                  <span className="text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                  <span className="text-xs text-[var(--text-muted)]">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team activity */}
        <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Team Activity</h3>
          <div className="grid grid-cols-3 gap-2">
            {data?.teamActivity?.map((team: any) => (
              <div key={team.teamId} className={`p-2 rounded text-sm flex items-center justify-between ${team.isActive ? 'bg-green-500/10' : 'bg-[var(--surface-2)]'}`}>
                <span className="font-medium truncate">{team.teamName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">{team.solvedCount} solved</span>
                  <div className={`w-2 h-2 rounded-full ${team.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent submissions feed */}
        <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Recent Submissions</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {data?.recentSubmissions?.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 text-sm py-1 px-2 hover:bg-[var(--surface-2)] rounded">
                <span className="text-xs text-[var(--text-muted)]">{new Date(s.submittedAt).toLocaleTimeString()}</span>
                <Badge variant={s.verdict === 'AC' ? 'ACCEPTED' : 'default'}>{s.verdict}</Badge>
                <span className="text-[var(--text-secondary)]">{s.language}</span>
                <span className="text-[var(--text-muted)]">Team: {s.teamId.slice(-6)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
