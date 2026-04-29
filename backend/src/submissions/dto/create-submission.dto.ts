import { IsString, IsEnum, IsOptional, IsInt, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty()
  @IsString()
  challengeId: string;

  @ApiProperty({ enum: ['CODE', 'CANVAS'] })
  @IsEnum(['CODE', 'CANVAS'] as const)
  kind: 'CODE' | 'CANVAS';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional()
  @IsOptional()
  canvasJson?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  snapshotUrl?: string;
}

export class SaveDraftDto {
  @ApiProperty()
  @IsString()
  challengeId: string;

  @ApiProperty({ enum: ['CANVAS'] })
  @IsEnum(['CANVAS'] as const)
  kind: 'CANVAS';

  @ApiProperty()
  canvasJson: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  snapshotUrl?: string;
}

export class CreateCanvasSubmissionDto {
  @ApiProperty()
  @IsString()
  challengeId: string;

  @ApiProperty({ enum: ['CANVAS'] })
  @IsEnum(['CANVAS'] as const)
  kind: 'CANVAS';

  @ApiProperty()
  @IsString()
  snapshotUrl: string;

  @ApiProperty()
  canvasJson: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  score?: number;
}

export class RunCodeDto {
  @ApiProperty()
  @IsString()
  challengeId: string;

  @ApiProperty()
  @IsString()
  language: string;

  @ApiProperty()
  @IsString()
  code: string;
}
