import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../Button';
import { Input } from '../Input';
import { companiesService } from '../../services/companiesService';
import { toast } from 'react-hot-toast';
import { KeyRound, Plus, X, Building2, Loader2 } from 'lucide-react';

interface JoinCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export function JoinCompanyModal({ isOpen, onClose, initialCode }: JoinCompanyModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'join' | 'create'>(initialCode ? 'join' : 'join');
  const [joinCode, setJoinCode] = useState(initialCode || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a join code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await companiesService.joinByCode(joinCode.trim().toUpperCase());
      toast.success(result.message);
      onClose();
      navigate('/company-space');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Invalid join code';
      if (typeof message === 'string' && message.toLowerCase().includes('already pending')) {
        toast('Your join request is already pending approval.');
        onClose();
        navigate('/company-space');
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    setIsLoading(true);
    try {
      const company = await companiesService.createCompany({
        name: companyName,
        description: companyDescription,
        website: companyWebsite,
        industry: companyIndustry,
      });
      toast.success('Company created successfully!');
      onClose();
      navigate(`/companies/${company.id}/dashboard`);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create company';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {mode === 'join' ? 'Join a Company' : 'Create Company Space'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {mode === 'join' ? (
            <>
              <div className="text-sm text-[var(--text-secondary)] mb-4">
                Enter the invite code provided by a company owner or recruiter.
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Join Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <Input
                    placeholder="e.g. ABC123XY-MF5G9K"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="pl-11 text-center font-mono text-lg tracking-widest uppercase"
                    maxLength={32}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleJoin}
                disabled={isLoading || !joinCode.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Company'
                )}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-default)]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[var(--surface-1)] px-2 text-[var(--text-muted)]">OR</span>
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setMode('create')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your Own Company
              </Button>
            </>
          ) : (
            <>
              <div className="text-sm text-[var(--text-secondary)] mb-4">
                Create a new company space and become its owner. You'll get a unique join code to share with others.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Company Name *
                  </label>
                  <Input
                    placeholder="e.g. TechCorp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="What does your company do?"
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] min-h-[80px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      Website
                    </label>
                    <Input
                      placeholder="https://..."
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      Industry
                    </label>
                    <Input
                      placeholder="e.g. Technology"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleCreate}
                disabled={isLoading || !companyName.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 mr-2" />
                    Create Company
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setMode('join')}
              >
                Back to Join Code
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}