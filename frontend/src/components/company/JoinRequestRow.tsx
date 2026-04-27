import { useState } from 'react';
import { Avatar } from '../ui/avatar';
import { Button } from '../Button';
import { Check, X, Clock, User } from 'lucide-react';
import { JoinRequest, companyService } from '../../services/companyService';

interface JoinRequestRowProps {
  request: JoinRequest;
  companyId: string;
  onAction: (requestId: string, action: 'approve' | 'reject') => void;
  isProcessing?: boolean;
}

export function JoinRequestRow({ request, companyId, onAction, isProcessing = false }: JoinRequestRowProps) {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleApprove = async () => {
    setActionInProgress('approve');
    try {
      await companyService.respondToJoinRequest(companyId, request.userId, 'approve');
      onAction(request.id, 'approve');
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async () => {
    setActionInProgress('reject');
    try {
      await companyService.respondToJoinRequest(companyId, request.userId, 'reject');
      onAction(request.id, 'reject');
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border-default)]">
      <div className="flex items-center gap-4">
        {request.user.profileImage ? (
          <img 
            src={request.user.profileImage} 
            alt={request.user.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center">
            <User className="w-5 h-5 text-[var(--brand-primary)]" />
          </div>
        )}
        <div>
          <div className="font-semibold text-[var(--text-primary)]">{request.user.username}</div>
          <div className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
            <span>Level {request.user.level}</span>
            <span>•</span>
            <span>ELO {request.user.elo}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs text-[var(--text-muted)] mr-2 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(request.requestedAt).toLocaleDateString()}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReject}
          disabled={isProcessing || actionInProgress !== null}
          className="text-[var(--state-error)] hover:bg-[var(--state-error)]/10"
        >
          {actionInProgress === 'reject' ? (
            <span className="w-4 h-4 border-2 border-[var(--state-error)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleApprove}
          disabled={isProcessing || actionInProgress !== null}
        >
          {actionInProgress === 'approve' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}