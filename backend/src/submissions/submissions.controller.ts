import {
  Controller, Get, Post, Param, Query, Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto, RunCodeDto } from './dto/create-submission.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Submissions')
@ApiBearerAuth()
@Controller('submissions')
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post('code')
  @Roles('user')
  @ApiOperation({ summary: 'Submit a code solution' })
  submitCode(@CurrentUser('id') userId: string, @Body() dto: CreateSubmissionDto) {
    return this.submissionsService.create(userId, dto as any);
  }

  @Post('run')
  @Roles('user')
  @ApiOperation({ summary: 'Run code on sample tests (no submission created)' })
  runCode(@CurrentUser('id') userId: string, @Body() dto: RunCodeDto) {
    return this.submissionsService.runCode(userId, dto);
  }

  @Get('me')
  @Roles('user')
  @ApiOperation({ summary: 'Get current user submission history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'kind', required: false })
  @ApiQuery({ name: 'verdict', required: false })
  getMyHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('kind') kind?: string,
    @Query('verdict') verdict?: string,
  ) {
    return this.submissionsService.getUserHistory(userId, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      kind, verdict,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get submission by ID' })
  findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(id);
  }

  @Get(':id/status')
  @Roles('user')
  @ApiOperation({ summary: 'Get submission status (polling)' })
  async getStatus(@Param('id') id: string) {
    const submission = await this.submissionsService.findOne(id);
    return {
      status: submission.verdict,
      score: submission.score,
      timeMs: submission.timeMs,
      memMb: submission.memMb,
      testsPassed: submission.testsPassed,
      testsTotal: submission.testsTotal,
    };
  }

  @Post(':id/ai-review')
  @Roles('user')
  @ApiOperation({ summary: 'Generate AI review for a submission' })
  async generateAiReview(@Param('id') id: string) {
    return this.submissionsService.generateAiReview(id);
  }

  // Admin routes
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all submissions (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'challengeId', required: false })
  @ApiQuery({ name: 'verdict', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('challengeId') challengeId?: string,
    @Query('verdict') verdict?: string,
  ) {
    return this.submissionsService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      userId, challengeId, verdict,
    });
  }
}
