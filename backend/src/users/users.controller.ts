import { Controller, Get, Patch, Param, Body, Query, Post, Delete, Res, UseInterceptors, UploadedFile, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get()
  @ApiOperation({ summary: 'List all users (admin)' })
  @Roles('admin')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.findAll(+page, +limit);
  }

  @Get('me')
  @Roles('user')
  @ApiOperation({ summary: 'Get current user details' })
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Get('me/history')
  @Roles('user')
  @ApiOperation({ summary: 'Get current user submission history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMyHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.getHistory(userId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  @Roles('user')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(userId, dto);
  }

  @Patch(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user role (admin)' })
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(id, role);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Ban/suspend user (admin)' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.usersService.updateStatus(id, status);
  }

  // ─── Profile Photo Endpoints ─────────────────────────────────

  @Post('me/photo')
  @Roles('user')
  @ApiOperation({ summary: 'Upload profile photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPG, PNG, or WebP, max 5MB)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or file too large' })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  uploadPhoto(@CurrentUser('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadProfilePhoto(userId, file);
  }

  @Delete('me/photo')
  @Roles('user')
  @ApiOperation({ summary: 'Delete profile photo' })
  @ApiResponse({ status: 200, description: 'Photo deleted successfully' })
  deletePhoto(@CurrentUser('id') userId: string) {
    return this.usersService.deleteProfilePhoto(userId);
  }

  @Get('photo/:filename')
  @ApiOperation({ summary: 'Get profile photo' })
  @ApiResponse({ status: 200, description: 'Profile photo' })
  async getPhoto(@Param('filename') filename: string, @Res({ passthrough: true }) res: Response) {
    const filePath = path.join('./uploads/avatars', filename);

    if (!fs.existsSync(filePath)) {
      res.status(404);
      return { error: 'Photo not found' };
    }

    const file = fs.createReadStream(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.webp' ? 'image/webp' : 'image/jpeg';

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000', // 1 year cache
    });

    return new StreamableFile(file);
  }

  // ─── Password Change Endpoint ─────────────────────────────────

  @Patch('me/password')
  @Roles('user')
  @Throttle({ short: { limit: 5, ttl: 900 } })
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password or OAuth user' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }

  // ─── Email Change Endpoint ─────────────────────────────────

  @Patch('me/email')
  @Roles('user')
  @Throttle({ short: { limit: 5, ttl: 900 } })
  @ApiOperation({ summary: 'Change email address' })
  @ApiResponse({ status: 200, description: 'Email changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid email or OAuth user' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  changeEmail(@CurrentUser('id') userId: string, @Body() dto: ChangeEmailDto) {
    return this.usersService.changeEmail(userId, dto);
  }

  // ─── Profile Stats Endpoint ─────────────────────────────────

  @Get('me/stats')
  @Roles('user')
  @ApiOperation({ summary: 'Get current user profile statistics' })
  @ApiResponse({ status: 200, description: 'Profile statistics' })
  getProfileStats(@CurrentUser('id') userId: string) {
    return this.usersService.getProfileStats(userId);
  }

  // ─── Delete Account Endpoint ─────────────────────────────────

  @Delete('me')
  @Roles('user')
  @ApiOperation({ summary: 'Delete account permanently' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  deleteAccount(@CurrentUser('id') userId: string, @Body() dto: DeleteAccountDto) {
    return this.usersService.deleteAccount(userId, dto);
  }
}
