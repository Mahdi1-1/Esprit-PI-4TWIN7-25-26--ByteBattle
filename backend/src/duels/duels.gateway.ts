import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { DuelsService } from "./duels.service";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/duels",
})
export class DuelsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DuelsGateway.name);
  private clientMaps = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly duelsService: DuelsService,
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

      const token = authStr.replace("Bearer ", "");
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });

      this.clientMaps.set(client.id, payload.sub);
      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
    } catch (e) {
      this.logger.error(`WS Connection error for ${client.id}: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.clientMaps.get(client.id);
    this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
    this.clientMaps.delete(client.id);
  }

  @SubscribeMessage("join_duel")
  async handleJoinDuel(
    @MessageBody() data: { duelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.clientMaps.get(client.id);
    if (!userId) return;

    this.logger.log(`User ${userId} joining duel room ${data.duelId}`);
    client.join(data.duelId);

    try {
      const state = await this.duelsService.getDuelState(data.duelId);
      this.server.to(data.duelId).emit("duel_state_update", state);
    } catch (err) {
      this.logger.error(`Error joining duel: ${err.message}`);
    }
  }

  @SubscribeMessage("player_ready")
  async handlePlayerReady(
    @MessageBody() data: { duelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.clientMaps.get(client.id);
    if (!userId) return;

    this.logger.log(`User ${userId} ready in duel ${data.duelId}`);
    try {
      const state = await this.duelsService.setPlayerReady(data.duelId, userId);
      this.server.to(data.duelId).emit("duel_state_update", state);
    } catch (err) {
      client.emit("error", { message: err.message });
    }
  }

  @SubscribeMessage("test_code")
  async handleTestCode(
    @MessageBody()
    data: {
      duelId: string;
      code: string;
      language: string;
      hintsUsed?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.clientMaps.get(client.id);
    if (!userId) {
      this.logger.log(
        `Unauthorized test code request from socket ${client.id}`,
      );
      return;
    }

    try {
      const result = await this.duelsService.testCode(
        data.duelId,
        userId,
        data.code,
        data.language,
        data.hintsUsed || 0,
      );

      // Notify both players of the progress
      const state = await this.duelsService.getDuelState(data.duelId);
      this.server.to(data.duelId).emit("duel_state_update", state);

      // Send specific test results ONLY back to the sender
      client.emit("test_result", result);

      if (state.status === "completed") {
        this.server.to(data.duelId).emit("duel_ended", {
          winnerId: state.winnerId,
          scores: {
            player1: state.player1.score,
            player2: state.player2.score,
          },
        });
      }
    } catch (err) {
      client.emit("error", { message: err.message });
    }
  }

  @SubscribeMessage("anticheat_event")
  async handleAnticheatEvent(
    @MessageBody() data: { duelId: string; type: string; count: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.clientMaps.get(client.id);
    if (!userId) return;

    try {
      if (data.type === "focus_lost") {
        const state = await this.duelsService.applyFocusLost(
          data.duelId,
          userId,
        );
        this.server.to(data.duelId).emit("duel_state_update", state);

        const player =
          state.player1.id === userId ? state.player1 : state.player2;
        this.server.to(data.duelId).emit("chat_message", {
          sender: "System 🛡️",
          text: `⚠️ L'anti-cheat a détecté que ${player.username} a quitté la page ! (-10 pts)`,
        });
      }
    } catch (err) {
      this.logger.error(`Anticheat error: ${err.message}`);
    }
  }
}
