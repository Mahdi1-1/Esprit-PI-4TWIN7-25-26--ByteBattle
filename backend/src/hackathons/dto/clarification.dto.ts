import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClarificationDto {
  @ApiPropertyOptional({ description: 'Challenge ObjectId (null for general clarification)' })
  @IsOptional()
  @IsString()
  challengeId?: string;

  @ApiProperty({ description: 'Clarification question text', maxLength: 2000 })
  @IsString()
  question: string;
}

export class AnswerClarificationDto {
  @ApiProperty({ description: 'Admin response text' })
  @IsString()
  answer: string;

  @ApiProperty({ description: 'Whether to broadcast to all teams' })
  @IsBoolean()
  isBroadcast: boolean;
}
