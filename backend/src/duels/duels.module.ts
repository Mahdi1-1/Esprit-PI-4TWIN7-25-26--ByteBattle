import { Module } from '@nestjs/common';
import { DuelsService } from './duels.service';
import { DuelsGateway } from './duels.gateway';
import { DuelsController } from './duels.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { AiModule } from '../ai/ai.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    AiModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DuelsController],
  providers: [DuelsService, DuelsGateway],
  exports: [DuelsService],
})
export class DuelsModule {}
