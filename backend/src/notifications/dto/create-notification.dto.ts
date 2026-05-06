import { IsString, IsNotEmpty, IsOptional, IsIn } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const CATEGORIES = [
  "hackathon",
  "duel",
  "discussion",
  "submission",
  "canvas",
  "achievement",
  "system",
];
const PRIORITIES = ["critical", "high", "medium", "low"];

export class CreateNotificationDto {
  @ApiProperty({ description: "Target user ID" })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: "Notification type (e.g. hackathon_starting, duel_result)",
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: "Category", enum: CATEGORIES })
  @IsString()
  @IsIn(CATEGORIES)
  category: string;

  @ApiProperty({
    description: "Priority level",
    enum: PRIORITIES,
    default: "medium",
  })
  @IsString()
  @IsIn(PRIORITIES)
  priority: string;

  @ApiProperty({ description: "Short notification title" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "Notification body message" })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: "Deep-link URL for navigation on click" })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: "ID of the related entity" })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: "Type of the related entity (e.g. Hackathon, Duel)",
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: "Actor user ID (snapshot — no FK)" })
  @IsOptional()
  @IsString()
  senderId?: string;

  @ApiPropertyOptional({ description: "Actor username snapshot" })
  @IsOptional()
  @IsString()
  senderName?: string;

  @ApiPropertyOptional({ description: "Actor profile image snapshot" })
  @IsOptional()
  @IsString()
  senderPhoto?: string;
}
