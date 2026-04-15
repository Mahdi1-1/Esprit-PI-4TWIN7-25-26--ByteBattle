import { Link } from 'react-router';
import { AlertTriangle, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { Button } from '../Button';

interface VerificationBannerProps {
  companyName: string;
  verified: boolean;
  onRequestVerification?: () => void;
  showBlockMessage?: boolean;
}

export function VerificationBanner({ 
  companyName, 
  verified, 
  onRequestVerification,
  showBlockMessage = true 
}: VerificationBannerProps) {
  if (verified) {
    return (
      <div className="flex items-center gap-3 p-4 bg-[var(--state-success)]/10 border border-[var(--state-success)]/30 rounded-[var(--radius-md)]">
        <CheckCircle className="w-5 h-5 text-[var(--state-success)]" />
        <div className="flex-1">
          <span className="font-medium text-[var(--state-success)]">{companyName}</span>
          <span className="text-[var(--text-secondary)] ml-2">is a verified company</span>
        </div>
        <Shield className="w-4 h-4 text-[var(--state-success)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-[var(--state-warning)]/10 border border-[var(--state-warning)]/30 rounded-[var(--radius-md)]">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-[var(--state-warning)]" />
        <div>
          <span className="font-medium text-[var(--text-primary)]">{companyName}</span>
          <span className="text-[var(--text-secondary)] ml-2">is not verified</span>
        </div>
      </div>
      
      {showBlockMessage && (
        <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
          <AlertCircle className="w-4 h-4 text-[var(--state-warning)] flex-shrink-0 mt-0.5" />
          <p>
            Public actions are limited until your company is verified. 
            You can create internal roadmaps, courses, and employees-only content, 
            but public job postings, hackathons, and forum posts are blocked.
          </p>
        </div>
      )}
      
      {onRequestVerification && (
        <div className="flex gap-2 mt-2">
          <Button variant="primary" size="sm" onClick={onRequestVerification}>
            Request Verification
          </Button>
          <Link to="/help/company-verification" className="text-sm text-[var(--brand-primary)] hover:underline self-center">
            Learn about verification
          </Link>
        </div>
      )}
    </div>
  );
}