import { useState } from 'react';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Search, Filter, Download, Mail, Eye, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '../../context/LanguageContext';

interface Candidate {
  id: string;
  name: string;
  email: string;
  challenge: string;
  submittedAt: string;
  score: number;
  status: 'passed' | 'failed' | 'pending';
  duration: number; // minutes
}

export function CompanyCandidatesList() {
  const { direction } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed' | 'pending'>('all');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  const candidates: Candidate[] = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', challenge: 'Full Stack Developer', submittedAt: '2024-01-20', score: 95, status: 'passed', duration: 45 },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', challenge: 'Frontend React', submittedAt: '2024-01-19', score: 92, status: 'passed', duration: 38 },
    { id: '3', name: 'Carol Williams', email: 'carol@example.com', challenge: 'Backend API', submittedAt: '2024-01-18', score: 88, status: 'passed', duration: 52 },
    { id: '4', name: 'David Brown', email: 'david@example.com', challenge: 'Full Stack Developer', submittedAt: '2024-01-17', score: 85, status: 'passed', duration: 60 },
    { id: '5', name: 'Emma Davis', email: 'emma@example.com', challenge: 'DevOps Pipeline', submittedAt: '2024-01-16', score: 48, status: 'failed', duration: 75 },
    { id: '6', name: 'Frank Wilson', email: 'frank@example.com', challenge: 'Frontend React', submittedAt: '2024-01-15', score: 0, status: 'pending', duration: 0 },
    { id: '7', name: 'Grace Lee', email: 'grace@example.com', challenge: 'Backend API', submittedAt: '2024-01-14', score: 78, status: 'passed', duration: 55 },
    { id: '8', name: 'Henry Martinez', email: 'henry@example.com', challenge: 'Full Stack Developer', submittedAt: '2024-01-13', score: 42, status: 'failed', duration: 90 }
  ];

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.challenge.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || candidate.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c.id));
    }
  };

  const handleSelectCandidate = (id: string) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter(cid => cid !== id));
    } else {
      setSelectedCandidates([...selectedCandidates, id]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Layout>
      <CompanyNavbar companyName="TechCorp Inc." userName="John Doe" userRole="recruiter" />
      
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6" dir={direction}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Candidates
            </h1>
            <p className="text-[var(--text-secondary)]">
              Review and manage candidate submissions
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            {selectedCandidates.length > 0 && (
              <Button variant="primary" size="md" className="gap-2">
                <Mail className="w-4 h-4" />
                Contact ({selectedCandidates.length})
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{candidates.length}</div>
            <div className="text-sm text-[var(--text-secondary)]">Total Candidates</div>
          </div>
          <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
            <div className="text-2xl font-bold text-[var(--state-success)]">
              {candidates.filter(c => c.status === 'passed').length}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Passed</div>
          </div>
          <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
            <div className="text-2xl font-bold text-[var(--state-error)]">
              {candidates.filter(c => c.status === 'failed').length}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Failed</div>
          </div>
          <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
            <div className="text-2xl font-bold text-[var(--state-warning)]">
              {candidates.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Pending</div>
          </div>
        </div>

        {/* Filters */}
        <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]`} />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]`}
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'passed' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus('passed')}
              >
                Passed
              </Button>
              <Button
                variant={filterStatus === 'failed' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus('failed')}
              >
                Failed
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                Pending
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" dir={direction}>
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                <tr>
                  <th className={`${direction === 'rtl' ? 'text-right' : 'text-left'} p-4`}>
                    <input
                      type="checkbox"
                      checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-[var(--border-default)]"
                    />
                  </th>
                  <th className={`${direction === 'rtl' ? 'text-right' : 'text-left'} p-4 font-semibold text-[var(--text-primary)]`}>Candidate</th>
                  <th className={`${direction === 'rtl' ? 'text-right' : 'text-left'} p-4 font-semibold text-[var(--text-primary)]`}>Challenge</th>
                  <th className={`${direction === 'rtl' ? 'text-right' : 'text-left'} p-4 font-semibold text-[var(--text-primary)]`}>Score</th>
                  <th className={`${direction === 'rtl' ? 'text-right' : 'text-left'} p-4 font-semibold text-[var(--text-primary)]`}>Duration</th>
                  <th className={`${direction === 'rtl' ? 'text-right' : 'text-left'} p-4 font-semibold text-[var(--text-primary)]`}>Status</th>
                  <th className={`${direction === 'rtl' ? 'text-right' : 'text-left'} p-4 font-semibold text-[var(--text-primary)]`}>Date</th>
                  <th className={`${direction === 'rtl' ? 'text-right' : 'text-left'} p-4 font-semibold text-[var(--text-primary)]`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-[var(--border-default)] hover:bg-[var(--surface-2)] transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={() => handleSelectCandidate(candidate.id)}
                        className="rounded border-[var(--border-default)]"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{candidate.name}</div>
                        <div className="text-sm text-[var(--text-secondary)]">{candidate.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">{candidate.challenge}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[var(--brand-primary)]" />
                        <span className="font-semibold text-[var(--text-primary)]">{candidate.score}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <Clock className="w-4 h-4" />
                        <span>{candidate.duration}m</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusBadge(candidate.status) as any} className="gap-1">
                        {getStatusIcon(candidate.status)}
                        {candidate.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">
                      {new Date(candidate.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Link to={`/company/candidates/${candidate.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-[var(--border-default)] flex items-center justify-between">
            <div className="text-sm text-[var(--text-secondary)]">
              Showing {filteredCandidates.length} of {candidates.length} candidates
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">Previous</Button>
              <Button variant="primary" size="sm">1</Button>
              <Button variant="ghost" size="sm">2</Button>
              <Button variant="ghost" size="sm">3</Button>
              <Button variant="ghost" size="sm">Next</Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
