import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Users, Briefcase, FileText, TrendingUp, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router';

export function CompanyOverview() {
  const stats = [
    { label: 'Active Challenges', value: '8', icon: Briefcase, color: 'text-[var(--brand-primary)]', bgColor: 'bg-[var(--brand-primary)]/10' },
    { label: 'Total Candidates', value: '247', icon: Users, color: 'text-[var(--state-info)]', bgColor: 'bg-[var(--state-info)]/10' },
    { label: 'Completed Tests', value: '189', icon: CheckCircle2, color: 'text-[var(--state-success)]', bgColor: 'bg-[var(--state-success)]/10' },
    { label: 'Avg. Score', value: '78%', icon: TrendingUp, color: 'text-[var(--state-warning)]', bgColor: 'bg-[var(--state-warning)]/10' }
  ];

  const recentChallenges = [
    { id: '1', title: 'Full Stack Developer Assessment', candidates: 45, avgScore: 82, status: 'active', created: '2024-01-15' },
    { id: '2', title: 'Frontend React Challenge', candidates: 38, avgScore: 76, status: 'active', created: '2024-01-10' },
    { id: '3', title: 'Backend API Design', candidates: 29, avgScore: 85, status: 'active', created: '2024-01-08' },
    { id: '4', title: 'DevOps Pipeline Setup', candidates: 18, avgScore: 71, status: 'draft', created: '2024-01-05' }
  ];

  const topCandidates = [
    { name: 'Alice Johnson', challenge: 'Full Stack Developer', score: 95, date: '2024-01-20', status: 'passed' },
    { name: 'Bob Smith', challenge: 'Frontend React', score: 92, date: '2024-01-19', status: 'passed' },
    { name: 'Carol Williams', challenge: 'Backend API', score: 88, date: '2024-01-18', status: 'passed' },
    { name: 'David Brown', challenge: 'Full Stack Developer', score: 85, date: '2024-01-17', status: 'passed' }
  ];

  return (
    <Layout>
      <CompanyNavbar companyName="TechCorp Inc." userName="John Doe" userRole="owner" />
      
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Company Dashboard
            </h1>
            <p className="text-[var(--text-secondary)]">
              Manage your recruitment challenges and track candidate performance
            </p>
          </div>
          <Link to="/company/challenges/create">
            <Button variant="primary" size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Challenge
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-[var(--radius-md)] ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Challenges */}
          <div className="lg:col-span-2 theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Recent Challenges</h2>
              <Link to="/company/challenges">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>

            <div className="space-y-4">
              {recentChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                        {challenge.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {challenge.candidates} candidates
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {challenge.avgScore}% avg
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(challenge.created).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge variant={challenge.status === 'active' ? 'success' : 'warning'}>
                      {challenge.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/company/challenges/${challenge.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link to={`/company/challenges/${challenge.id}/candidates`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        View Candidates
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Candidates */}
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Top Candidates</h2>
              <Link to="/company/candidates">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>

            <div className="space-y-3">
              {topCandidates.map((candidate, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border-default)]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-semibold text-xs">
                        {candidate.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[var(--text-primary)]">
                          {candidate.name}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {candidate.challenge}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[var(--brand-primary)]">
                        {candidate.score}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">
                      {new Date(candidate.date).toLocaleDateString()}
                    </span>
                    <Badge variant="success" className="text-xs">
                      {candidate.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/company/challenges/create" className="block">
            <div className="p-6 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer">
              <Plus className="w-8 h-8 text-[var(--brand-primary)] mb-3" />
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">Create New Challenge</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Set up a new recruitment challenge
              </p>
            </div>
          </Link>

          <Link to="/company/candidates" className="block">
            <div className="p-6 bg-gradient-to-br from-[var(--state-info)]/20 to-[var(--state-info)]/5 border border-[var(--state-info)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer">
              <Users className="w-8 h-8 text-[var(--state-info)] mb-3" />
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">View Candidates</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Browse all candidate submissions
              </p>
            </div>
          </Link>

          <Link to="/company/exports" className="block">
            <div className="p-6 bg-gradient-to-br from-[var(--state-success)]/20 to-[var(--state-success)]/5 border border-[var(--state-success)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer">
              <FileText className="w-8 h-8 text-[var(--state-success)] mb-3" />
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">Export Reports</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Download candidate performance data
              </p>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
