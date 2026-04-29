import { useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Upload, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import api from '../../api/axios';

interface CompanyInfo {
  id: string;
  name: string;
  verified: boolean;
  status: string;
}

export function CompanyVerifyPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/companies/my-company')
      .then(res => {
        setCompany(res.data);
        if (res.data.verified) {
          navigate('/dashboard');
        }
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [companyId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/companies/request-verification');
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit verification request');
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-8">
            <div className="w-16 h-16 bg-[var(--state-success)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[var(--state-success)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Verification Requested</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Your verification request for <strong>{company?.name}</strong> has been submitted.
              Our team will review your company within 1-3 business days.
            </p>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <CompanyNavbar companyName={company?.name || 'Company'} userName="You" userRole="member" />
      <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[var(--brand-primary)]/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-[var(--brand-primary)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Request Verification</h1>
              <p className="text-[var(--text-secondary)]">{company?.name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)]">
              <h3 className="font-medium text-[var(--text-primary)] mb-2">What happens next?</h3>
              <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                <li className="flex items-start gap-2">
                  <Send className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
                  <span>Submit your verification request</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
                  <span>Our team reviews your company information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
                  <span>Get verified and unlock all features</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">
              By requesting verification, you confirm that your company is legitimate and operating.
              We may contact you for additional documentation if needed.
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-[var(--state-error)]/10 border border-[var(--state-error)]/30 rounded-[var(--radius-md)]">
                <AlertCircle className="w-4 h-4 text-[var(--state-error)]" />
                <span className="text-sm text-[var(--state-error)]">{error}</span>
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Request Verification'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  </>
);
}