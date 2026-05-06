import { describe, it, expect, vi, beforeEach } from 'vitest';

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
import { teamsService } from './teamsService';
import { hintsService } from './hintsService';
import { adminService } from './adminService';
import { avatarService } from './avatarService';
import { canvasService } from './canvasService';

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockPatch = api.patch as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

beforeEach(() => { vi.clearAllMocks(); });

// ─────────────────────────────────────────────────────────────────────────────
// teamsService
// ─────────────────────────────────────────────────────────────────────────────

describe('teamsService', () => {
  describe('create()', () => {
    it('should call POST /teams', async () => {
      mockPost.mockResolvedValue({ data: { id: 'team-1', name: 'Alpha' } });
      const result = await teamsService.create('Alpha');
      expect(mockPost).toHaveBeenCalledWith('/teams', { name: 'Alpha' });
      expect(result.name).toBe('Alpha');
    });
  });

  describe('getMine()', () => {
    it('should call GET /teams/mine', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await teamsService.getMine();
      expect(mockGet).toHaveBeenCalledWith('/teams/mine');
    });
  });

  describe('getAll()', () => {
    it('should call GET /teams/all', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await teamsService.getAll();
      expect(mockGet).toHaveBeenCalledWith('/teams/all');
    });
  });

  describe('getTeam()', () => {
    it('should call GET /teams/:id', async () => {
      mockGet.mockResolvedValue({ data: { id: 'team-1' } });
      const result = await teamsService.getTeam('team-1');
      expect(mockGet).toHaveBeenCalledWith('/teams/team-1');
      expect(result.id).toBe('team-1');
    });
  });

  describe('requestJoinByCode()', () => {
    it('should call POST /teams/request-join with joinCode', async () => {
      mockPost.mockResolvedValue({ data: { success: true } });
      await teamsService.requestJoinByCode('CODE123');
      expect(mockPost).toHaveBeenCalledWith('/teams/request-join', { joinCode: 'CODE123' });
    });
  });

  describe('approveJoinRequest()', () => {
    it('should call POST /teams/:id/join-requests/:userId/accept', async () => {
      mockPost.mockResolvedValue({ data: {} });
      await teamsService.approveJoinRequest('team-1', 'user-1');
      expect(mockPost).toHaveBeenCalledWith('/teams/team-1/join-requests/user-1/accept');
    });
  });

  describe('rejectJoinRequest()', () => {
    it('should call POST /teams/:id/join-requests/:userId/reject', async () => {
      mockPost.mockResolvedValue({ data: {} });
      await teamsService.rejectJoinRequest('team-1', 'user-1');
      expect(mockPost).toHaveBeenCalledWith('/teams/team-1/join-requests/user-1/reject');
    });
  });

  describe('leaveTeam()', () => {
    it('should call DELETE /teams/:id/leave', async () => {
      mockDelete.mockResolvedValue({ data: {} });
      await teamsService.leaveTeam('team-1');
      expect(mockDelete).toHaveBeenCalledWith('/teams/team-1/leave');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hintsService
// ─────────────────────────────────────────────────────────────────────────────

describe('hintsService', () => {
  describe('recommendLevel()', () => {
    it('should call POST /hints/recommend-level', async () => {
      mockPost.mockResolvedValue({ data: { recommendedHintLevel: 2 } });
      const result = await hintsService.recommendLevel({ challengeId: 'c1', minutesStuck: 5, attemptsCount: 3 });
      expect(mockPost).toHaveBeenCalledWith('/hints/recommend-level', { challengeId: 'c1', minutesStuck: 5, attemptsCount: 3 });
      expect(result.recommendedHintLevel).toBe(2);
    });
  });

  describe('getHint()', () => {
    it('should call POST /hints/serve', async () => {
      mockPost.mockResolvedValue({ data: { hint: 'Try a hash map.', level: 2 } });
      const result = await hintsService.getHint({ challengeId: 'c1', language: 'python3', targetLevel: 2 });
      expect(mockPost).toHaveBeenCalledWith('/hints/serve', { challengeId: 'c1', language: 'python3', targetLevel: 2 });
      expect(result.hint).toBe('Try a hash map.');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// adminService
// ─────────────────────────────────────────────────────────────────────────────

describe('adminService', () => {
  describe('getDashboardStats()', () => {
    it('should call GET /admin/dashboard', async () => {
      mockGet.mockResolvedValue({ data: { totalUsers: 100 } });
      const result = await adminService.getDashboardStats();
      expect(mockGet).toHaveBeenCalledWith('/admin/dashboard');
      expect(result.totalUsers).toBe(100);
    });
  });

  describe('getJobQueue()', () => {
    it('should call GET /admin/monitoring/jobs with params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], total: 0 } });
      await adminService.getJobQueue({ page: 1, limit: 20 });
      expect(mockGet).toHaveBeenCalledWith('/admin/monitoring/jobs', { params: { page: 1, limit: 20 } });
    });
  });

  describe('getReports()', () => {
    it('should call GET /admin/reports with params', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await adminService.getReports({ page: 1, status: 'open' });
      expect(mockGet).toHaveBeenCalledWith('/admin/reports', { params: { page: 1, status: 'open' } });
    });
  });

  describe('updateReportStatus()', () => {
    it('should call PATCH /admin/reports/:id', async () => {
      mockPatch.mockResolvedValue({ data: { id: 'rep-1', status: 'resolved' } });
      await adminService.updateReportStatus('rep-1', 'resolved');
      expect(mockPatch).toHaveBeenCalledWith('/admin/reports/rep-1', { status: 'resolved' });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// avatarService
// ─────────────────────────────────────────────────────────────────────────────

describe('avatarService', () => {
  describe('getMyAvatar()', () => {
    it('should call GET /avatar/me', async () => {
      mockGet.mockResolvedValue({ data: { avatar: { id: 'av-1' } } });
      const result = await avatarService.getMyAvatar();
      expect(mockGet).toHaveBeenCalledWith('/avatar/me');
      expect(result.avatar.id).toBe('av-1');
    });
  });

  describe('saveAvatar()', () => {
    it('should call POST /avatar/save with glbUrl', async () => {
      mockPost.mockResolvedValue({ data: { id: 'av-1' } });
      await avatarService.saveAvatar('https://models.readyplayer.me/abc.glb');
      expect(mockPost).toHaveBeenCalledWith('/avatar/save', { glbUrl: 'https://models.readyplayer.me/abc.glb', scene: undefined, expression: undefined });
    });
  });

  describe('getUserAvatar()', () => {
    it('should call GET /avatar/user/:userId', async () => {
      mockGet.mockResolvedValue({ data: { avatar: null } });
      await avatarService.getUserAvatar('user-1');
      expect(mockGet).toHaveBeenCalledWith('/avatar/user/user-1');
    });
  });

  describe('updateExpression()', () => {
    it('should call PATCH /avatar/expression', async () => {
      mockPatch.mockResolvedValue({ data: { expression: 'happy' } });
      await avatarService.updateExpression('happy');
      expect(mockPatch).toHaveBeenCalledWith('/avatar/expression', { expression: 'happy' });
    });
  });

  describe('updateScene()', () => {
    it('should call PATCH /avatar/scene', async () => {
      mockPatch.mockResolvedValue({ data: { scene: 'office' } });
      await avatarService.updateScene('office');
      expect(mockPatch).toHaveBeenCalledWith('/avatar/scene', { scene: 'office' });
    });
  });

  describe('refreshAvatar()', () => {
    it('should call POST /avatar/refresh', async () => {
      mockPost.mockResolvedValue({ data: { renderUrl: '/renders/abc.png' } });
      const result = await avatarService.refreshAvatar();
      expect(mockPost).toHaveBeenCalledWith('/avatar/refresh');
      expect(result.renderUrl).toBeDefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// canvasService
// ─────────────────────────────────────────────────────────────────────────────

describe('canvasService', () => {
  describe('getChallenges()', () => {
    it('should call GET /challenges with kind=CANVAS', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await canvasService.getChallenges({ difficulty: 'easy' });
      expect(mockGet).toHaveBeenCalledWith('/challenges', expect.objectContaining({
        params: expect.objectContaining({ kind: 'CANVAS' }),
      }));
    });
  });

  describe('getChallengeById()', () => {
    it('should call GET /challenges/:id', async () => {
      mockGet.mockResolvedValue({ data: { id: 'c1', category: 'architecture', description: '', difficulty: 'easy' } });
      const result = await canvasService.getChallengeById('c1');
      expect(mockGet).toHaveBeenCalledWith('/challenges/c1');
      expect(result.id).toBe('c1');
    });
  });

  describe('getDraft()', () => {
    it('should call GET /submissions/draft/:challengeId', async () => {
      mockGet.mockResolvedValue({ data: null });
      await canvasService.getDraft('c1');
      expect(mockGet).toHaveBeenCalledWith('/submissions/draft/c1');
    });
  });

  describe('saveDraft()', () => {
    it('should call POST /submissions/draft', async () => {
      mockPost.mockResolvedValue({ data: { id: 'draft-1' } });
      await canvasService.saveDraft('c1', { elements: [] });
      expect(mockPost).toHaveBeenCalledWith('/submissions/draft', expect.objectContaining({ challengeId: 'c1' }));
    });
  });

  describe('submitChallenge()', () => {
    it('should call POST /submissions/code', async () => {
      mockPost.mockResolvedValue({ data: { id: 'sub-1', verdict: 'pending' } });
      await canvasService.submitChallenge('c1', { imageData: 'x', elements: [], mode: 'practice' });
      expect(mockPost).toHaveBeenCalledWith('/submissions/code', expect.objectContaining({
        challengeId: 'c1',
        kind: 'CANVAS',
      }));
    });
  });
});
