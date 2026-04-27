import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { HackathonChatService } from './hackathon-chat.service';
import { HackathonClarificationService } from './hackathon-clarification.service';
import { HackathonYjsService } from './hackathon-yjs.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/hackathons',
})
export class HackathonsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(HackathonsGateway.name);

  /** socketId → userId */
  private clientMaps = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: HackathonChatService,
    private readonly clarificationService: HackathonClarificationService,
    private readonly yjsService: HackathonYjsService,
    private readonly prisma: PrismaService,
  ) {}

  // ────────────────────────────────────────────────────────
  // T048 — Connection handling
  // ────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      const tokenHeader = client.handshake.auth?.token;

      const authStr = authHeader || tokenHeader;
      if (!authStr) {
        this.logger.warn(`Client ${client.id} disconnected: No token`);
        client.disconnect();
        return;
      }

      const token = (authStr as string).replace('Bearer ', '');
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      this.clientMaps.set(client.id, payload.sub);
      this.logger.log(`Hackathon WS connected: ${client.id} (User: ${payload.sub})`);
    } catch (e) {
      this.logger.error(`Hackathon WS auth error ${client.id}: ${e.message}`);
      client.disconnect();
    }
  }

  // T049 — Disconnect
  handleDisconnect(client: Socket) {
    const userId = this.clientMaps.get(client.id);
    this.logger.log(`Hackathon WS disconnected: ${client.id} (User: ${userId})`);
    this.clientMaps.delete(client.id);
  }

  // ────────────────────────────────────────────────────────
  // T050 — Join hackathon room
  // ────────────────────────────────────────────────────────

  @SubscribeMessage('join_hackathon')
  handleJoinHackathon(
    @MessageBody() data: { hackathonId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.clientMaps.get(client.id);
    if (!userId) return;
    const room = `hackathon:${data.hackathonId}`;
    client.join(room);
    this.logger.log(`User ${userId} joined room ${room}`);
  }

  // T051 — Join team room (also admin room if applicable)
  @SubscribeMessage('join_team')
  handleJoinTeam(
    @MessageBody() data: { hackathonId: string; teamId: string; isAdmin?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.clientMaps.get(client.id);
    if (!userId) return;

    const teamRoom = `team:${data.teamId}`;
    client.join(teamRoom);
    this.logger.log(`User ${userId} joined team room ${teamRoom}`);

    if (data.isAdmin) {
      const adminRoom = `admin:${data.hackathonId}`;
      client.join(adminRoom);
      this.logger.log(`Admin ${userId} joined admin room ${adminRoom}`);
    }
  }

  // ────────────────────────────────────────────────────────
  // T052 — Team chat messages
  // ────────────────────────────────────────────────────────

  @SubscribeMessage('team_message')
  async handleTeamMessage(
    @MessageBody() data: { hackathonId: string; teamId: string; content: string; codeSnippet?: string; codeLanguage?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.clientMaps.get(client.id);
    if (!userId) return;

    try {
      const message = await this.chatService.sendMessage(
        data.hackathonId,
        data.teamId,
        userId,
        { content: data.content, codeSnippet: data.codeSnippet, codeLanguage: data.codeLanguage },
      );

      this.server.to(`team:${data.teamId}`).emit('team:message', message);
    } catch (err) {
      client.emit('error', { message: err.message });
    }
  }

  // ────────────────────────────────────────────────────────
  // T053 — Collaborative editing: Yjs CRDT sync
  // ────────────────────────────────────────────────────────

  @SubscribeMessage('collab_sync')
  handleCollabSync(
    @MessageBody() data: { teamId: string; hackathonId: string; challengeId: string; update: number[] },
    @ConnectedSocket() client: Socket,
  ) {
    // Relay Yjs update to all team members except sender
    client.to(`team:${data.teamId}`).emit('collab:sync', {
      challengeId: data.challengeId,
      update: data.update,
    });

    // Debounced persistence (T053b)
    this.yjsService.queueSnapshot(
      data.hackathonId,
      data.teamId,
      data.challengeId,
      Buffer.from(data.update),
    );
  }

  // T054 — Cursor awareness
  @SubscribeMessage('collab_awareness')
  handleCollabAwareness(
    @MessageBody() data: { teamId: string; awareness: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`team:${data.teamId}`).emit('collab:awareness', data.awareness);
  }

  // ────────────────────────────────────────────────────────
  // T066b — Anti-cheat event logging
  // ────────────────────────────────────────────────────────

  @SubscribeMessage('anticheat_event')
  async handleAnticheatEvent(
    @MessageBody() data: { hackathonId: string; teamId: string; eventType: string; details?: any },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.clientMaps.get(client.id);
    if (!userId) return;

    const event = {
      userId,
      teamId: data.teamId,
      eventType: data.eventType, // 'tab_switch' | 'copy_attempt' | 'paste_attempt' | 'blur' | 'fullscreen_exit'
      details: data.details,
      timestamp: new Date().toISOString(),
    };

    this.logger.warn(`🚨 ANTICHEAT [${data.eventType}] User=${userId} Team=${data.teamId} Hackathon=${data.hackathonId}`);

    // Q3: Persist violation count server-side
    try {
      const updated = await this.prisma.hackathonTeam.update({
        where: { id: data.teamId },
        data: { anticheatViolations: { increment: 1 } },
        select: { anticheatViolations: true },
      });
      // Include persisted count in the event for admin + client
      (event as any).totalViolations = updated.anticheatViolations;
    } catch (err) {
      this.logger.error(`Failed to persist anticheat violation: ${err.message}`);
    }

    // Notify admins in real-time
    this.server.to(`admin:${data.hackathonId}`).emit('admin:anticheat_alert', event);

    // Send back the persisted violation count to the reporter
    client.emit('anticheat:violation_count', { totalViolations: (event as any).totalViolations });
  }

  // ────────────────────────────────────────────────────────
  // EMIT HELPERS (called from services)
  // ────────────────────────────────────────────────────────

  /** T055 — Scoreboard update */
  emitScoreboardUpdate(hackathonId: string, scoreboardDelta: any) {
    this.server.to(`hackathon:${hackathonId}`).emit('scoreboard:update', scoreboardDelta);
  }

  /** T056 — Announcement broadcast */
  emitAnnouncement(hackathonId: string, announcement: any) {
    this.server.to(`hackathon:${hackathonId}`).emit('announcement:new', announcement);
  }

  /** T057 — Clarification response */
  emitClarificationResponse(
    hackathonId: string,
    teamId: string,
    clarification: any,
    isBroadcast: boolean,
  ) {
    if (isBroadcast) {
      this.server.to(`hackathon:${hackathonId}`).emit('clarification:response', clarification);
    } else {
      this.server.to(`team:${teamId}`).emit('clarification:response', clarification);
    }
  }

  /** T058 — Status change */
  emitStatusChange(hackathonId: string, newStatus: string, oldStatus: string) {
    this.server.to(`hackathon:${hackathonId}`).emit('hackathon:status_change', {
      hackathonId,
      oldStatus,
      newStatus,
    });
  }

  /** T059 — Submission verdict */
  emitSubmissionVerdict(teamId: string, submission: any) {
    this.server.to(`team:${teamId}`).emit('submission:verdict', submission);
  }

  /** T060 — Admin feed */
  emitAdminFeed(hackathonId: string, event: any) {
    this.server.to(`admin:${hackathonId}`).emit('admin:submission_feed', event);
    this.server.to(`admin:${hackathonId}`).emit('admin:team_activity', event);
  }
}
