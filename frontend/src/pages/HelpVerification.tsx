import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Shield, CheckCircle, Clock, Users, Briefcase, FileText, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import api from '../api/axios';

interface VerificationInfo {
  name: string;
  verified: boolean;
  status: string;
}

export function HelpVerification() {
  const [info, setInfo] = useState<VerificationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/companies/my-company')
      .then(res => setInfo(res.data))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);

  const handleRequestVerification = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/companies/request-verification');
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 md:p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[var(--brand-primary)]/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-[var(--brand-primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Company Verification</h1>
              <p className="text-[var(--text-secondary)]">Learn about the verification process</p>
            </div>
          </div>

          {info?.verified ? (
            <div className="flex items-center gap-3 p-4 bg-[var(--state-success)]/10 border border-[var(--state-success)]/30 rounded-[var(--radius-md)] mb-6">
              <CheckCircle className="w-5 h-5 text-[var(--state-success)]" />
              <div>
                <span className="font-medium text-[var(--state-success)]">{info.name}</span>
                <span className="text-[var(--text-secondary)] ml-2">is a verified company</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-[var(--state-warning)]/10 border border-[var(--state-warning)]/30 rounded-[var(--radius-md)] mb-6">
              <Clock className="w-5 h-5 text-[var(--state-warning)]" />
              <div>
                <span className="font-medium text-[var(--text-primary)]">{info?.name || 'Your Company'}</span>
                <span className="text-[var(--text-secondary)] ml-2">verification pending</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">What is company verification?</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Company verification is a process where we validate that your company is legitimate and operating.
                Verified companies get access to additional features and their listings appear with a verification badge.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Benefits of verification</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--state-success)] flex-shrink-0 mt-0.5" />
                  <span className="text-[var(--text-secondary)]">Verified badge on your company profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--state-success)] flex-shrink-0 mt-0.5" />
                  <span className="text-[var(--text-secondary)]">Post public job listings and hackathons</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--state-success)] flex-shrink-0 mt-0.5" />
                  <span className="text-[var(--text-secondary)]">Create public forum posts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--state-success)] flex-shrink-0 mt-0.5" />
                  <span className="text-[var(--text-secondary)]">Access to company analytics</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">What's available without verification</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                  <span className="text-[var(--text-secondary)]">Manage employees and members</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                  <span className="text-[var(--text-secondary)]">Create internal roadmaps and courses</span>
                </li>
                <li className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                  <span className="text-[var(--text-secondary)]">Employee-only job listings</span>
                </li>
              </ul>
            </section>

            {info && !info.verified && (
              <section className="border-t border-[var(--border-default)] pt-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Request verification</h2>
                {submitted ? (
                  <div className="flex items-center gap-3 p-4 bg-[var(--state-success)]/10 border border-[var(--state-success)]/30 rounded-[var(--radius-md)]">
                    <CheckCircle className="w-5 h-5 text-[var(--state-success)]" />
                    <span className="text-[var(--state-success)]">Verification request submitted! We'll review your company soon.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[var(--text-secondary)]">
                      Once you submit a verification request, our team will review your company information.
                      This typically takes 1-3 business days.
                    </p>
                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-[var(--state-error)]/10 border border-[var(--state-error)]/30 rounded-[var(--radius-md)]">
                        <AlertCircle className="w-4 h-4 text-[var(--state-error)]" />
                        <span className="text-sm text-[var(--state-error)]">{error}</span>
                      </div>
                    )}
                    <Button variant="primary" onClick={handleRequestVerification} disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Request Verification'}
                    </Button>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}