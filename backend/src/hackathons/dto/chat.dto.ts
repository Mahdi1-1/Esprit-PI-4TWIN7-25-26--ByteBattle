import { IsString, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SendMessageDto {
  @ApiProperty({ description: "Message content", maxLength: 2000 })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: "Optional code snippet" })
  @IsOptional()
  @IsString()
  codeSnippet?: string;

  @ApiPropertyOptional({
    description: "Language for code snippet syntax highlighting",
  })
  @IsOptional()
  @IsString()
  codeLanguage?: string;
}
