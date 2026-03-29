import { Module } from '@nestjs/common';
import { AvatarController } from './avatar.controller';
import { RpmAvatarService } from './services/rpm-avatar.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AvatarController],
  providers: [RpmAvatarService],
  exports: [RpmAvatarService]
})
export class AvatarModule {}
