import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Check, Lock, Unlock, GripVertical, ChevronRight, BookOpen } from 'lucide-react';
import { CompanyRoadmap, RoadmapAssignment } from '../../services/companyService';

interface RoadmapStepListProps {
  roadmap: CompanyRoadmap;
  assignments?: RoadmapAssignment[];
  currentUserId?: string;
  isEditable?: boolean;
  onReorder?: (roadmapId: string, newOrder: number[]) => void;
  onAssign?: (roadmapId: string) => void;
}

export function RoadmapStepList({ 
  roadmap, 
  assignments = [], 
  currentUserId,
  isEditable = false,
  onReorder,
  onAssign 
}: RoadmapStepListProps) {
  const currentUserAssignment = currentUserId 
    ? assignments.find(a => a.userId === currentUserId) 
    : null;

  const getStepStatus = (index: number) => {
    if (!currentUserAssignment) return 'not_started';
    const progress = currentUserAssignment.progress;
    if (progress >= 100) return 'completed';
    if (progress > 0 && index <= Math.floor((progress / 100) * roadmap.challengeIds.length)) return 'completed';
    if (index === Math.floor((progress / 100) * roadmap.challengeIds.length)) return 'in_progress';
    return 'not_started';
  };

  const totalSteps = roadmap.challengeIds.length;
  const completedSteps = currentUserAssignment 
    ? Math.floor((currentUserAssignment.progress / 100) * totalSteps)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{roadmap.title}</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {totalSteps} challenges • {completedSteps} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={roadmap.visibility === 'public' ? 'default' : 'secondary'}>
            {roadmap.visibility === 'public' ? (
              <span className="flex items-center gap-1"><Unlock className="w-3 h-3" />Public</span>
            ) : (
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" />Employees Only</span>
            )}
          </Badge>
          {roadmap.type === 'custom' && isEditable && (
            <Badge variant="info">Custom</Badge>
          )}
        </div>
      </div>

      {roadmap.description && (
        <p className="text-sm text-[var(--text-secondary)]">{roadmap.description}</p>
      )}

      {currentUserAssignment && (
        <div className="w-full bg-[var(--surface-2)] rounded-full h-2">
          <div 
            className="bg-[var(--brand-primary)] h-2 rounded-full transition-all duration-300"
            style={{ width: `${currentUserAssignment.progress}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {roadmap.challengeIds.map((challengeId, index) => {
          const status = getStepStatus(index);
          return (
            <div 
              key={`${roadmap.id}-${challengeId}-${index}`}
              className={`flex items-center gap-3 p-4 rounded-[var(--radius-md)] border transition-colors ${
                status === 'completed' 
                  ? 'bg-[var(--state-success)]/10 border-[var(--state-success)]/30'
                  : status === 'in_progress'
                  ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30'
                  : 'bg-[var(--surface-2)] border-[var(--border-default)]'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                status === 'completed' 
                  ? 'bg-[var(--state-success)] text-white'
                  : status === 'in_progress'
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-[var(--surface-1)] text-[var(--text-muted)]'
              }`}>
                {status === 'completed' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <span className="text-[var(--text-primary)]">Challenge {challengeId}</span>
              </div>
              <Link to={`/problems/${challengeId}`}>
                <Button variant="ghost" size="sm">
                  <BookOpen className="w-4 h-4 mr-1" />
                  View
                </Button>
              </Link>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          );
        })}
      </div>

      {roadmap.challengeIds.length === 0 && (
        <div className="text-center py-8 text-[var(--text-muted)]">
          No challenges added to this roadmap yet.
        </div>
      )}
    </div>
  );
}