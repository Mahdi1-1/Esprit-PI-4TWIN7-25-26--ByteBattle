import {
  Controller, Get, Post, Param, Body, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { StartInterviewDto, SendMessageDto, SendVoiceMessageDto } from './dto/interview.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('Interviews')
@ApiBearerAuth()
@Roles('user')
@Controller('interviews')
export class InterviewsController {
  constructor(private interviewsService: InterviewsService) { }

  @Post('start')
  @ApiOperation({ summary: 'Start a new AI mock interview session' })
  start(@CurrentUser('id') userId: string, @Body() dto: StartInterviewDto) {
    return this.interviewsService.start(userId, dto);
  }

  @Post(':id/message')
  @ApiOperation({ summary: 'Send a message in interview' })
  sendMessage(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.interviewsService.sendMessage(sessionId, userId, dto);
  }

  @Post(':id/end')
  @ApiOperation({ summary: 'End interview and get feedback' })
  endInterview(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewsService.endInterview(sessionId, userId);
  }

  @Post(':id/voice')
  @ApiOperation({ summary: 'Send a voice message (audio → STT → AI → TTS)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: { type: 'string', format: 'binary' },
        languageCode: { type: 'string', example: 'fr-FR' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('audio', { storage: memoryStorage() }))
  sendVoiceMessage(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SendVoiceMessageDto,
  ) {
    return this.interviewsService.sendVoiceMessage(
      sessionId,
      userId,
      file.buffer,
      dto.languageCode || 'fr-FR',
    );
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all user interview sessions' })
  getUserSessions(@CurrentUser('id') userId: string) {
    return this.interviewsService.getUserSessions(userId);
  }

  @Get('tokens')
  @ApiOperation({ summary: 'Get token balance' })
  getTokenBalance(@CurrentUser('id') userId: string) {
    return this.interviewsService.getTokenBalance(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get interview session details' })
  getSession(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewsService.getSession(sessionId, userId);
  }
}
