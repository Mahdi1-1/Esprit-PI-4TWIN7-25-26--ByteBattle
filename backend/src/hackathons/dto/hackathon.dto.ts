import { IsString, IsEnum, IsOptional, IsArray, IsDateString, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHackathonDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  freezeAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  challengeIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rulesMd?: string;

  @ApiPropertyOptional({ enum: ['public', 'enterprise', 'invite-only'] })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  joinCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  teamPolicy?: { minSize?: number; maxSize?: number; autoAssign?: boolean };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;
}

export class UpdateHackathonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  freezeAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  challengeIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rulesMd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  teamPolicy?: { minSize?: number; maxSize?: number; autoAssign?: boolean };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ enum: ['public', 'enterprise', 'invite-only'] })
  @IsOptional()
  @IsString()
  scope?: string;
}

export class TransitionStatusDto {
  @ApiProperty({ enum: ['draft', 'lobby', 'checkin', 'active', 'frozen', 'ended', 'archived', 'cancelled'] })
  @IsString()
  status: string;
}

export class CancelHackathonDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class CreateTeamDto {
  @ApiProperty()
  @IsString()
  name: string;
}

export class JoinTeamDto {
  @ApiProperty()
  @IsString()
  joinCode: string;
}
