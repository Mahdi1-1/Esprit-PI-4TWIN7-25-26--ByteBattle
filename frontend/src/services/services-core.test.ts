import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock axios ───────────────────────────────────────────────────────────────
vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../api/axios';
import { challengesService } from './challengesService';
import { submissionsService } from './submissionsService';
import { duelsService } from './duelsService';
import { leaderboardService } from './leaderboardService';

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockPatch = api.patch as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

beforeEach(() => { vi.clearAllMocks(); });

// ─────────────────────────────────────────────────────────────────────────────
// challengesService
// ─────────────────────────────────────────────────────────────────────────────

describe('challengesService', () => {
  describe('getAll()', () => {
    it('should call GET /challenges with params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], total: 0 } });
      const result = await challengesService.getAll({ page: 1, limit: 10, difficulty: 'easy' });
      expect(mockGet).toHaveBeenCalledWith('/challenges', { params: { page: 1, limit: 10, difficulty: 'easy' } });
      expect(result).toEqual({ data: [], total: 0 });
    });

    it('should call GET /challenges without params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], total: 0 } });
      await challengesService.getAll();
      expect(mockGet).toHaveBeenCalledWith('/challenges', { params: undefined });
    });
  });

  describe('getById()', () => {
    it('should call GET /challenges/:id', async () => {
      const challenge = { id: 'c1', title: 'Two Sum' };
      mockGet.mockResolvedValue({ data: challenge });
      const result = await challengesService.getById('c1');
      expect(mockGet).toHaveBeenCalledWith('/challenges/c1');
      expect(result).toEqual(challenge);
    });
  });

  describe('getRecommended()', () => {
    it('should call GET /challenges/recommended', async () => {
      mockGet.mockResolvedValue({ data: [{ id: 'c1' }] });
      const result = await challengesService.getRecommended();
      expect(mockGet).toHaveBeenCalledWith('/challenges/recommended');
      expect(result).toHaveLength(1);
    });
  });

  describe('generateDraft()', () => {
    it('should call POST /challenges/generate with payload', async () => {
      mockPost.mockResolvedValue({ data: { title: 'Draft' } });
      const result = await challengesService.generateDraft({ prompt: 'Build a sort', kind: 'CODE' });
      expect(mockPost).toHaveBeenCalledWith('/challenges/generate', { prompt: 'Build a sort', kind: 'CODE' });
      expect(result.title).toBe('Draft');
    });
  });

  describe('create()', () => {
    it('should call POST /challenges', async () => {
      mockPost.mockResolvedValue({ data: { id: 'new-c' } });
      const result = await challengesService.create({ title: 'New', kind: 'CODE' });
      expect(mockPost).toHaveBeenCalledWith('/challenges', { title: 'New', kind: 'CODE' });
      expect(result.id).toBe('new-c');
    });
  });

  describe('update()', () => {
    it('should call PATCH /challenges/:id', async () => {
      mockPatch.mockResolvedValue({ data: { id: 'c1', title: 'Updated' } });
      const result = await challengesService.update('c1', { title: 'Updated' });
      expect(mockPatch).toHaveBeenCalledWith('/challenges/c1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });
  });

  describe('delete()', () => {
    it('should call DELETE /challenges/:id', async () => {
      mockDelete.mockResolvedValue({ data: { deleted: true } });
      const result = await challengesService.delete('c1');
      expect(mockDelete).toHaveBeenCalledWith('/challenges/c1');
      expect(result.deleted).toBe(true);
    });
  });

  describe('getAllAdmin()', () => {
    it('should call GET /challenges/admin/all', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await challengesService.getAllAdmin({ page: 1 });
      expect(mockGet).toHaveBeenCalledWith('/challenges/admin/all', { params: { page: 1 } });
    });
  });

  describe('getByIdAdmin()', () => {
    it('should call GET /challenges/admin/:id', async () => {
      mockGet.mockResolvedValue({ data: { id: 'c1' } });
      await challengesService.getByIdAdmin('c1');
      expect(mockGet).toHaveBeenCalledWith('/challenges/admin/c1');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// submissionsService
// ─────────────────────────────────────────────────────────────────────────────

describe('submissionsService', () => {
  describe('submitCode()', () => {
    it('should call POST /submissions/code', async () => {
      mockPost.mockResolvedValue({ data: { id: 'sub-1', verdict: 'queued' } });
      const result = await submissionsService.submitCode({ challengeId: 'c1', kind: 'CODE', language: 'python3', code: 'print(1)' });
      expect(mockPost).toHaveBeenCalledWith('/submissions/code', expect.objectContaining({ challengeId: 'c1' }));
      expect(result.verdict).toBe('queued');
    });
  });

  describe('runCode()', () => {
    it('should call POST /submissions/run', async () => {
      mockPost.mockResolvedValue({ data: { verdict: 'AC', passed: 1, total: 1 } });
      const result = await submissionsService.runCode({ challengeId: 'c1', language: 'python3', code: 'print(1)' });
      expect(mockPost).toHaveBeenCalledWith('/submissions/run', { challengeId: 'c1', language: 'python3', code: 'print(1)' });
      expect(result.verdict).toBe('AC');
    });
  });

  describe('getMyHistory()', () => {
    it('should call GET /submissions/me with params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], total: 0 } });
      await submissionsService.getMyHistory({ page: 2, limit: 10, verdict: 'AC' });
      expect(mockGet).toHaveBeenCalledWith('/submissions/me', { params: { page: 2, limit: 10, verdict: 'AC' } });
    });

    it('should call GET /submissions/me without params', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await submissionsService.getMyHistory();
      expect(mockGet).toHaveBeenCalledWith('/submissions/me', { params: undefined });
    });
  });

  describe('getById()', () => {
    it('should call GET /submissions/:id', async () => {
      mockGet.mockResolvedValue({ data: { id: 'sub-1' } });
      const result = await submissionsService.getById('sub-1');
      expect(mockGet).toHaveBeenCalledWith('/submissions/sub-1');
      expect(result.id).toBe('sub-1');
    });
  });

  describe('getAiReview()', () => {
    it('should call POST /submissions/:id/ai-review', async () => {
      mockPost.mockResolvedValue({ data: { score: 85 } });
      const result = await submissionsService.getAiReview('sub-1');
      expect(mockPost).toHaveBeenCalledWith('/submissions/sub-1/ai-review');
      expect(result.score).toBe(85);
    });
  });

  describe('submitCanvas()', () => {
    it('should call POST /submissions/canvas', async () => {
      mockPost.mockResolvedValue({ data: { id: 'sub-2' } });
      await submissionsService.submitCanvas({ challengeId: 'c1', kind: 'CANVAS', canvasJson: {} });
      expect(mockPost).toHaveBeenCalledWith('/submissions/canvas', expect.objectContaining({ kind: 'CANVAS' }));
    });
  });

  describe('getAll()', () => {
    it('should call GET /submissions with params', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await submissionsService.getAll({ page: 1, verdict: 'WA' });
      expect(mockGet).toHaveBeenCalledWith('/submissions', { params: { page: 1, verdict: 'WA' } });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// duelsService
// ─────────────────────────────────────────────────────────────────────────────

describe('duelsService', () => {
  describe('createOrJoin()', () => {
    it('should call POST /duels/create with difficulty', async () => {
      mockPost.mockResolvedValue({ data: { id: 'duel-1', status: 'waiting' } });
      const result = await duelsService.createOrJoin('hard');
      expect(mockPost).toHaveBeenCalledWith('/duels/create', { difficulty: 'hard' });
      expect(result.status).toBe('waiting');
    });

    it('should use easy as default difficulty', async () => {
      mockPost.mockResolvedValue({ data: { id: 'duel-1' } });
      await duelsService.createOrJoin();
      expect(mockPost).toHaveBeenCalledWith('/duels/create', { difficulty: 'easy' });
    });
  });

  describe('getLeaderboard()', () => {
    it('should call GET /duels/leaderboard?limit=10', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await duelsService.getLeaderboard(10);
      expect(mockGet).toHaveBeenCalledWith('/duels/leaderboard?limit=10');
    });
  });

  describe('getHistory()', () => {
    it('should call GET /duels/history with page and limit', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await duelsService.getHistory(2, 15);
      expect(mockGet).toHaveBeenCalledWith('/duels/history?page=2&limit=15');
    });

    it('should use defaults page=1 limit=20', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await duelsService.getHistory();
      expect(mockGet).toHaveBeenCalledWith('/duels/history?page=1&limit=20');
    });
  });

  describe('getDuelState()', () => {
    it('should call GET /duels/:id', async () => {
      mockGet.mockResolvedValue({ data: { id: 'duel-1', status: 'active' } });
      const result = await duelsService.getDuelState('duel-1');
      expect(mockGet).toHaveBeenCalledWith('/duels/duel-1');
      expect(result.status).toBe('active');
    });
  });

  describe('getDuelResult()', () => {
    it('should call GET /duels/:id/result', async () => {
      mockGet.mockResolvedValue({ data: { id: 'duel-1', winnerId: 'u1' } });
      const result = await duelsService.getDuelResult('duel-1');
      expect(mockGet).toHaveBeenCalledWith('/duels/duel-1/result');
      expect(result.winnerId).toBe('u1');
    });
  });

  describe('getQueueStats()', () => {
    it('should call GET /duels/queue/stats', async () => {
      mockGet.mockResolvedValue({ data: { waitingDuels: 3 } });
      const result = await duelsService.getQueueStats();
      expect(mockGet).toHaveBeenCalledWith('/duels/queue/stats');
      expect(result.waitingDuels).toBe(3);
    });
  });

  describe('getMyStats()', () => {
    it('should call GET /duels/my-stats', async () => {
      mockGet.mockResolvedValue({ data: { duelsWon: 5 } });
      const result = await duelsService.getMyStats();
      expect(mockGet).toHaveBeenCalledWith('/duels/my-stats');
      expect(result.duelsWon).toBe(5);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// leaderboardService
// ─────────────────────────────────────────────────────────────────────────────

describe('leaderboardService', () => {
  describe('getGlobal()', () => {
    it('should call GET /leaderboard with params', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await leaderboardService.getGlobal({ page: 1, sort: 'elo', language: 'python3' });
      expect(mockGet).toHaveBeenCalledWith('/leaderboard', { params: { page: 1, sort: 'elo', language: 'python3' } });
    });

    it('should call GET /leaderboard without params', async () => {
      mockGet.mockResolvedValue({ data: {} });
      await leaderboardService.getGlobal();
      expect(mockGet).toHaveBeenCalledWith('/leaderboard', { params: undefined });
    });
  });

  describe('getLanguages()', () => {
    it('should call GET /leaderboard/languages', async () => {
      mockGet.mockResolvedValue({ data: { languages: ['python3'] } });
      const result = await leaderboardService.getLanguages();
      expect(mockGet).toHaveBeenCalledWith('/leaderboard/languages');
      expect(result.languages).toContain('python3');
    });
  });

  describe('getMyRank()', () => {
    it('should call GET /leaderboard/me', async () => {
      mockGet.mockResolvedValue({ data: { rank: 5 } });
      const result = await leaderboardService.getMyRank();
      expect(mockGet).toHaveBeenCalledWith('/leaderboard/me');
      expect(result.rank).toBe(5);
    });
  });

  describe('getMyStats()', () => {
    it('should call GET /leaderboard/stats', async () => {
      mockGet.mockResolvedValue({ data: { totalSubmissions: 20 } });
      const result = await leaderboardService.getMyStats();
      expect(mockGet).toHaveBeenCalledWith('/leaderboard/stats');
      expect(result.totalSubmissions).toBe(20);
    });
  });
});
