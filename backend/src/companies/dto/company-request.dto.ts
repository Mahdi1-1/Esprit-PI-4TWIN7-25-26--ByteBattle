import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MinLength(2)
  @MaxLength(80)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  domain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  logoUrl?: string;

  @IsOptional()
  @IsIn(['open', 'approval', 'invite_only'])
  joinPolicy?: 'open' | 'approval' | 'invite_only';
}

export class InviteUserToCompanyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  username: string;

  @IsOptional()
  @IsIn(['member'])
  role?: 'member';
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  domain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  logoUrl?: string;

  @IsOptional()
  @IsIn(['open', 'approval', 'invite_only'])
  joinPolicy?: 'open' | 'approval' | 'invite_only';
}

export class UpdateCompanyMemberRoleDto {
  @IsIn(['member', 'admin'])
  role: 'member' | 'admin';
}