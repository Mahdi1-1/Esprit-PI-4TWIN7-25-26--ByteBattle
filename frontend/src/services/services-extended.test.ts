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

vi.mock('socket.io-client', () => {
  const handlers: Record<string, ((d?: any) => void)[]> = {};
  const socket = {
    connected: false,
    on: vi.fn((e: string, cb: any) => { handlers[e] = handlers[e] || []; handlers[e].push(cb); }),
    once: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    _trigger: (e: string, d?: any) => (handlers[e] || []).forEach(cb => cb(d)),
  };
  return { io: vi.fn().mockReturnValue(socket) };
});

import api from '../api/axios';
import { notificationsService } from './notificationsService';
import { discussionsService } from './discussionsService';
import { hackathonsService } from './hackathonsService';
import { profileService } from './profileService';

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockPatch = api.patch as ReturnType<typeof vi.fn>;
const mockPut = api.put as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

beforeEach(() => { vi.clearAllMocks(); });

// ─────────────────────────────────────────────────────────────────────────────
// notificationsService
// ─────────────────────────────────────────────────────────────────────────────

describe('notificationsService', () => {
  describe('getByPage()', () => {
    it('should call GET /notifications with pagination params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], total: 0 } });
      await notificationsService.getByPage(2, 10, 'hackathon', true);
      expect(mockGet).toHaveBeenCalledWith('/notifications', {
        params: { page: 2, limit: 10, category: 'hackathon', unreadOnly: true },
      });
    });

    it('should omit optional params when not provided', async () => {
      mockGet.mockResolvedValue({ data: {} });
      await notificationsService.getByPage();
      expect(mockGet).toHaveBeenCalledWith('/notifications', { params: { page: 1, limit: 20 } });
    });
  });

  describe('getUnreadCount()', () => {
    it('should call GET /notifications/unread-count and return count', async () => {
      mockGet.mockResolvedValue({ data: { count: 7 } });
      const result = await notificationsService.getUnreadCount();
      expect(mockGet).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toBe(7);
    });

    it('should return 0 when count field is missing', async () => {
      mockGet.mockResolvedValue({ data: {} });
      const result = await notificationsService.getUnreadCount();
      expect(result).toBe(0);
    });
  });

  describe('markRead()', () => {
    it('should call PATCH /notifications/:id/read', async () => {
      mockPatch.mockResolvedValue({ data: {} });
      await notificationsService.markRead('notif-1');
      expect(mockPatch).toHaveBeenCalledWith('/notifications/notif-1/read');
    });
  });

  describe('markAllRead()', () => {
    it('should call PATCH /notifications/read-all', async () => {
      mockPatch.mockResolvedValue({ data: {} });
      await notificationsService.markAllRead();
      expect(mockPatch).toHaveBeenCalledWith('/notifications/read-all');
    });
  });

  describe('archive()', () => {
    it('should call PATCH /notifications/:id/archive', async () => {
      mockPatch.mockResolvedValue({ data: {} });
      await notificationsService.archive('notif-1');
      expect(mockPatch).toHaveBeenCalledWith('/notifications/notif-1/archive');
    });
  });

  describe('bulkMarkRead()', () => {
    it('should call PATCH /notifications/bulk/read with ids', async () => {
      mockPatch.mockResolvedValue({ data: { updated: 3 } });
      const result = await notificationsService.bulkMarkRead(['n1', 'n2', 'n3']);
      expect(mockPatch).toHaveBeenCalledWith('/notifications/bulk/read', { ids: ['n1', 'n2', 'n3'] });
      expect(result.updated).toBe(3);
    });
  });

  describe('bulkArchive()', () => {
    it('should call PATCH /notifications/bulk/archive with ids', async () => {
      mockPatch.mockResolvedValue({ data: { updated: 2 } });
      const result = await notificationsService.bulkArchive(['n1', 'n2']);
      expect(mockPatch).toHaveBeenCalledWith('/notifications/bulk/archive', { ids: ['n1', 'n2'] });
      expect(result.updated).toBe(2);
    });
  });

  describe('getPreferences()', () => {
    it('should call GET /notifications/preferences', async () => {
      mockGet.mockResolvedValue({ data: { emailEnabled: true } });
      const result = await notificationsService.getPreferences();
      expect(mockGet).toHaveBeenCalledWith('/notifications/preferences');
      expect(result.emailEnabled).toBe(true);
    });
  });

  describe('updatePreferences()', () => {
    it('should call PUT /notifications/preferences', async () => {
      mockPut.mockResolvedValue({ data: { emailEnabled: false } });
      const result = await notificationsService.updatePreferences({ emailEnabled: false });
      expect(mockPut).toHaveBeenCalledWith('/notifications/preferences', { emailEnabled: false });
    });
  });

  describe('disconnect()', () => {
    it('should not throw when socket is null', () => {
      expect(() => notificationsService.disconnect()).not.toThrow();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// discussionsService
// ─────────────────────────────────────────────────────────────────────────────

describe('discussionsService', () => {
  describe('getAll()', () => {
    it('should call GET /discussions with params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], total: 0 } });
      await discussionsService.getAll({ page: 1, category: 'help', search: 'sort' });
      expect(mockGet).toHaveBeenCalledWith('/discussions', { params: { page: 1, category: 'help', search: 'sort' } });
    });
  });

  describe('getStats()', () => {
    it('should call GET /discussions/stats', async () => {
      mockGet.mockResolvedValue({ data: { totalDiscussions: 50 } });
      const result = await discussionsService.getStats();
      expect(mockGet).toHaveBeenCalledWith('/discussions/stats');
      expect(result.totalDiscussions).toBe(50);
    });
  });

  describe('getPopularTags()', () => {
    it('should call GET /discussions/tags/popular', async () => {
      mockGet.mockResolvedValue({ data: [{ tag: 'array', count: 15 }] });
      await discussionsService.getPopularTags();
      expect(mockGet).toHaveBeenCalledWith('/discussions/tags/popular');
    });
  });

  describe('getById()', () => {
    it('should call GET /discussions/:id', async () => {
      mockGet.mockResolvedValue({ data: { id: 'disc-1', title: 'Help!' } });
      const result = await discussionsService.getById('disc-1');
      expect(mockGet).toHaveBeenCalledWith('/discussions/disc-1');
      expect(result.id).toBe('disc-1');
    });
  });

  describe('create()', () => {
    it('should call POST /discussions', async () => {
      mockPost.mockResolvedValue({ data: { id: 'new-disc' } });
      const result = await discussionsService.create({ title: 'Q', content: 'Content', category: 'general', tags: [] });
      expect(mockPost).toHaveBeenCalledWith('/discussions', expect.objectContaining({ title: 'Q' }));
      expect(result.id).toBe('new-disc');
    });
  });

  describe('update()', () => {
    it('should call PATCH /discussions/:id', async () => {
      mockPatch.mockResolvedValue({ data: { id: 'disc-1', title: 'Updated' } });
      await discussionsService.update('disc-1', { title: 'Updated' });
      expect(mockPatch).toHaveBeenCalledWith('/discussions/disc-1', { title: 'Updated' });
    });
  });

  describe('delete()', () => {
    it('should call DELETE /discussions/:id', async () => {
      mockDelete.mockResolvedValue({ data: {} });
      await discussionsService.delete('disc-1');
      expect(mockDelete).toHaveBeenCalledWith('/discussions/disc-1');
    });
  });

  describe('vote()', () => {
    it('should call POST /discussions/:id/vote', async () => {
      mockPost.mockResolvedValue({ data: { upvotes: ['u1'] } });
      await discussionsService.vote('disc-1', 'upvote');
      expect(mockPost).toHaveBeenCalledWith('/discussions/disc-1/vote', { type: 'upvote' });
    });
  });

  describe('createComment()', () => {
    it('should call POST /discussions/:id/comments', async () => {
      mockPost.mockResolvedValue({ data: { id: 'cmt-1' } });
      await discussionsService.addComment('disc-1', { content: 'Nice!', parentCommentId: undefined });
      expect(mockPost).toHaveBeenCalledWith('/discussions/disc-1/comments', { content: 'Nice!', parentCommentId: undefined });
    });
  });

  describe('getComments()', () => {
    it('should call GET /discussions/:id/revisions', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await discussionsService.getRevisions('disc-1');
      expect(mockGet).toHaveBeenCalledWith('/discussions/disc-1/revisions');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hackathonsService
// ─────────────────────────────────────────────────────────────────────────────

describe('hackathonsService', () => {
  describe('getAll()', () => {
    it('should call GET /hackathons with params', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await hackathonsService.getAll({ page: 1, status: 'active' });
      expect(mockGet).toHaveBeenCalledWith('/hackathons', { params: { page: 1, status: 'active' } });
    });
  });

  describe('getById()', () => {
    it('should call GET /hackathons/:id', async () => {
      mockGet.mockResolvedValue({ data: { id: 'h1', title: 'ByteBattle' } });
      const result = await hackathonsService.getById('h1');
      expect(mockGet).toHaveBeenCalledWith('/hackathons/h1');
      expect(result.title).toBe('ByteBattle');
    });
  });

  describe('getScoreboard()', () => {
    it('should call GET /hackathons/:id/scoreboard', async () => {
      mockGet.mockResolvedValue({ data: { rows: [] } });
      await hackathonsService.getScoreboard('h1');
      expect(mockGet).toHaveBeenCalledWith('/hackathons/h1/scoreboard');
    });
  });

  describe('createTeam()', () => {
    it('should call POST /hackathons/:id/teams', async () => {
      mockPost.mockResolvedValue({ data: { id: 'team-1' } });
      await hackathonsService.createTeam('h1', 'Alpha');
      expect(mockPost).toHaveBeenCalledWith('/hackathons/h1/teams', { name: 'Alpha' });
    });
  });

  describe('joinTeamByCode()', () => {
    it('should call POST /hackathons/:id/teams/join', async () => {
      mockPost.mockResolvedValue({ data: {} });
      await hackathonsService.joinTeamByCode('h1', 'CODE123');
      expect(mockPost).toHaveBeenCalledWith('/hackathons/h1/teams/join', { joinCode: 'CODE123' });
    });
  });

  describe('submitCode()', () => {
    it('should call POST /hackathons/:id/teams/:teamId/submit', async () => {
      mockPost.mockResolvedValue({ data: { id: 'sub-1' } });
      await hackathonsService.submitCode('h1', 'team-1', { challengeId: 'c1', language: 'python3', code: 'x' });
      expect(mockPost).toHaveBeenCalledWith('/hackathons/h1/teams/team-1/submit', { challengeId: 'c1', language: 'python3', code: 'x' });
    });
  });

  describe('getChatMessages()', () => {
    it('should call GET /hackathons/:id/teams/:teamId/messages', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await hackathonsService.getTeamMessages('h1', 'team-1');
      expect(mockGet).toHaveBeenCalledWith('/hackathons/h1/teams/team-1/messages', { params: undefined });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// profileService
// ─────────────────────────────────────────────────────────────────────────────

describe('profileService', () => {
  describe('updateProfile()', () => {
    it('should call PATCH /users/me', async () => {
      mockPatch.mockResolvedValue({ data: { id: 'u1', bio: 'Updated' } });
      const result = await profileService.updateProfile({ bio: 'Updated' });
      expect(mockPatch).toHaveBeenCalledWith('/users/me', { bio: 'Updated' });
      expect(result.bio).toBe('Updated');
    });
  });

  describe('getProfileStats()', () => {
    it('should call GET /users/me/stats', async () => {
      mockGet.mockResolvedValue({ data: { elo: 1400 } });
      const result = await profileService.getProfileStats();
      expect(mockGet).toHaveBeenCalledWith('/users/me/stats');
      expect(result.elo).toBe(1400);
    });
  });

  describe('changePassword()', () => {
    it('should call PATCH /users/me/password', async () => {
      mockPost.mockResolvedValue({ data: { success: true } });
      await profileService.changePassword({ currentPassword: 'old', newPassword: 'new' });
      expect(mockPatch).toHaveBeenCalledWith('/users/me/password', { currentPassword: 'old', newPassword: 'new' });
    });
  });

  describe('changeEmail()', () => {
    it('should call PATCH /users/me/email', async () => {
      mockPost.mockResolvedValue({ data: {} });
      await profileService.changeEmail({ currentPassword: 'pass', newEmail: 'new@x.com' });
      expect(mockPatch).toHaveBeenCalledWith('/users/me/email', { currentPassword: 'pass', newEmail: 'new@x.com' });
    });
  });

  describe('deleteAccount()', () => {
    it('should call DELETE /users/me', async () => {
      mockDelete.mockResolvedValue({ data: { success: true } });
      await profileService.deleteAccount({ currentPassword: 'pass' });
      expect(mockDelete).toHaveBeenCalledWith('/users/me', { data: { currentPassword: 'pass' } });
    });
  });
});
