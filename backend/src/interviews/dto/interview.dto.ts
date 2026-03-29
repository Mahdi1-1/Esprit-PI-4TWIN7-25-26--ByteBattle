import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InterviewDomainEnum {
  CLOUD_COMPUTING = 'CLOUD_COMPUTING',
  SOFTWARE_ENGINEERING = 'SOFTWARE_ENGINEERING',
  CYBERSECURITY = 'CYBERSECURITY',
  DATA_SCIENCE_AI = 'DATA_SCIENCE_AI',
  FRONTEND_ENGINEERING = 'FRONTEND_ENGINEERING',
  BACKEND_ENGINEERING = 'BACKEND_ENGINEERING',
  DEVOPS_SRE = 'DEVOPS_SRE',
  MOBILE_DEVELOPMENT = 'MOBILE_DEVELOPMENT',
}

export enum InterviewLanguageEnum {
  FR = 'FR',
  EN = 'EN',
}

export class StartInterviewDto {
  @ApiProperty({ enum: ['easy', 'medium', 'hard'] })
  @IsEnum(['easy', 'medium', 'hard'] as const)
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiProperty({
    enum: InterviewDomainEnum,
    description: 'Interview domain area'
  })
  @IsEnum(InterviewDomainEnum)
  domain: InterviewDomainEnum;

  @ApiProperty({
    enum: InterviewLanguageEnum,
    default: InterviewLanguageEnum.FR,
    description: 'Interview language'
  })
  @IsEnum(InterviewLanguageEnum)
  language: InterviewLanguageEnum;

  @ApiPropertyOptional({ example: 'arrays', description: 'Optional specific topic (deprecated, use domain)' })
  @IsOptional()
  @IsString()
  topic?: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Code to review' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Code language' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class SendVoiceMessageDto {
  @ApiPropertyOptional({ description: 'Language code for speech-to-text' })
  @IsOptional()
  @IsString()
  languageCode?: string;
}
