import {
  IsString,
  IsArray,
  IsOptional,
  MaxLength,
  ArrayMaxSize,
  IsIn,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateDiscussionDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(10000)
  content: string;

  @ApiProperty({
    enum: [
      "general",
      "help",
      "algorithms",
      "challenge",
      "showcase",
      "feedback",
    ],
    default: "general",
  })
  @IsString()
  @IsIn(["general", "help", "algorithms", "challenge", "showcase", "feedback"])
  category: string;

  @ApiProperty({ type: [String], maxItems: 5 })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  tags: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  challengeId?: string;
}

export class UpdateDiscussionDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @ApiPropertyOptional({
    enum: [
      "general",
      "help",
      "algorithms",
      "challenge",
      "showcase",
      "feedback",
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn(["general", "help", "algorithms", "challenge", "showcase", "feedback"])
  category?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  tags?: string[];
}

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: "Parent comment ID for nested replies" })
  @IsOptional()
  @IsString()
  parentCommentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty()
  @IsString()
  content: string;
}
