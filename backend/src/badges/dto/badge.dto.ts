import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBadgeDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['common', 'rare', 'epic', 'legendary'] })
  @IsString()
  rarity: string;

  @ApiProperty()
  @IsString()
  ruleText: string;

  @ApiProperty()
  @IsString()
  iconUrl: string;
}
