import { useState, useEffect, useCallback } from 'react';
import { hackathonsService } from '../services/hackathonsService';

interface ProblemStatus {
  status: 'solved' | 'attempted' | 'unattempted';
  time?: number;
  attempts: number;
  isFirstBlood: boolean;
}

interface ScoreboardRow {
  rank: number;
  teamId: string;
  teamName: string;
  members: { userId: string; role: string }[];
  solved: number;
  penalty: number;
  problems: Record<string, ProblemStatus>;
}

interface Scoreboard {
  hackathonId: string;
  title: string;
  status: string;
  challengeIds: string[];
  rows: ScoreboardRow[];
  isFrozen: boolean;
  generatedAt: string;
}

/**
 * T094 — Hook for managing scoreboard state with real-time updates.
 */
export function useScoreboard(hackathonId: string, onScoreboardUpdate?: (cb: (data: any) => void) => (() => void)) {
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  const fetchScoreboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await hackathonsService.getScoreboard(hackathonId);
      setScoreboard(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load scoreboard');
    } finally {
      setLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchScoreboard();
  }, [fetchScoreboard]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!onScoreboardUpdate) return;

    const cleanup = onScoreboardUpdate((delta: any) => {
      setScoreboard((prev) => {
        if (!prev) return prev;
        // If delta is a full scoreboard, replace
        if (delta.rows) return delta;
        // Otherwise merge delta (partial update)
        return { ...prev, ...delta };
      });
    });

    return cleanup;
  }, [onScoreboardUpdate]);

  return { scoreboard, loading, error, refetch: fetchScoreboard };
}

export type { Scoreboard, ScoreboardRow, ProblemStatus };
