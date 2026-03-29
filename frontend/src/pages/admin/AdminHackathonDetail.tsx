import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import {
  Play, Pause, Square, Archive, Ban, Trash2, RefreshCw,
  Users, FileText, Shield, Activity, Download, Loader,
  MessageSquare, AlertTriangle, Pencil,
} from 'lucide-react';
import { hackathonsService } from '../../services/hackathonsService';
import { Skeleton } from '../../components/ui/skeleton';

const STATUS_ACTIONS: Record<string, Array<{ label: string; target: string; icon: any; variant: string }>> = {
  draft: [{ label: 'Open Registration', target: 'lobby', icon: Play, variant: 'primary' }],
  lobby: [
    { label: 'Unpublish', target: 'draft', icon: Pause, variant: 'ghost' },
    { label: 'Start Check-in', target: 'checkin', icon: Users, variant: 'primary' },
  ],
  checkin: [{ label: 'Start Competition', target: 'active', icon: Play, variant: 'primary' }],
  active: [
    { label: 'Freeze Scoreboard', target: 'frozen', icon: Pause, variant: 'secondary' },
    { label: 'End Competition', target: 'ended', icon: Square, variant: 'primary' },
  ],
  frozen: [
    { label: 'Unfreeze', target: 'active', icon: RefreshCw, variant: 'secondary' },
    { label: 'End & Reveal', target: 'ended', icon: Square, variant: 'primary' },
  ],
  ended: [{ label: 'Archive', target: 'archived', icon: Archive, variant: 'ghost' }],
};

export function AdminHackathonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  const fetchData = async () => {
    if (!id) return;
    try {
      const [h, logs] = await Promise.all([
        hackathonsService.getById(id),
        hackathonsService.getAuditLog(id).catch(() => ({ data: [] })),
      ]);
      setHackathon(h);
      setAuditLog(Array.isArray(logs) ? logs : logs.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleTransition = async (target: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await hackathonsService.transitionStatus(id, target);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Transition failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !cancelReason.trim()) return;
    setActionLoading(true);
    try {
      await hackathonsService.cancelHackathon(id, cancelReason.trim());
      await fetchData();
      setShowCancelPrompt(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cancel failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this hackathon?')) return;
    setActionLoading(true);
    try {
      await hackathonsService.delete(id);
      navigate('/admin/hackathons');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisqualify = async (teamId: string) => {
    if (!id) return;
    const reason = prompt('Reason for disqualification:');
    if (!reason) return;
    try {
      await hackathonsService.disqualifyTeam(id, teamId, reason);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleReinstate = async (teamId: string) => {
    if (!id) return;
    try {
      await hackathonsService.reinstateTeam(id, teamId);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleAnnouncement = async () => {
    if (!id || !announcementText.trim()) return;
    try {
      await hackathonsService.create; // This will use the actual endpoint
      // Actually use the announcements endpoint
      const api = (await import('../../api/axios')).default;
      await api.post(`/hackathons/${id}/announcements`, { content: announcementText.trim(), isPinned: false });
      setAnnouncementText('');
      alert('Announcement sent!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (!id) return;
    try {
      const result = await hackathonsService.exportResults(id, format);
      if (format === 'csv') {
        const blob = new Blob([result], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hackathon-${id}.csv`;
        a.click();
      } else {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hackathon-${id}.json`;
        a.click();
      }
    } catch (err) {
      alert('Export failed');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96" /></div>
            <div className="flex gap-2"><Skeleton className="h-9 w-24 rounded-lg" /><Skeleton className="h-9 w-24 rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (<div key={i} className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4 space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-12" /></div>))}
          </div>
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-32 w-full rounded-lg" />))}
        </div>
      </AdminLayout>
    );
  }

  const actions = STATUS_ACTIONS[hackathon?.status] || [];
  const canCancel = hackathon && !['active', 'frozen', 'cancelled', 'archived'].includes(hackathon.status);
  const canDelete = hackathon && !['active', 'frozen'].includes(hackathon.status);

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{hackathon?.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant={hackathon?.status}>{hackathon?.status}</Badge>
              <span className="text-sm text-[var(--text-muted)]">
                {hackathon?.hackathonTeams?.length || 0} teams
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['draft', 'lobby'].includes(hackathon?.status) && (
              <Link to={`/admin/hackathons/${id}/edit`}>
                <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /> Edit</Button>
              </Link>
            )}
            <Link to={`/admin/hackathons/${id}/monitoring`}>
              <Button variant="ghost" size="sm"><Activity className="w-4 h-4" /> Monitor</Button>
            </Link>
            <Link to={`/admin/hackathons/${id}/clarifications`}>
              <Button variant="ghost" size="sm"><MessageSquare className="w-4 h-4" /> Q&A</Button>
            </Link>
          </div>
        </div>

        {/* Lifecycle actions */}
        <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Lifecycle Actions</h3>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button key={action.target} variant={action.variant as any} size="sm" onClick={() => handleTransition(action.target)} disabled={actionLoading}>
                <action.icon className="w-4 h-4" /> {action.label}
              </Button>
            ))}
            {canCancel && (
              <Button variant="ghost" size="sm" onClick={() => setShowCancelPrompt(true)}>
                <Ban className="w-4 h-4" /> Cancel
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={handleDelete} disabled={actionLoading}>
                <Trash2 className="w-4 h-4 text-red-500" /> Delete
              </Button>
            )}
          </div>

          {showCancelPrompt && (
            <div className="mt-3 p-3 bg-[var(--surface-2)] rounded flex gap-2">
              <input className="flex-1 px-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded text-sm" placeholder="Reason for cancellation" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
              <Button variant="primary" size="sm" onClick={handleCancel}>Confirm</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCancelPrompt(false)}>Close</Button>
            </div>
          )}
        </div>

        {/* Announcement */}
        <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Broadcast Announcement</h3>
          <div className="flex gap-2">
            <textarea className="flex-1 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded text-sm h-16" value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Type an announcement..." />
            <Button variant="primary" size="sm" onClick={handleAnnouncement}>Send</Button>
          </div>
        </div>

        {/* Teams */}
        <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Teams</h3>
          <div className="space-y-2">
            {hackathon?.hackathonTeams?.map((team: any) => (
              <div key={team.id} className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded">
                <div>
                  <span className="font-medium">{team.name}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">
                    {team.members?.length} members | {team.solvedCount || 0} solved
                  </span>
                  {team.isDisqualified && <Badge variant="default" className="ml-2">DQ</Badge>}
                  {team.isCheckedIn && <Badge variant="ongoing" className="ml-2">✓</Badge>}
                </div>
                <div className="flex gap-1">
                  {!team.isDisqualified ? (
                    <Button variant="ghost" size="sm" onClick={() => handleDisqualify(team.id)}>
                      <Shield className="w-3 h-3" /> DQ
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => handleReinstate(team.id)}>
                      <RefreshCw className="w-3 h-3" /> Reinstate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Export Results</h3>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleExport('csv')}><Download className="w-4 h-4" /> CSV</Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport('json')}><Download className="w-4 h-4" /> JSON</Button>
          </div>
        </div>

        {/* Audit log */}
        <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Audit Log</h3>
          {auditLog.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No audit entries yet</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {auditLog.map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-3 text-sm py-1">
                  <span className="text-[var(--text-muted)] text-xs">{new Date(entry.createdAt).toLocaleString()}</span>
                  <Badge variant="default">{entry.action}</Badge>
                  <span className="text-[var(--text-secondary)]">{entry.actorId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
