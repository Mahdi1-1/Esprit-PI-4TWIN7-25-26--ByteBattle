import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Check, LogOut, Trash2, UserMinus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { hackathonsService } from '../services/hackathonsService';
import { teamsService } from '../services/teamsService';

type TeamMember = {
  userId: string;
  username: string;
  profileImage: string | null;
  role: 'captain' | 'member';
  joinedAt: string;
};

type TeamJoinRequest = {
  userId: string;
  username: string;
  profileImage: string | null;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
};

type Team = {
  id: string;
  name: string;
  ownerId: string;
  joinCode: string | null;
  members: TeamMember[];
  joinRequests?: TeamJoinRequest[];
  registeredHackathonIds?: string[];
  createdAt: string;
  updatedAt: string;
  createdByMe: boolean;
};

type HackathonSummary = {
  id: string;
  title?: string;
  name?: string;
};

type TabKey = 'my-teams' | 'all-teams';

export function Teams() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('my-teams');
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [lobbyHackathons, setLobbyHackathons] = useState<HackathonSummary[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [joinTeamCode, setJoinTeamCode] = useState('');
  const [memberUsernameByTeam, setMemberUsernameByTeam] = useState<Record<string, string>>({});
  const [selectedHackathonByTeam, setSelectedHackathonByTeam] = useState<Record<string, string>>({});
  const [requestedTeamIds, setRequestedTeamIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [joinCodeFeedback, setJoinCodeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const teamList = activeTab === 'my-teams' ? myTeams : allTeams;
  const selectedTeam =
    teamList.find((team) => team.id === selectedTeamId) ??
    allTeams.find((team) => team.id === selectedTeamId) ??
    myTeams.find((team) => team.id === selectedTeamId) ??
    null;

  const ownedTeamsCount = useMemo(
    () => myTeams.filter((team) => team.ownerId === user?.id).length,
    [myTeams, user?.id],
  );

  const upsertTeamInState = (nextTeam: Team) => {
    setMyTeams((prev) => {
      const exists = prev.some((team) => team.id === nextTeam.id);
      const isMine = nextTeam.members.some((member) => member.userId === user?.id);

      if (!isMine) return prev.filter((team) => team.id !== nextTeam.id);
      if (!exists) return [nextTeam, ...prev];

      return prev.map((team) => (team.id === nextTeam.id ? nextTeam : team));
    });

    setAllTeams((prev) => {
      const exists = prev.some((team) => team.id === nextTeam.id);
      if (!exists) return [nextTeam, ...prev];
      return prev.map((team) => (team.id === nextTeam.id ? nextTeam : team));
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [mine, all, hackathonsResp] = await Promise.all([
        teamsService.getMine(),
        teamsService.getAll(),
        hackathonsService.getAll({ status: 'lobby' }),
      ]);

      const nextMyTeams = Array.isArray(mine) ? mine : [];
      const nextAllTeams = Array.isArray(all) ? all : [];

      setMyTeams(nextMyTeams);
      setAllTeams(nextAllTeams);
      setLobbyHackathons(Array.isArray(hackathonsResp?.data) ? hackathonsResp.data : []);
    } catch (err: any) {
      console.error('Failed to load teams', err?.response?.data?.message || err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!joinCodeFeedback) return;

    const timeoutId = window.setTimeout(() => {
      setJoinCodeFeedback(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [joinCodeFeedback]);

  const refresh = async () => {
    await loadData();
  };

  const createTeam = async () => {
    const trimmedName = newTeamName.trim();
    if (!trimmedName) {
      return;
    }

    setSubmitting(true);
    try {
      await teamsService.create(trimmedName);
      setNewTeamName('');
      await refresh();
    } catch (err: any) {
      console.error('Failed to create team', err?.response?.data?.message || err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  const requestJoinByCode = async () => {
    const code = joinTeamCode.trim().toUpperCase();
    if (!code) {
      setJoinCodeFeedback({ type: 'error', message: 'Please enter a team code.' });
      return;
    }

    setSubmitting(true);
    try {
      await teamsService.requestJoinByCode(code);
      setJoinTeamCode('');
      setJoinCodeFeedback({ type: 'success', message: 'Join request sent successfully.' });
      await refresh();
    } catch (err: any) {
      setJoinCodeFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to request joining team.',
      });
      console.error('Failed to request joining team', err?.response?.data?.message || err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  const addMember = async (teamId: string) => {
    const username = (memberUsernameByTeam[teamId] || '').trim();
    if (!username) {
      return;
    }

    setSubmitting(true);
    try {
      const updatedTeam = await teamsService.addMember(teamId, username);
      upsertTeamInState(updatedTeam);
      setMemberUsernameByTeam((prev) => ({ ...prev, [teamId]: '' }));
    } catch (err: any) {
      console.error('Failed to add member', err?.response?.data?.message || err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  const removeMember = async (teamId: string, userId: string) => {
    setSubmitting(true);
    try {
      const updatedTeam = await teamsService.removeMember(teamId, userId);
      upsertTeamInState(updatedTeam);
    } catch (err: any) {
      console.error('Failed to remove member', err?.response?.data?.message || err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  const leaveTeam = async (teamId: string) => {
    setSubmitting(true);
    try {
      await teamsService.leaveTeam(teamId);
      setSelectedTeamId(null);
      setActiveTab('all-teams');
      await refresh();
    } catch (err: any) {
      console.error('Failed to leave team', err?.response?.data?.message || err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!window.confirm('Delete this team? This cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    try {
      await teamsService.deleteTeam(teamId);
      setSelectedTeamId(null);
      await refresh();
    } catch (err: any) {
      console.error('Failed to delete team', err?.response?.data?.message || err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  const requestToJoin = async (teamId: string) => {
    setSubmitting(true);
    try {
      await teamsService.requestToJoin(teamId);
      setRequestedTeamIds((prev) => new Set(prev).add(teamId));
      await refresh();
    } catch (err: any) {
      console.error('Failed to request joining team', err?.response?.data?.message || err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  const approveJoinRequest = async (teamId: string, targetUserId: string) => {
    setSubmitting(true);
    try {
      const updatedTeam = await teamsService.approveJoinRequest(teamId, targetUserId);
      upsertTeamInState(updatedTeam);
    } catch (err: any) {
      console.error('Failed to approve join request', err?.response?.data?.message || err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  const rejectJoinRequest = async (teamId: string, targetUserId: string) => {
    setSubmitting(true);
    try {
      await teamsService.rejectJoinRequest(teamId, targetUserId);
      await refresh();
    } catch (err: any) {
      console.error('Failed to reject join request', err?.response?.data?.message || err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  const registerToHackathon = async (teamId: string) => {
    const hackathonId = selectedHackathonByTeam[teamId];
    if (!hackathonId) {
      return;
    }

    setSubmitting(true);
    try {
      await teamsService.registerToHackathon(teamId, hackathonId);
      await refresh();
    } catch (err: any) {
      console.error('Failed to register team to hackathon', err?.response?.data?.message || err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderTeamMember = (member: TeamMember) => {
    const isCaptain = member.role === 'captain';
    const displayName = member.username?.trim() || `user-${member.userId.slice(-6)}`;

    return (
      <div
        key={member.userId}
        className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-2 py-1.5 transition-colors hover:bg-[var(--surface-3)]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--surface-1)]">
            <img
              src={profileService.getPhotoUrl(member.profileImage, displayName)}
              alt={displayName}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{displayName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isCaptain ? 'bg-amber-500/15 text-amber-400' : 'bg-[var(--surface-3)] text-[var(--text-secondary)]'}`}>
            {isCaptain ? 'Captain' : 'Member'}
          </span>
          {selectedTeam?.createdByMe && member.userId !== user?.id && (
            <Button
              variant="destructive"
              size="sm"
              className="h-7 px-2"
              onClick={() => removeMember(selectedTeam.id, member.userId)}
              disabled={submitting}
            >
              <UserMinus className="h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="w-full px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="mb-2 text-4xl font-bold">Teams</h1>
            <p className="text-[var(--text-secondary)]">
              Create persistent teams, invite members, approve join requests, and register a team to a lobby hackathon when one is available.
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              You own {ownedTeamsCount} team{ownedTeamsCount === 1 ? '' : 's'}.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
            <div className="space-y-4">
              <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4 space-y-3">
                <h3>Create a team</h3>
                <input
                  type="text"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2"
                  placeholder="Team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  disabled={submitting}
                />
                <Button variant="primary" size="md" onClick={createTeam} disabled={submitting} className="w-full">
                  Create Team
                </Button>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4 space-y-3">
                <h3>Join by code</h3>
                <input
                  type="text"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 uppercase tracking-[0.3em]"
                  placeholder="Team code"
                  value={joinTeamCode}
                  onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())}
                  disabled={submitting}
                  maxLength={12}
                />
                <Button variant="secondary" size="md" onClick={requestJoinByCode} disabled={submitting} className="w-full">
                  Request Join
                </Button>
                {joinCodeFeedback && (
                  <p
                    className={`text-xs ${
                      joinCodeFeedback.type === 'success' ? 'text-emerald-400' : 'text-[var(--state-error)]'
                    }`}
                  >
                    {joinCodeFeedback.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('my-teams')}
                  className={`flex-1 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'my-teams'
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  My Teams
                </button>
                <button
                  onClick={() => setActiveTab('all-teams')}
                  className={`flex-1 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'all-teams'
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  All Teams
                </button>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3>{activeTab === 'my-teams' ? 'Your Teams' : 'All Teams'}</h3>
                  <span className="text-xs text-[var(--text-muted)]">{teamList.length} total</span>
                </div>

                {loading ? (
                  <p className="text-sm text-[var(--text-muted)]">Loading teams...</p>
                ) : teamList.length === 0 ? (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] p-4 text-center text-sm text-[var(--text-muted)]">
                    No teams yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teamList.map((team) => {
                      const isMember = team.members.some((member) => member.userId === user?.id);
                      const isOwner = team.ownerId === user?.id;
                      const hasRequested = requestedTeamIds.has(team.id);

                      return (
                        <button
                          key={team.id}
                          onClick={() =>
                            setSelectedTeamId((prev) => (prev === team.id ? null : team.id))
                          }
                          className={`w-full rounded-[var(--radius-lg)] border px-4 py-3 text-left transition-colors ${
                            selectedTeamId === team.id
                              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/8'
                              : 'border-[var(--border-default)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{team.name}</p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {team.members.length} member{team.members.length === 1 ? '' : 's'}
                              </p>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              {isOwner && <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-400">Captain</span>}
                              {isMember && !isOwner && <span className="rounded-full bg-[var(--surface-3)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">Member</span>}
                              {!isMember && hasRequested && <span className="rounded-full bg-sky-500/15 px-2 py-1 text-[11px] font-semibold text-sky-400">Requested</span>}
                            </div>
                          </div>

                          {!isMember && !isOwner && (
                            <div className="mt-3 flex justify-end">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  requestToJoin(team.id);
                                }}
                                disabled={submitting || hasRequested}
                              >
                                {hasRequested ? 'Requested' : 'Request Join'}
                              </Button>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
              {selectedTeam ? (
                <div className="space-y-6">
                  <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-[var(--brand-primary)]/15 blur-3xl" />

                  <div className="relative rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-primary)]/15 text-sm font-bold text-[var(--brand-primary)]">
                          {selectedTeam.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold leading-tight">{selectedTeam.name}</h2>
                          <p className="text-sm text-[var(--text-muted)]">
                            {selectedTeam.members.length} member{selectedTeam.members.length === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedTeam.createdByMe ? (
                          <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-400">Captain</span>
                        ) : (
                          <span className="rounded-full bg-[var(--surface-3)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">Member</span>
                        )}
                        {selectedTeam.createdByMe ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="min-w-[122px]"
                            onClick={() => deleteTeam(selectedTeam.id)}
                            disabled={submitting}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Team
                          </Button>
                        ) : selectedTeam.members.some((member) => member.userId === user?.id) ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="min-w-[110px]"
                            onClick={() => leaveTeam(selectedTeam.id)}
                            disabled={submitting}
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Leave Team
                          </Button>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={() => requestToJoin(selectedTeam.id)} disabled={submitting || requestedTeamIds.has(selectedTeam.id)}>
                            {requestedTeamIds.has(selectedTeam.id) ? 'Requested' : 'Request Join'}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Team Code</p>
                        <p className="mt-1 text-sm font-semibold tracking-[0.22em] text-[var(--text-primary)]">
                          {selectedTeam.joinCode || 'N/A'}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Members</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{selectedTeam.members.length} total</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3>Members</h3>
                      <span className="text-xs text-[var(--text-muted)]">{selectedTeam.members.length} total</span>
                    </div>
                    <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                      {selectedTeam.members.map(renderTeamMember)}
                    </div>
                  </div>

                  {selectedTeam.createdByMe && (
                    <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
                      <h3>Add member by username</h3>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2"
                          placeholder="username"
                          value={memberUsernameByTeam[selectedTeam.id] || ''}
                          onChange={(e) => setMemberUsernameByTeam((prev) => ({ ...prev, [selectedTeam.id]: e.target.value }))}
                          disabled={submitting}
                        />
                        <Button variant="secondary" size="md" onClick={() => addMember(selectedTeam.id)} disabled={submitting}>
                          Add Member
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedTeam.createdByMe && (selectedTeam.joinRequests?.filter((request) => request.status === 'pending').length ?? 0) > 0 && (
                    <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
                      <div className="flex items-center justify-between">
                        <h3>Pending join requests</h3>
                        <span className="rounded-full bg-[var(--surface-3)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                          {selectedTeam.joinRequests?.filter((request) => request.status === 'pending').length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {selectedTeam.joinRequests
                          ?.filter((request) => request.status === 'pending')
                          .map((request) => (
                            (() => {
                              const requestDisplayName = request.username?.trim() || `user-${request.userId.slice(-6)}`;
                              return (
                            <div
                              key={request.userId}
                              className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--surface-1)]">
                                  <img
                                    src={profileService.getPhotoUrl(request.profileImage, requestDisplayName)}
                                    alt={requestDisplayName}
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[var(--text-primary)]">{requestDisplayName}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="border-emerald-500 text-emerald-300 hover:bg-emerald-500 hover:text-white"
                                  onClick={() => approveJoinRequest(selectedTeam.id, request.userId)}
                                  disabled={submitting}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => rejectJoinRequest(selectedTeam.id, request.userId)}
                                  disabled={submitting}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                              );
                            })()
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
                    <div className="flex items-center justify-between">
                      <h3>Register to a lobby hackathon</h3>
                      <span className="text-xs text-[var(--text-muted)]">{lobbyHackathons.length} available</span>
                    </div>

                    {selectedTeam.createdByMe ? (
                      <>
                        {(() => {
                          const selectedHackathonId = selectedHackathonByTeam[selectedTeam.id] || '';
                          const isRegisteredForSelectedHackathon = Boolean(
                            selectedHackathonId && selectedTeam.registeredHackathonIds?.includes(selectedHackathonId),
                          );

                          return (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <select
                            className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2"
                            value={selectedHackathonByTeam[selectedTeam.id] || ''}
                            onChange={(e) => setSelectedHackathonByTeam((prev) => ({ ...prev, [selectedTeam.id]: e.target.value }))}
                            disabled={submitting || lobbyHackathons.length === 0}
                          >
                            <option value="">Select lobby hackathon</option>
                            {lobbyHackathons.map((hackathon) => (
                              <option key={hackathon.id} value={hackathon.id}>
                                {hackathon.title || hackathon.name || hackathon.id}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => registerToHackathon(selectedTeam.id)}
                            disabled={submitting || lobbyHackathons.length === 0 || isRegisteredForSelectedHackathon}
                          >
                            {isRegisteredForSelectedHackathon ? 'Registered' : 'Register'}
                          </Button>
                        </div>
                          );
                        })()}
                        {lobbyHackathons.length === 0 && (
                          <p className="text-xs text-[var(--text-muted)]">No lobby hackathons available right now.</p>
                        )}
                        {(() => {
                          const selectedHackathonId = selectedHackathonByTeam[selectedTeam.id] || '';
                          const isRegisteredForSelectedHackathon = Boolean(
                            selectedHackathonId && selectedTeam.registeredHackathonIds?.includes(selectedHackathonId),
                          );

                          if (!isRegisteredForSelectedHackathon) return null;

                          return (
                            <p className="text-xs text-emerald-400">
                              This team is already registered to the selected hackathon.
                            </p>
                          );
                        })()}
                      </>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)]">Only the team captain can register this team to a hackathon.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-muted)]">
                  Select a team to view details.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}