import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CountdownTimer } from '../components/Timer';
import { Layout } from '../components/Layout';
import { Users, Calendar, Trophy, Play, Loader } from 'lucide-react';
import { hackathonsService } from '../services/hackathonsService';
import { teamsService } from '../services/teamsService';
import { useAuth } from '../context/AuthContext';

type UserTeam = {
  id: string;
  name: string;
  ownerId: string;
};

export function Hackathon() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [myTeams, setMyTeams] = useState<UserTeam[]>([]);
  const [selectedTeamByHackathon, setSelectedTeamByHackathon] = useState<Record<string, string>>({});
  const [registeringHackathonId, setRegisteringHackathonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHackathons = async () => {
    try {
      const [hackathonRes, myTeamsRes] = await Promise.all([
        hackathonsService.getAll(),
        teamsService.getMine(),
      ]);

      if (hackathonRes?.data?.length) {
        setHackathons(hackathonRes.data);
      } else {
        setHackathons([]);
      }

      setMyTeams(Array.isArray(myTeamsRes) ? myTeamsRes : []);
    } catch (err) {
      console.error('Failed to load hackathons:', err);
      setMyTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  const ongoingHackathons = hackathons.filter(h => ['active', 'frozen'].includes(h.status));
  const lobbyHackathons = hackathons.filter(h => h.status === 'lobby');
  const checkinHackathons = hackathons.filter(h => h.status === 'checkin');
  const upcomingHackathons = hackathons.filter(h => h.status === 'draft');
  const finishedHackathons = hackathons.filter(h => ['ended', 'archived'].includes(h.status));
  const cancelledHackathons = hackathons.filter(h => h.status === 'cancelled');
  const captainTeams = myTeams.filter((team) => team.ownerId === user?.id);

  const registerTeamToHackathon = async (hackathonId: string) => {
    const selectedTeamId = selectedTeamByHackathon[hackathonId] || captainTeams[0]?.id;
    if (!selectedTeamId) {
      return;
    }

    setRegisteringHackathonId(hackathonId);
    try {
      await teamsService.registerToHackathon(selectedTeamId, hackathonId);
      await fetchHackathons();
    } catch (err: any) {
      console.error('Failed to register team', err?.response?.data?.message || err?.message || err);
    } finally {
      setRegisteringHackathonId(null);
    }
  };

  return (
    <Layout>


      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="mb-2">Hackathons</h1>
              <p className="text-[var(--text-secondary)]">
                Team competitions ICPC-style with real-time scoreboard
              </p>
            </div>

            {/* Ongoing Hackathons */}
            {ongoingHackathons.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4">🔴 Ongoing</h2>
                <div className="space-y-4">
                  {ongoingHackathons.map((hackathon) => (
                    <HackathonCard
                      key={hackathon.id}
                      hackathon={hackathon}
                      currentUserId={user?.id}
                      captainTeams={captainTeams}
                      selectedTeamId={selectedTeamByHackathon[hackathon.id] || captainTeams[0]?.id || ''}
                      onTeamChange={(teamId) =>
                        setSelectedTeamByHackathon((prev) => ({ ...prev, [hackathon.id]: teamId }))
                      }
                      onRegister={() => registerTeamToHackathon(hackathon.id)}
                      isRegistering={registeringHackathonId === hackathon.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Registration Open */}
            {lobbyHackathons.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4">📝 Registration Open</h2>
                <div className="space-y-4">
                  {lobbyHackathons.map((hackathon) => (
                    <HackathonCard
                      key={hackathon.id}
                      hackathon={hackathon}
                      currentUserId={user?.id}
                      captainTeams={captainTeams}
                      selectedTeamId={selectedTeamByHackathon[hackathon.id] || captainTeams[0]?.id || ''}
                      onTeamChange={(teamId) =>
                        setSelectedTeamByHackathon((prev) => ({ ...prev, [hackathon.id]: teamId }))
                      }
                      onRegister={() => registerTeamToHackathon(hackathon.id)}
                      isRegistering={registeringHackathonId === hackathon.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Check-in Phase */}
            {checkinHackathons.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4">✅ Check-in</h2>
                <div className="space-y-4">
                  {checkinHackathons.map((hackathon) => (
                    <HackathonCard
                      key={hackathon.id}
                      hackathon={hackathon}
                      currentUserId={user?.id}
                      captainTeams={captainTeams}
                      selectedTeamId={selectedTeamByHackathon[hackathon.id] || captainTeams[0]?.id || ''}
                      onTeamChange={(teamId) =>
                        setSelectedTeamByHackathon((prev) => ({ ...prev, [hackathon.id]: teamId }))
                      }
                      onRegister={() => registerTeamToHackathon(hackathon.id)}
                      isRegistering={registeringHackathonId === hackathon.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Hackathons */}
            <section className="mb-8">
              <h2 className="mb-4">Upcoming</h2>
              {upcomingHackathons.length > 0 ? (
                <div className="space-y-4">
                  {upcomingHackathons.map((hackathon) => (
                    <HackathonCard
                      key={hackathon.id}
                      hackathon={hackathon}
                      currentUserId={user?.id}
                      captainTeams={captainTeams}
                      selectedTeamId={selectedTeamByHackathon[hackathon.id] || captainTeams[0]?.id || ''}
                      onTeamChange={(teamId) =>
                        setSelectedTeamByHackathon((prev) => ({ ...prev, [hackathon.id]: teamId }))
                      }
                      onRegister={() => registerTeamToHackathon(hackathon.id)}
                      isRegistering={registeringHackathonId === hackathon.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                  <p className="text-[var(--text-muted)]">
                    No upcoming hackathons at the moment
                  </p>
                </div>
              )}
            </section>

            {/* Past Hackathons */}
            {finishedHackathons.length > 0 && (
              <section>
                <h2 className="mb-4">Finished</h2>
                <div className="space-y-4">
                  {finishedHackathons.map((hackathon) => (
                    <HackathonCard
                      key={hackathon.id}
                      hackathon={hackathon}
                      currentUserId={user?.id}
                      captainTeams={captainTeams}
                      selectedTeamId={selectedTeamByHackathon[hackathon.id] || captainTeams[0]?.id || ''}
                      onTeamChange={(teamId) =>
                        setSelectedTeamByHackathon((prev) => ({ ...prev, [hackathon.id]: teamId }))
                      }
                      onRegister={() => registerTeamToHackathon(hackathon.id)}
                      isRegistering={registeringHackathonId === hackathon.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {cancelledHackathons.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-4">Cancelled</h2>
                <div className="space-y-4">
                  {cancelledHackathons.map((hackathon) => (
                    <HackathonCard
                      key={hackathon.id}
                      hackathon={hackathon}
                      currentUserId={user?.id}
                      captainTeams={captainTeams}
                      selectedTeamId={selectedTeamByHackathon[hackathon.id] || captainTeams[0]?.id || ''}
                      onTeamChange={(teamId) =>
                        setSelectedTeamByHackathon((prev) => ({ ...prev, [hackathon.id]: teamId }))
                      }
                      onRegister={() => registerTeamToHackathon(hackathon.id)}
                      isRegistering={registeringHackathonId === hackathon.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function HackathonCard({
  hackathon,
  currentUserId,
  captainTeams,
  selectedTeamId,
  onTeamChange,
  onRegister,
  isRegistering,
}: {
  hackathon: any;
  currentUserId?: string;
  captainTeams: UserTeam[];
  selectedTeamId: string;
  onTeamChange: (teamId: string) => void;
  onRegister: () => void;
  isRegistering: boolean;
}) {
  const isOngoing = ['active', 'frozen'].includes(hackathon.status);
  const isFinished = ['ended', 'archived'].includes(hackathon.status);
  const isLobby = hackathon.status === 'lobby';
  const isCheckin = hackathon.status === 'checkin';

  // Determine navigation target based on status
  const getLink = () => {
    if (isCheckin) return `/hackathon/${hackathon.id}/scoreboard`;
    if (isOngoing) return `/hackathon/${hackathon.id}/workspace`;
    if (isFinished) return `/hackathon/${hackathon.id}/results`;
    return `/hackathon/${hackathon.id}/scoreboard`;
  };

  const getButtonLabel = () => {
    if (isLobby) return 'Register';
    if (isCheckin) return 'Check-in';
    if (isOngoing) return 'Enter Workspace';
    if (isFinished) return 'View Results';
    return 'View';
  };

  const statusLabel = {
    draft: 'Draft',
    lobby: 'Registration Open',
    checkin: 'Check-in',
    active: 'Active',
    frozen: 'Frozen',
    ended: 'Ended',
    archived: 'Archived',
    cancelled: 'Cancelled',
  }[hackathon.status] || hackathon.status;

  const title = hackathon.title || hackathon.name || 'Untitled Hackathon';
  const teamsCount =
    hackathon._count?.hackathonTeams ??
    hackathon.hackathonTeams?.length ??
    hackathon._count?.teams ??
    hackathon.teams ??
    0;
  const problemsCount =
    Array.isArray(hackathon.challengeIds) ? hackathon.challengeIds.length : (hackathon.problems ?? 0);
  const myTeam = Array.isArray(hackathon.hackathonTeams)
    ? hackathon.hackathonTeams.find((t: any) =>
      t.members?.some((m: any) => m.userId === currentUserId),
    )
    : null;
  const myRole = myTeam?.members?.find((m: any) => m.userId === currentUserId)?.role;
  const isRegistered = Boolean(myTeam);

  return (
    <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] hover:border-[var(--brand-primary)] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3>{title}</h3>
            <Badge variant={hackathon.status}>
              {statusLabel}
            </Badge>
            {myTeam && (
              <Link to="/teams">
                <Badge variant="ongoing">
                  {myRole === 'captain' ? 'My Team: Captain' : 'My Team: Member'}
                  {myTeam.isCheckedIn ? ' • Checked In' : ''}
                </Badge>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-6 text-caption text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{teamsCount} teams</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              <span>{problemsCount} problems</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(hackathon.startTime).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLobby ? (
            <div className="flex items-center gap-2">
              {!isRegistered && (
                <select
                  className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-2 py-2 text-sm"
                  value={selectedTeamId}
                  onChange={(e) => onTeamChange(e.target.value)}
                  disabled={isRegistering || captainTeams.length === 0}
                >
                  {captainTeams.length === 0 ? (
                    <option value="">No captain team</option>
                  ) : (
                    captainTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))
                  )}
                </select>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={onRegister}
                disabled={isRegistering || captainTeams.length === 0 || isRegistered}
              >
                <Play className="w-4 h-4" />
                {isRegistered ? 'Registered' : isRegistering ? 'Registering...' : 'Register'}
              </Button>
            </div>
          ) : (isOngoing || isCheckin) && (
            <Link to={getLink()}>
              <Button variant="primary" size="md">
                <Play className="w-4 h-4" />
                {getButtonLabel()}
              </Button>
            </Link>
          )}
          {isFinished && (
            <Link to={getLink()}>
              <Button variant="secondary" size="md">
                View Results
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Countdown for ongoing */}
      {isOngoing && (
        <div className="pt-4 border-t border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-medium">
              Time remaining:
            </span>
            <CountdownTimer targetDate={hackathon.endTime} />
          </div>
        </div>
      )}

      {isLobby && (
        <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
          {isRegistered ? (
            <p className="text-sm text-[var(--text-secondary)]">
              You are already registered in this hackathon.
            </p>
          ) : captainTeams.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              You need to be captain of a team before registering.
              {' '}
              <Link to="/teams" className="text-[var(--brand-primary)] hover:underline">Create a team</Link>.
            </p>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              Select one of your captain teams and click Register.
            </p>
          )}
        </div>
      )}
    </div>
  );
}