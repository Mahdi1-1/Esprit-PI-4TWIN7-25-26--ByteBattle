import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsNumber,
} from "class-validator";

export class RequestHintDto {
  @IsString()
  challengeId: string;

  @IsString()
  language: string;

  @IsInt()
  codeLength: number;

  @IsInt()
  wrongAnswerCount: number;

  @IsInt()
  targetLevel: number;

  @IsOptional()
  @IsBoolean()
  confirmLevel5?: boolean;

  @IsOptional()
  @IsInt()
  testsTotal?: number;

  @IsOptional()
  @IsInt()
  testsPassed?: number;

  @IsOptional()
  @IsInt()
  previousHintLevel?: number;

  @IsOptional()
  @IsInt()
  minutesStuck?: number;

  @IsOptional()
  @IsString()
  decisionModel?: string;

  @IsOptional()
  @IsNumber()
  decisionConfidence?: number;

  @IsOptional()
  @IsString()
  hintStyle?:
    | "concept"
    | "strategy"
    | "pseudocode"
    | "partial_snippet"
    | "near_solution";

  @IsOptional()
  @IsString()
  hintIntensity?: "low" | "medium" | "high";

  @IsOptional()
  @IsString()
  hintTiming?: "now" | "wait";
}

export class RecommendLevelDto {
  @IsString()
  challengeId: string;

  @IsString()
  language: string;

  @IsInt()
  codeLength: number;

  @IsInt()
  wrongAnswerCount: number;
}
