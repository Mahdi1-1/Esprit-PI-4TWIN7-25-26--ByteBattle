import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'submissions',
})
export class SubmissionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SubmissionsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to submissions: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from submissions: ${client.id}`);
  }

  @SubscribeMessage('subscribe_user')
  handleSubscribeUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data && data.userId) {
      const roomName = `user:${data.userId}`;
      client.join(roomName);
      this.logger.log(`Client ${client.id} joined room ${roomName}`);
    }
  }

  emitSubmissionStatus(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit('submission_status', data);
  }
}
