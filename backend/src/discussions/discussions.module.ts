import { Module } from '@nestjs/common';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
  exports: [DiscussionsService],
})
export class DiscussionsModule { }
