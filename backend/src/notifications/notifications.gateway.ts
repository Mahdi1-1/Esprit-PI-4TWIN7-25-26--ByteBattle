import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private clientMaps = new Map<string, string[]>(); // userId -> socketIds
  private userRoles = new Map<string, string>();     // userId -> role

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      const tokenHeader = client.handshake.auth?.token;
      
      const authStr = authHeader || tokenHeader;
      if (!authStr) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }
      
      const token = authStr.replace('Bearer ', '');
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      
      const userId = payload.sub;
      const role = payload.role || 'user';
      if (!this.clientMaps.has(userId)) {
        this.clientMaps.set(userId, []);
      }
      this.clientMaps.get(userId)!.push(client.id);
      this.userRoles.set(userId, role);

      this.logger.log(`Client connected to /notifications: ${client.id} (User: ${userId})`);
    } catch (e) {
      this.logger.error(`WS Connection error for ${client.id}: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, sockets] of this.clientMaps.entries()) {
      const idx = sockets.indexOf(client.id);
      if (idx !== -1) {
        sockets.splice(idx, 1);
        if (sockets.length === 0) {
          this.clientMaps.delete(userId);
          this.userRoles.delete(userId);
        }
        this.logger.log(`Client disconnected from /notifications: ${client.id} (User: ${userId})`);
        break;
      }
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.clientMaps.get(userId);
    if (sockets && sockets.length > 0) {
      sockets.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  emitBroadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * Returns the number of unique non-admin users currently connected.
   */
  getOnlineUserCount(): number {
    let count = 0;
    for (const [userId] of this.clientMaps) {
      if (this.userRoles.get(userId) !== 'admin') {
        count++;
      }
    }
    return count;
  }
}
