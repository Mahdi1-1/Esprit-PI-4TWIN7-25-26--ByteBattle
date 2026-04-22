import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { CreateCodeChallengeDto, CreateCanvasChallengeDto, GenerateChallengeDraftDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published challenges' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'kind', required: false })
  @ApiQuery({ name: 'difficulty', required: false })
  @ApiQuery({ name: 'tags', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('kind') kind?: string,
    @Query('difficulty') difficulty?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
  ) {
    return this.challengesService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      kind, difficulty, tags, search,
    });
  }

  @Get('recommended')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recommended challenges for current user' })
  getRecommended(@CurrentUser('id') userId: string) {
    return this.challengesService.getRecommended(userId);
  }

  @Post('generate')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a challenge draft using AI (authenticated users, consumes 5 tokens)' })
  generateUserDraft(@CurrentUser('id') userId: string, @Body() dto: GenerateChallengeDraftDto) {
    return this.challengesService.generateDraftForUser(userId, dto.prompt, dto.kind || 'CODE');
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get challenge details' })
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  // ----- Company Routes -----
  @Get('company/:companyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List challenges for a company (active members only)' })
  findByCompany(@Param('companyId') companyId: string, @CurrentUser('id') userId: string) {
    return this.challengesService.findByCompany(companyId, userId);
  }

  @Post('company')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a challenge for company (owner/recruiter)' })
  createCompanyChallenge(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.challengesService.createCompanyChallenge(userId, dto);
  }

  // ----- Admin Routes -----

  @Post('admin/generate')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a challenge draft using AI' })
  generateDraft(@Body() dto: GenerateChallengeDraftDto) {
    return this.challengesService.generateDraft(dto.prompt, dto.kind || 'CODE');
  }

  @Get('admin/all')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all challenges (admin)' })
  findAllAdmin(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('kind') kind?: string,
    @Query('difficulty') difficulty?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.challengesService.getAllAdmin({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      kind, difficulty, status, search,
    });
  }

  @Get('admin/:id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get challenge details (admin, includes hidden tests)' })
  findOneAdmin(@Param('id') id: string) {
    return this.challengesService.findOneAdmin(id);
  }

  @Post('code')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a code challenge (admin)' })
  createCodeChallenge(@Body() dto: CreateCodeChallengeDto) {
    return this.challengesService.create(dto);
  }

  @Post('canvas')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a canvas challenge (admin)' })
  createCanvasChallenge(@Body() dto: CreateCanvasChallengeDto) {
    return this.challengesService.create(dto as any); // cast safely in service
  }

  @Patch(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a challenge (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateChallengeDto) {
    return this.challengesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a challenge (admin)' })
  remove(@Param('id') id: string) {
    return this.challengesService.remove(id);
  }
}
