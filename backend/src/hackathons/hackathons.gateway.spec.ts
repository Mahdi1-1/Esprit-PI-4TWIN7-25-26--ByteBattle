import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HackathonsGateway } from './hackathons.gateway';
import { HackathonChatService } from './hackathon-chat.service';
import { HackathonClarificationService } from './hackathon-clarification.service';
import { HackathonYjsService } from './hackathon-yjs.service';
import { PrismaService } from '../prisma/prisma.service';

// ──────────────────────────────────────────────────────────────────────────────
// Unit tests — HackathonsGateway.handleAnticheatEvent()
//
// Covers spec-010 requirements:
//   • Q3: violations persisted atomically via { increment: 1 }
//   • WS4 scénario 9: admin:anticheat_alert emitted to admin room
//   • Q3: anticheat:violation_count sent back to reporter client
//   • WS4 scénario 9: logger.warn fires with correct format
//   • Error resilience: DB failure does not crash the gateway
// ──────────────────────────────────────────────────────────────────────────────

const HACKATHON_ID = 'h1';
const TEAM_ID = 'team1';
const USER_ID = 'user42';
const SOCKET_ID = 'socket-abc';

// ── Factories ──────────────────────────────────────────────────────────────────

function makeAnticheatPayload(overrides: any = {}) {
  return {
    hackathonId: HACKATHON_ID,
    teamId: TEAM_ID,
    eventType: 'tab_switch',
    details: { timestamp: Date.now() },
    ...overrides,
  };
}

