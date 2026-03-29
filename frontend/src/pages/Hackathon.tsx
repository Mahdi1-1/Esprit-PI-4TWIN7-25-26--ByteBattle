import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CountdownTimer } from '../components/Timer';
import { Layout } from '../components/Layout';
import { Users, Calendar, Trophy, Play, Loader } from 'lucide-react';
import { hackathonsService } from '../services/hackathonsService';

export function Hackathon() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const res = await hackathonsService.getAll();
        if (res?.data?.length) {
          setHackathons(res.data);
        }
      } catch (err) {
        console.error('Failed to load hackathons:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHackathons();
  }, []);

  const ongoingHackathons = hackathons.filter(h => ['active', 'frozen'].includes(h.status));
  const lobbyHackathons = hackathons.filter(h => h.status === 'lobby');
  const checkinHackathons = hackathons.filter(h => h.status === 'checkin');
  const upcomingHackathons = hackathons.filter(h => h.status === 'draft');
  const finishedHackathons = hackathons.filter(h => ['ended', 'archived'].includes(h.status));
  const cancelledHackathons = hackathons.filter(h => h.status === 'cancelled');

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
                    <HackathonCard key={hackathon.id} hackathon={hackathon} />
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
                    <HackathonCard key={hackathon.id} hackathon={hackathon} />
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
                    <HackathonCard key={hackathon.id} hackathon={hackathon} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Hackathons */}
            <section className="mb-8">
              <h2 className="mb-4">Upcoming</h2>
              <div className="p-12 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                <p className="text-[var(--text-muted)]">
                  No upcoming hackathons at the moment
                </p>
              </div>
            </section>

            {/* Past Hackathons */}
            {finishedHackathons.length > 0 && (
              <section>
                <h2 className="mb-4">Finished</h2>
                <div className="space-y-4">
                  {finishedHackathons.map((hackathon) => (
                    <HackathonCard key={hackathon.id} hackathon={hackathon} />
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

function HackathonCard({ hackathon }: { hackathon: any }) {
  const isOngoing = ['active', 'frozen'].includes(hackathon.status);
  const isFinished = ['ended', 'archived'].includes(hackathon.status);
  const isLobby = hackathon.status === 'lobby';
  const isCheckin = hackathon.status === 'checkin';

  // Determine navigation target based on status
  const getLink = () => {
    if (isLobby || isCheckin) return `/hackathon/${hackathon.id}/lobby`;
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

  return (
    <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] hover:border-[var(--brand-primary)] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3>{hackathon.name}</h3>
            <Badge variant={hackathon.status}>
              {statusLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-6 text-caption text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{hackathon.teams} teams</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              <span>{hackathon.problems} problems</span>
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
          {(isOngoing || isLobby || isCheckin) && (
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
    </div>
  );
}