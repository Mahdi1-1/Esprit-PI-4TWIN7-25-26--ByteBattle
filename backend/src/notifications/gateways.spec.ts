import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsGateway } from './notifications.gateway';

// ─── Socket mock factory ──────────────────────────────────────────────────────

const makeSocket = (overrides: Partial<any> = {}) => ({
  id: `socket-${Math.random().toString(36).slice(2)}`,
  handshake: { headers: {}, auth: {} },
  join: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsGateway
// ─────────────────────────────────────────────────────────────────────────────

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  const mockJwt = {
    verify: jest.fn().mockReturnValue({ sub: 'user-1', role: 'user' }),
  };
  const mockConfig = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    gateway.server = { emit: jest.fn(), to: jest.fn().mockReturnValue({ emit: jest.fn() }) } as any;
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(gateway).toBeDefined(); });

  describe('handleConnection()', () => {
    it('should disconnect client when no token provided', async () => {
      const client = makeSocket();
      await gateway.handleConnection(client as any);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should register client when valid Bearer token provided', async () => {
      const client = makeSocket({ id: 'sock-1', handshake: { auth: { token: 'Bearer valid-jwt' }, headers: {} } });
      mockJwt.verify.mockReturnValueOnce({ sub: 'user-1', role: 'user' });

      await gateway.handleConnection(client as any);

      expect(gateway.getOnlineUserCount()).toBe(1);
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect when token is invalid', async () => {
      const client = makeSocket({ handshake: { auth: { token: 'Bearer bad-jwt' }, headers: {} } });
      mockJwt.verify.mockImplementationOnce(() => { throw new Error('Invalid token'); });

      await gateway.handleConnection(client as any);

      expect(client.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect()', () => {
    it('should remove client from map on disconnect', async () => {
      const client = makeSocket({ id: 'sock-2', handshake: { auth: { token: 'Bearer tok' }, headers: {} } });
      mockJwt.verify.mockReturnValueOnce({ sub: 'user-2', role: 'user' });
      await gateway.handleConnection(client as any);

      gateway.handleDisconnect(client as any);

      expect(gateway.getOnlineUserCount()).toBe(0);
    });
  });

  describe('emitToUser()', () => {
    it('should emit to all sockets of a user', async () => {
      const client = makeSocket({ id: 'sock-3', handshake: { auth: { token: 'Bearer tok' }, headers: {} } });
      mockJwt.verify.mockReturnValueOnce({ sub: 'user-3', role: 'user' });
      await gateway.handleConnection(client as any);

      const toMock = jest.fn().mockReturnValue({ emit: jest.fn() });
      gateway.server = { to: toMock, emit: jest.fn() } as any;

      gateway.emitToUser('user-3', 'new_notification', { id: 'notif-1' });

      expect(toMock).toHaveBeenCalledWith('sock-3');
      expect(toMock().emit).toHaveBeenCalledWith('new_notification', { id: 'notif-1' });
    });

    it('should do nothing when user is not connected', () => {
      const emitSpy = jest.fn();
      gateway.server = { to: jest.fn().mockReturnValue({ emit: emitSpy }), emit: jest.fn() } as any;

      gateway.emitToUser('ghost-user', 'event', {});
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('emitBroadcast()', () => {
    it('should emit to all connected clients', () => {
      const emitSpy = jest.fn();
      gateway.server = { emit: emitSpy } as any;

      gateway.emitBroadcast('system_announcement', { message: 'Maintenance in 5 min' });

      expect(emitSpy).toHaveBeenCalledWith('system_announcement', { message: 'Maintenance in 5 min' });
    });
  });

  describe('getOnlineUserCount()', () => {
    it('should return 0 when no one is connected', () => {
      expect(gateway.getOnlineUserCount()).toBe(0);
    });
  });
});
