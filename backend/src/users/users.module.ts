import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // keep file in memory so Sharp can read buffer
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 900, // 15 minutes
        limit: 5, // 5 requests per 15 minutes for sensitive endpoints
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
