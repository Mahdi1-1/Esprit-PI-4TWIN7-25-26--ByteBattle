import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  targetType: string;

  @ApiProperty()
  @IsString()
  targetId: string;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class UpdateReportStatusDto {
  @ApiProperty({ enum: ['open', 'reviewed', 'resolved', 'dismissed'] })
  @IsString()
  status: string;
}

export class CreateAuditLogDto {
  @ApiProperty()
  @IsString()
  action: string;

  @ApiProperty()
  @IsString()
  entityType: string;

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiPropertyOptional()
  @IsOptional()
  details?: any;
}
