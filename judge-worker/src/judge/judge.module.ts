import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JudgeService } from './judge.service';
import { JudgeProcessor } from './judge.processor';
import { SandboxModule } from '../sandbox/sandbox.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'code-execution' }),
    SandboxModule,
    PrismaModule,
  ],
  providers: [JudgeService, JudgeProcessor],
  exports: [JudgeService],
})
export class JudgeModule {}
