import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SubmitCodeDto {
  @ApiProperty({ description: "Challenge ObjectId" })
  @IsString()
  challengeId: string;

  @ApiProperty({ description: "Source code to submit" })
  @IsString()
  code: string;

  @ApiProperty({ description: "Programming language", example: "javascript" })
  @IsString()
  language: string;
}

export class RunCodeDto {
  @ApiProperty({ description: "Challenge ObjectId" })
  @IsString()
  challengeId: string;

  @ApiProperty({ description: "Source code to run" })
  @IsString()
  code: string;

  @ApiProperty({ description: "Programming language", example: "javascript" })
  @IsString()
  language: string;
}
