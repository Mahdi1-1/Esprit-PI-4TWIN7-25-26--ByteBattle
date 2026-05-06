import { IsString, IsOptional, MaxLength, IsIn } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn([
    "vs-dark",
    "vs-light",
    "hc-black",
    "hc-light",
    "monokai",
    "dracula",
    "github-dark",
    "one-dark-pro",
    "solarized-dark",
    "solarized-light",
  ])
  editorTheme?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(["en", "fr", "ar"])
  preferredLanguage?: string;
}
