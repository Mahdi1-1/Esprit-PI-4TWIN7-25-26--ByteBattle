import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHackathonTeamDto {
  @ApiProperty({ description: 'Team display name', maxLength: 50 })
  @IsString()
  name: string;
}

export class JoinHackathonTeamDto {
  @ApiProperty({ description: '6-char alphanumeric team join code' })
  @IsString()
  joinCode: string;
}

export class RemoveMemberDto {
  @ApiProperty({ description: 'User ID of the member to remove' })
  @IsString()
  userId: string;
}
