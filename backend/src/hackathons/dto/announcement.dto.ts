import { IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateAnnouncementDto {
  @ApiProperty({ description: "Announcement content", maxLength: 5000 })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: "Whether to pin the announcement" })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
