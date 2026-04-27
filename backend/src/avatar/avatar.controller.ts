import { 
  Controller, Post, Get, Body, Param, UseGuards, Request, Patch, Delete, Res, Header 
} from '@nestjs/common';
import { RpmAvatarService } from './services/rpm-avatar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SaveAvatarDto } from './dto/save-avatar.dto';
import { UpdateExpressionDto } from './dto/update-expression.dto';
import { UpdateSceneDto } from './dto/update-scene.dto';
import { Response } from 'express';

@Controller('api/avatar')
export class AvatarController {
  constructor(private readonly avatarService: RpmAvatarService) {}

  @Post('save')
  @UseGuards(JwtAuthGuard)
  async saveAvatar(@Request() req, @Body() dto: SaveAvatarDto) {
    return this.avatarService.saveAvatar(req.user.id, dto.glbUrl, dto.scene, dto.expression);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyAvatar(@Request() req) {
    return this.avatarService.getAvatar(req.user.id);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserAvatar(@Param('userId') userId: string) {
    return this.avatarService.getAvatar(userId);
  }

  @Patch('expression')
  @UseGuards(JwtAuthGuard)
  async updateExpression(@Request() req, @Body() dto: UpdateExpressionDto) {
    return this.avatarService.updateExpression(req.user.id, dto.expression);
  }

  @Patch('scene')
  @UseGuards(JwtAuthGuard)
  async updateScene(@Request() req, @Body() dto: UpdateSceneDto) {
    return this.avatarService.updateScene(req.user.id, dto.scene);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshAvatar(@Request() req) {
    return this.avatarService.refreshRender(req.user.id);
  }

  @Delete('')
  @UseGuards(JwtAuthGuard)
  async deleteAvatar(@Request() req) {
    return this.avatarService.deleteAvatar(req.user.id);
  }

  @Get('file/:filename')
  @Header('Cache-Control', 'public, max-age=3600')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = await this.avatarService.getFilePath(filename);
    res.sendFile(filePath);
  }
}
