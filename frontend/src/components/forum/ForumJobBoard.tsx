import { useEffect, useState } from 'react';
import { Briefcase, Building2, MapPin, DollarSign } from 'lucide-react';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { companyService, CompanyJob } from '../../services/companyService';

type PublicJob = CompanyJob & { company: { id: string; name: string } };

export function ForumJobBoard() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const data = await companyService.getPublicJobs();
        setJobs(data);
      } catch (error) {
        console.error('Failed to load public jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleApply = async (job: PublicJob) => {
    setApplyingJobId(job.id);
    try {
      await companyService.applyToJob(job.company.id, job.id);
      setJobs((current) => current.filter((item) => item.id !== job.id));
    } catch (error) {
      console.error('Failed to apply to job:', error);
      alert('Unable to submit your application right now.');
    } finally {
      setApplyingJobId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] animate-pulse" />
        <div className="h-24 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] animate-pulse" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--surface-1)] p-8 text-center">
        <Briefcase className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-[var(--text-primary)] font-medium">No open positions</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Check back soon for new opportunities.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <article
          key={job.id}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{job.title}</h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Building2 className="w-4 h-4" />
                <span>{job.company.name}</span>
              </div>
            </div>
            <Badge variant="default">{job.type.replace('_', ' ')}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
            {job.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
            ) : null}
            {job.salaryRange ? (
              <span className="inline-flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {job.salaryRange}
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm text-[var(--text-secondary)] line-clamp-2">{job.description}</p>

          <div className="mt-4">
            <Button
              variant="primary"
              onClick={() => handleApply(job)}
              disabled={applyingJobId === job.id}
            >
              {applyingJobId === job.id ? 'Applying...' : 'Apply'}
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
