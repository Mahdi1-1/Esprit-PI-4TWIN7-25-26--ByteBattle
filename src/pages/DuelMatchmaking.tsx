import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { mockUser } from '../data/mockData';
import { Swords, Target, Users, Zap } from 'lucide-react';

export function DuelMatchmaking() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(15);
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    if (isSearching) {
      const interval = setInterval(() => {
        setSearchTime(t => t + 1);
        
        // Simulate match found after 3 seconds
        if (searchTime >= 3) {
          clearInterval(interval);
          setTimeout(() => {
            navigate('/duel/room');
          }, 500);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isSearching, searchTime, navigate]);

  const handleStartSearch = () => {
    setIsSearching(true);
    setSearchTime(0);
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    setSearchTime(0);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar 
        isLoggedIn 
        userAvatar={mockUser.avatar} 
        username={mockUser.username} 
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] glow">
              <Swords className="w-10 h-10 text-[var(--bg-primary)]" />
            </div>
            <h1 className="mb-2">Duel 1v1</h1>
            <p className="text-[var(--text-secondary)]">
              Challenge an opponent of similar level in real-time
            </p>
          </div>

          {/* Main Card */}
          <div className="p-8 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] mb-6">
            {!isSearching ? (
              <>
                {/* Player Stats */}
                <div className="flex items-center justify-center gap-8 mb-8 pb-8 border-b border-[var(--border-default)]">
                  <div className="text-center">
                    <img
                      src={mockUser.avatar}
                      alt={mockUser.username}
                      className="w-24 h-24 mx-auto mb-3 rounded-full border-4 border-[var(--brand-primary)] glow"
                    />
                    <h3 className="mb-1">{mockUser.username}</h3>
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-caption text-[var(--text-muted)]">Elo:</span>
                      <span className="font-semibold text-[var(--brand-primary)]">
                        {mockUser.elo}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <InfoCard
                    icon={<Target className="w-5 h-5" />}
                    label="Elo Range"
                    value={`${mockUser.elo - 100} - ${mockUser.elo + 100}`}
                  />
                  <InfoCard
                    icon={<Users className="w-5 h-5" />}
                    label="Players Online"
                    value="342"
                  />
                  <InfoCard
                    icon={<Zap className="w-5 h-5" />}
                    label="Estimated Time"
                    value={`~${estimatedTime}s`}
                  />
                </div>

                {/* Start Button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleStartSearch}
                >
                  <Swords className="w-5 h-5" />
                  Start Search
                </Button>
              </>
            ) : (
              <>
                {/* Searching Animation */}
                <div className="text-center py-12">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-[var(--brand-primary)]/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-[var(--brand-primary)] rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Swords className="w-12 h-12 text-[var(--brand-primary)]" />
                    </div>
                  </div>

                  <h2 className="mb-2">Searching for an opponent...</h2>
                  <p className="text-[var(--text-muted)] mb-6">
                    Time elapsed: {searchTime}s
                  </p>

                  <div className="mb-8 p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                    <p className="text-caption text-[var(--text-secondary)]">
                      Looking for a player with Elo {mockUser.elo - 100} - {mockUser.elo + 100}
                    </p>
                  </div>

                  <Button
                    variant="destructive"
                    size="md"
                    onClick={handleCancelSearch}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Tips */}
          <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
            <h3 className="mb-3">Duel Tips</h3>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)]">•</span>
                <span>First to solve the problem wins</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)]">•</span>
                <span>Each wrong submission adds a time penalty</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)]">•</span>
                <span>You can see your opponent's progress without seeing their code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)]">•</span>
                <span>Winning increases your Elo, losing decreases it</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] text-center">
      <div className="flex items-center justify-center mb-2 text-[var(--brand-primary)]">
        {icon}
      </div>
      <p className="text-caption text-[var(--text-muted)] mb-1">{label}</p>
      <p className="font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}