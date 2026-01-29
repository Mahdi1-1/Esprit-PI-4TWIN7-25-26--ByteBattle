import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CountdownTimer } from '../components/Timer';
import { mockUser, mockHackathons } from '../data/mockData';
import { Users, Calendar, Trophy, Play } from 'lucide-react';

export function Hackathon() {
  const ongoingHackathons = mockHackathons.filter(h => h.status === 'ongoing');
  const upcomingHackathons = mockHackathons.filter(h => h.status === 'upcoming');
  const finishedHackathons = mockHackathons.filter(h => h.status === 'finished');

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
          <h1 className="mb-2">Hackathons</h1>
          <p className="text-[var(--text-secondary)]">
            Compétitions en équipe style ICPC avec scoreboard en temps réel
          </p>
        </div>

        {/* Ongoing Hackathons */}
        {ongoingHackathons.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4">En cours</h2>
            <div className="space-y-4">
              {ongoingHackathons.map((hackathon) => (
                <HackathonCard key={hackathon.id} hackathon={hackathon} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Hackathons */}
        <section className="mb-8">
          <h2 className="mb-4">À venir</h2>
          <div className="p-12 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
            <p className="text-[var(--text-muted)]">
              Aucun hackathon à venir pour le moment
            </p>
          </div>
        </section>

        {/* Past Hackathons */}
        {finishedHackathons.length > 0 && (
          <section>
            <h2 className="mb-4">Terminés</h2>
            <div className="space-y-4">
              {finishedHackathons.map((hackathon) => (
                <HackathonCard key={hackathon.id} hackathon={hackathon} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function HackathonCard({ hackathon }: { hackathon: any }) {
  const isOngoing = hackathon.status === 'ongoing';
  const isFinished = hackathon.status === 'finished';

  return (
    <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] hover:border-[var(--brand-primary)] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3>{hackathon.name}</h3>
            <Badge variant={hackathon.status}>
              {hackathon.status === 'ongoing' ? 'En cours' : 
               hackathon.status === 'upcoming' ? 'À venir' : 
               'Terminé'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-6 text-caption text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{hackathon.teams} équipes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              <span>{hackathon.problems} problèmes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(hackathon.startTime).toLocaleDateString('fr-FR', {
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
          {isOngoing && (
            <Link to={`/hackathon/${hackathon.id}/scoreboard`}>
              <Button variant="primary" size="md">
                <Play className="w-4 h-4" />
                Rejoindre
              </Button>
            </Link>
          )}
          {isFinished && (
            <Link to={`/hackathon/${hackathon.id}/scoreboard`}>
              <Button variant="secondary" size="md">
                Voir le Classement
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
              Temps restant:
            </span>
            <CountdownTimer targetDate={hackathon.endTime} />
          </div>
        </div>
      )}
    </div>
  );
}
