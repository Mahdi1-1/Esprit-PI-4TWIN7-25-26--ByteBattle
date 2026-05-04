import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { VerificationBanner } from '../../components/company/VerificationBanner';
import { useAuth } from '../../context/AuthContext';
import { useCurrentCompanyId } from '../../hooks/useCurrentCompanyId';
import { companyService, Company, CompanyJob, CompanyRole, JobType, JobStatus } from '../../services/companyService';
import { AlertCircle, Plus, ArrowLeft, MapPin, DollarSign, Clock, Users, Briefcase, Trash2, Edit, Eye } from 'lucide-react';

const jobTypeLabels: Record<JobType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
};

export function CompanyJobs() {
  const { companyId: routeCompanyId } = useParams<{ companyId: string }>();
  const companyId = useCurrentCompanyId(routeCompanyId);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<CompanyJob | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    salaryRange: '',
    location: '',
    type: 'full_time' as JobType,
  });

  const currentUserRole = user?.companyRole as CompanyRole || null;
  const canManage = currentUserRole === 'owner' || currentUserRole === 'recruiter';

  const fetchData = useCallback(async () => {
    if (companyId === undefined) return;
    if (!companyId) {
      setError('You are not a member of any company');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [companyData, jobsData] = await Promise.all([
        companyService.getCompany(companyId),
        companyService.getCompanyJobs(companyId),
      ]);
      setCompany(companyData);
      setJobs(jobsData);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId === undefined) return;
    fetchData();
  }, [companyId, fetchData]);

  const handleCreateJob = async () => {
    if (!companyId || !newJob.title.trim()) return;
    try {
      const created = await companyService.createJob(companyId, {
        ...newJob,
        requirements: newJob.requirements.split(',').map(r => r.trim()).filter(Boolean),
      });
      setJobs([...jobs, created]);
      setIsCreating(false);
      setNewJob({ title: '', description: '', requirements: '', salaryRange: '', location: '', type: 'full_time' });
    } catch (err) {
      console.error('Failed to create job:', err);
    }
  };

  const handleToggleStatus = async (job: CompanyJob) => {
    if (!companyId) return;
    const newStatus: JobStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      await companyService.updateJob(companyId, job.id, { status: newStatus });
      setJobs(jobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
    } catch (err) {
      console.error('Failed to update job status:', err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!companyId || !confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await companyService.deleteJob(companyId, jobId);
      setJobs(jobs.filter(j => j.id !== jobId));
      if (selectedJob?.id === jobId) setSelectedJob(null);
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--surface-2)] rounded w-1/4"></div>
            <div className="h-64 bg-[var(--surface-2)] rounded-[var(--radius-lg)]"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !company) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="w-12 h-12 text-[var(--state-error)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Failed to load jobs</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error || 'Unknown error'}</p>
            <Button onClick={fetchData}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const activeJobs = jobs.filter(j => j.status === 'active');
  const isBlocked = !company.verified;

  return (
    <Layout>
      <CompanyNavbar companyName={company.name} userName={user?.username || 'User'} userRole={currentUserRole || 'member'} />
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/companies/${companyId}/dashboard`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Job Postings</h1>
            <p className="text-[var(--text-secondary)]">{activeJobs.length} active jobs</p>
          </div>
        </div>

        <VerificationBanner companyName={company.name} verified={company.verified} />

        {isBlocked && canManage && (
          <div className="p-4 bg-[var(--state-warning)]/10 border border-[var(--state-warning)]/30 rounded-[var(--radius-md)]">
            <p className="text-[var(--text-secondary)]">
              Public job postings are blocked until your company is verified. You can create employees-only job postings.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">All Jobs</h2>
              {canManage && (
                <Button variant="primary" size="sm" onClick={() => setIsCreating(true)} disabled={isBlocked && !canManage}>
                  <Plus className="w-4 h-4 mr-1" />
                  Post Job
                </Button>
              )}
            </div>

            {isCreating && (
              <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border-default)] space-y-4">
                <Input
                  placeholder="Job title"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                />
                <textarea
                  placeholder="Job description"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] min-h-[100px]"
                />
                <Input
                  placeholder="Requirements (comma separated)"
                  value={newJob.requirements}
                  onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Salary range"
                    value={newJob.salaryRange}
                    onChange={(e) => setNewJob({ ...newJob, salaryRange: e.target.value })}
                  />
                  <Input
                    placeholder="Location"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  />
                </div>
                <select
                  value={newJob.type}
                  onChange={(e) => setNewJob({ ...newJob, type: e.target.value as JobType })}
                  className="w-full px-3 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleCreateJob} disabled={!newJob.title.trim()}>
                    Post Job
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-4 rounded-[var(--radius-md)] border cursor-pointer transition-colors ${
                    selectedJob?.id === job.id
                      ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30'
                      : 'bg-[var(--surface-2)] border-[var(--border-default)] hover:border-[var(--brand-primary)]/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">{job.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-1">
                        <Badge variant="default">{jobTypeLabels[job.type]}</Badge>
                        {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={job.status === 'active' ? 'default' : 'common'}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No job postings yet. Post a job to get started.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedJob ? (
              <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedJob.title}</h2>
                    <div className="flex items-center gap-4 text-[var(--text-secondary)] mt-2">
                      <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{jobTypeLabels[selectedJob.type]}</span>
                      {selectedJob.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{selectedJob.location}</span>}
                      {selectedJob.salaryRange && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{selectedJob.salaryRange}</span>}
                    </div>
                  </div>
                  <Badge variant={selectedJob.status === 'active' ? 'default' : 'common'} className="text-sm">
                    {selectedJob.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Description</h3>
                  <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                {selectedJob.requirements.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">Requirements</h3>
                    <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1">
                      {selectedJob.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" />{selectedJob.applicants.length} applicants</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />Posted {new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                </div>

                {canManage && (
                  <div className="flex gap-4 pt-4 border-t border-[var(--border-default)]">
                    <Button variant="primary" onClick={() => window.location.href = `/companies/${companyId}/jobs/${selectedJob.id}/applications`}>
                      <Users className="w-4 h-4 mr-2" />
                      View Applications ({selectedJob.applicants.length})
                    </Button>
                    <Button variant="secondary" onClick={() => handleToggleStatus(selectedJob)}>
                      {selectedJob.status === 'active' ? 'Close Job' : 'Reopen Job'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 text-center py-12">
                <Briefcase className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">Select a job to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}