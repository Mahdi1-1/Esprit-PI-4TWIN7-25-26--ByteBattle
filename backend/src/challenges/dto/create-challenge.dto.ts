import { IsString, IsEnum, IsArray, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestDto {
  @ApiProperty()
  @IsString()
  input: string;

  @ApiProperty()
  @IsString()
  expectedOutput: string;

  @ApiPropertyOptional()
  @IsOptional()
  isHidden?: boolean;
}

export class CreateCodeChallengeDto {
  @ApiProperty({ example: 'Two Sum' })
  @IsString()
  title: string;

  @ApiProperty({ enum: ['CODE'] })
  @IsEnum(['CODE'] as const)
  kind: 'CODE';

  @ApiProperty({ enum: ['easy', 'medium', 'hard'] })
  @IsEnum(['easy', 'medium', 'hard'] as const)
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty()
  @IsString()
  statementMd: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'] as const)
  status?: 'draft' | 'published' | 'archived';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedLanguages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  constraints?: any;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiPropertyOptional({ type: [TestDto] })
  @IsOptional()
  @IsArray()
  tests?: TestDto[];
}

export class CreateCanvasChallengeDto {
  @ApiProperty({ example: 'Pricing Table' })
  @IsString()
  title: string;

  @ApiProperty({ enum: ['CANVAS'] })
  @IsEnum(['CANVAS'] as const)
  kind: 'CANVAS';

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty({ enum: ['easy', 'medium', 'hard'] })
  @IsEnum(['easy', 'medium', 'hard'] as const)
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiProperty()
  @IsString()
  briefMd: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliverables?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rubric?: any;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assets?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'] as const)
  status?: 'draft' | 'published' | 'archived';
}

export class GenerateChallengeDraftDto {
  @ApiProperty({ example: 'Create a beginner-friendly coding challenge about arrays and loops' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ enum: ['CODE', 'CANVAS'] })
  @IsOptional()
  @IsEnum(['CODE', 'CANVAS'] as const)
  kind?: 'CODE' | 'CANVAS';
}
