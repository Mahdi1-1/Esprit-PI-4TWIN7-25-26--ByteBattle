import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CountdownTimer } from '../components/Timer';
import { Layout } from '../components/Layout';
import { Users, Copy, Check, LogOut, Loader, UserPlus } from 'lucide-react';
import { hackathonsService } from '../services/hackathonsService';
import { HackathonPageSkeleton, HackathonError } from '../components/HackathonSkeletons';

export function HackathonLobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const data = await hackathonsService.getById(id);
        setHackathon(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load hackathon');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const myTeam = useMemo(() => {
    if (!hackathon?.hackathonTeams) return null;
    const userId = localStorage.getItem('userId');
    return hackathon.hackathonTeams.find((t: any) =>
      t.members.some((m: any) => m.userId === userId),
    );
  }, [hackathon]);

  const handleCreateTeam = async () => {
    if (!id || !teamName.trim()) return;
    setActionLoading(true);
    try {
      await hackathonsService.createTeam(id, teamName.trim());
      const data = await hackathonsService.getById(id);
      setHackathon(data);
      setTeamName('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create team');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!id || !joinCode.trim()) return;
    setActionLoading(true);
    try {
      await hackathonsService.joinTeamByCode(id, joinCode.trim());
      const data = await hackathonsService.getById(id);
      setHackathon(data);
      setJoinCode('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join team');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinSolo = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await hackathonsService.joinSolo(id);
      const data = await hackathonsService.getById(id);
      setHackathon(data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join solo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!id || !myTeam) return;
    setActionLoading(true);
    try {
      await hackathonsService.checkinTeam(id, myTeam.id);
      const data = await hackathonsService.getById(id);
      setHackathon(data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!id || !myTeam) return;
    setActionLoading(true);
    try {
      await hackathonsService.leaveTeam(id, myTeam.id);
      const data = await hackathonsService.getById(id);
      setHackathon(data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to leave team');
    } finally {
      setActionLoading(false);
    }
  };

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (loading) return <HackathonPageSkeleton />;

  if (error || !hackathon) {
    return (
      <HackathonError
        title={error ? 'Error' : 'Hackathon not found'}
        message={error || 'The hackathon you are looking for does not exist.'}
        onRetry={() => {
          setLoading(true);
          setError(null);
          hackathonsService.getById(id!).then(setHackathon).catch(() => setError('Failed to load')).finally(() => setLoading(false));
        }}
      />
    );
  }

  const teamPolicy = hackathon.teamPolicy as any;
  const canJoinSolo = !teamPolicy || teamPolicy.minSize <= 1;
  const isCaptain = myTeam?.members?.[0]?.role === 'captain';
  const isCheckinPhase = hackathon.status === 'checkin';

  return (
    <Layout>
      <Navbar />
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1>{hackathon.title}</h1>
            <Badge variant={hackathon.status}>{hackathon.status}</Badge>
          </div>
          {hackathon.description && (
            <p className="text-[var(--text-secondary)] mb-4">{hackathon.description}</p>
          )}
          <div className="flex items-center gap-4 text-caption text-[var(--text-muted)]">
            <span>Start: {new Date(hackathon.startTime).toLocaleString()}</span>
            <span>End: {new Date(hackathon.endTime).toLocaleString()}</span>
          </div>
        </div>

        {/* Countdown */}
        <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] mb-6">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-medium">Starts in:</span>
            <CountdownTimer targetDate={hackathon.startTime} />
          </div>
        </div>

        {/* Team Policy */}
        {teamPolicy && (
          <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] mb-6 text-caption text-[var(--text-secondary)]">
            Team size: {teamPolicy.minSize}–{teamPolicy.maxSize} members
          </div>
        )}

        {/* Not in a team — show join options */}
        {!myTeam && (
          <div className="space-y-6">
            {/* Create team */}
            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              <h3 className="mb-4">Create a Team</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                  placeholder="Team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                <Button variant="primary" onClick={handleCreateTeam} disabled={actionLoading}>
                  <UserPlus className="w-4 h-4" /> Create
                </Button>
              </div>
            </div>

            {/* Join by code */}
            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              <h3 className="mb-4">Join by Code</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] uppercase tracking-widest font-mono"
                  placeholder="ABCDEF"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
                <Button variant="secondary" onClick={handleJoinByCode} disabled={actionLoading}>
                  Join
                </Button>
              </div>
            </div>

            {/* Solo join */}
            {canJoinSolo && (
              <div className="text-center">
                <Button variant="ghost" onClick={handleJoinSolo} disabled={actionLoading}>
                  Join Solo
                </Button>
              </div>
            )}
          </div>
        )}

        {/* In a team — show team roster */}
        {myTeam && (
          <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
            <div className="flex items-center justify-between mb-4">
              <h3>Your Team: {myTeam.name}</h3>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm bg-[var(--surface-2)] px-3 py-1 rounded">
                  {myTeam.joinCode}
                </span>
                <button onClick={() => copyJoinCode(myTeam.joinCode)} className="p-1 hover:text-[var(--brand-primary)]">
                  {codeCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Members */}
            <div className="space-y-2 mb-4">
              {myTeam.members.map((m: any) => (
                <div key={m.userId} className="flex items-center justify-between py-2 px-3 bg-[var(--surface-2)] rounded">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{m.userId}</span>
                    {m.role === 'captain' && <Badge variant="ongoing">Captain</Badge>}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isCheckinPhase && isCaptain && !myTeam.isCheckedIn && (
                <Button variant="primary" onClick={handleCheckin} disabled={actionLoading}>
                  <Check className="w-4 h-4" /> Check In
                </Button>
              )}
              {myTeam.isCheckedIn && (
                <Badge variant="ongoing">✓ Checked In</Badge>
              )}
              <Button variant="ghost" onClick={handleLeaveTeam} disabled={actionLoading}>
                <LogOut className="w-4 h-4" /> Leave Team
              </Button>
            </div>
          </div>
        )}

        {/* All teams */}
        {hackathon.hackathonTeams?.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4">All Teams ({hackathon.hackathonTeams.length})</h3>
            <div className="space-y-2">
              {hackathon.hackathonTeams.map((team: any) => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)]">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{team.name}</span>
                    <span className="text-caption text-[var(--text-muted)]">
                      {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {team.isCheckedIn && <Badge variant="ongoing">Checked In</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