function makeClientSocket(overrides: any = {}) {
  return {
    id: SOCKET_ID,
    emit: jest.fn(),
    join: jest.fn(),
    to: jest.fn().mockReturnThis(),
    ...overrides,
  };
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('HackathonsGateway — handleAnticheatEvent()', () => {
  let gateway: HackathonsGateway;
  let prismaMock: any;
  let serverMock: any;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(async () => {
    prismaMock = {
      hackathonTeam: {
        update: jest.fn().mockResolvedValue({ anticheatViolations: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonsGateway,
        { provide: JwtService, useValue: { verify: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
        { provide: HackathonChatService, useValue: { sendMessage: jest.fn(), getMessages: jest.fn() } },
        { provide: HackathonClarificationService, useValue: { create: jest.fn(), findAll: jest.fn(), respond: jest.fn() } },
        { provide: HackathonYjsService, useValue: { queueSnapshot: jest.fn(), getSnapshot: jest.fn() } },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    gateway = module.get<HackathonsGateway>(HackathonsGateway);

    // Mock the WebSocket server
    serverMock = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    (gateway as any).server = serverMock;

    // Map socket → userId (simulates a connected authenticated user)
    (gateway as any).clientMaps.set(SOCKET_ID, USER_ID);

    // Spy on logger.warn
    loggerWarnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Q3: DB persistence ───────────────────────────────────────────────────────

  describe('Q3 — Atomic violation persistence', () => {
    it('should call prisma.hackathonTeam.update with { increment: 1 }', async () => {
      const client = makeClientSocket();

      await gateway.handleAnticheatEvent(makeAnticheatPayload(), client as any);

      expect(prismaMock.hackathonTeam.update).toHaveBeenCalledWith({
        where: { id: TEAM_ID },
        data: { anticheatViolations: { increment: 1 } },
        select: { anticheatViolations: true },
      });
    });

    it('should persist for every event type', async () => {
      const eventTypes = ['tab_switch', 'blur', 'copy_attempt', 'paste_attempt', 'devtools_attempt'];

      for (const eventType of eventTypes) {
        prismaMock.hackathonTeam.update.mockClear();
        prismaMock.hackathonTeam.update.mockResolvedValue({ anticheatViolations: 1 });

        await gateway.handleAnticheatEvent(
          makeAnticheatPayload({ eventType }),
          makeClientSocket() as any,
        );

        expect(prismaMock.hackathonTeam.update).toHaveBeenCalledTimes(1);
      }
    });

    it('should not throw if DB update fails — graceful degradation', async () => {
      prismaMock.hackathonTeam.update.mockRejectedValue(new Error('DB connection lost'));
      const client = makeClientSocket();

      await expect(
        gateway.handleAnticheatEvent(makeAnticheatPayload(), client as any),
      ).resolves.not.toThrow();
    });

    it('should still emit admin:anticheat_alert even when DB update fails', async () => {
      prismaMock.hackathonTeam.update.mockRejectedValue(new Error('DB error'));
      const client = makeClientSocket();

      await gateway.handleAnticheatEvent(makeAnticheatPayload(), client as any);

      expect(serverMock.to).toHaveBeenCalledWith(`admin:${HACKATHON_ID}`);
      expect(serverMock.emit).toHaveBeenCalledWith('admin:anticheat_alert', expect.any(Object));
    });
  });

  // ── WS4 scénario 9: admin:anticheat_alert ───────────────────────────────────

  describe('WS4 — admin:anticheat_alert emission', () => {
    it('should emit admin:anticheat_alert to the correct admin room', async () => {
      const client = makeClientSocket();

      await gateway.handleAnticheatEvent(makeAnticheatPayload(), client as any);

      expect(serverMock.to).toHaveBeenCalledWith(`admin:${HACKATHON_ID}`);
      expect(serverMock.emit).toHaveBeenCalledWith(
        'admin:anticheat_alert',
        expect.objectContaining({
          userId: USER_ID,
          teamId: TEAM_ID,
          eventType: 'tab_switch',
        }),
      );
    });

    it('should include totalViolations from DB in the admin alert payload', async () => {
      prismaMock.hackathonTeam.update.mockResolvedValue({ anticheatViolations: 5 });
      const client = makeClientSocket();

      await gateway.handleAnticheatEvent(makeAnticheatPayload(), client as any);

      expect(serverMock.emit).toHaveBeenCalledWith(
        'admin:anticheat_alert',
        expect.objectContaining({ totalViolations: 5 }),
      );
    });

    it('should include timestamp in the admin alert payload', async () => {
      const client = makeClientSocket();

      await gateway.handleAnticheatEvent(makeAnticheatPayload(), client as any);

      expect(serverMock.emit).toHaveBeenCalledWith(
        'admin:anticheat_alert',
        expect.objectContaining({ timestamp: expect.any(String) }),
      );
    });

    it('should include details in the admin alert payload', async () => {
      const details = { timestamp: 1234567890, extra: 'data' };
      const client = makeClientSocket();

      await gateway.handleAnticheatEvent(
        makeAnticheatPayload({ details }),
        client as any,
      );

      expect(serverMock.emit).toHaveBeenCalledWith(
        'admin:anticheat_alert',
        expect.objectContaining({ details }),
      );
    });
  });

  // ── Q3: anticheat:violation_count sent back to reporter ─────────────────────

  describe('Q3 — anticheat:violation_count sent to reporter client', () => {
    it('should emit anticheat:violation_count back to the reporter socket', async () => {
      prismaMock.hackathonTeam.update.mockResolvedValue({ anticheatViolations: 3 });
      const client = makeClientSocket();

      await gateway.handleAnticheatEvent(makeAnticheatPayload(), client as any);

      expect(client.emit).toHaveBeenCalledWith(
        'anticheat:violation_count',
        { totalViolations: 3 },
      );
    });

    it('should reflect the persisted count from DB (not local increment)', async () => {
      prismaMock.hackathonTeam.update.mockResolvedValue({ anticheatViolations: 7 });
      const client = makeClientSocket();

      await gateway.handleAnticheatEvent(makeAnticheatPayload(), client as any);

      expect(client.emit).toHaveBeenCalledWith(
        'anticheat:violation_count',
        { totalViolations: 7 },
      );
    });

    it('should send count=1 on first violation', async () => {
      prismaMock.hackathonTeam.update.mockResolvedValue({ anticheatViolations: 1 });
      const client = makeClientSocket();

      await gateway.handleAnticheatEvent(makeAnticheatPayload(), client as any);

      expect(client.emit).toHaveBeenCalledWith('anticheat:violation_count', { totalViolations: 1 });
    });
  });

  // ── WS4 scénario 9: logger.warn format ──────────────────────────────────────

  describe('WS4 — Logger.warn format', () => {
    it('should call logger.warn with the correct 🚨 ANTICHEAT format', async () => {
      const client = makeClientSocket();

      await gateway.handleAnticheatEvent(
        makeAnticheatPayload({ eventType: 'paste_attempt' }),
        client as any,
      );

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚨 ANTICHEAT'),
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('paste_attempt'),
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(USER_ID),
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(TEAM_ID),
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(HACKATHON_ID),
      );
    });
  });

  // ── Auth: unauthenticated socket ignored ─────────────────────────────────────

  describe('Auth — unauthenticated socket', () => {
    it('should silently return when socket has no associated userId', async () => {
      const unknownClient = makeClientSocket({ id: 'unknown-socket' });
      // 'unknown-socket' is NOT in clientMaps

      await gateway.handleAnticheatEvent(makeAnticheatPayload(), unknownClient as any);

      expect(prismaMock.hackathonTeam.update).not.toHaveBeenCalled();
      expect(serverMock.emit).not.toHaveBeenCalled();
      expect(unknownClient.emit).not.toHaveBeenCalled();
    });
  });
});
