import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class InviteMemberDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;
}