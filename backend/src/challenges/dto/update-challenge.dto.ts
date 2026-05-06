import { PartialType } from "@nestjs/swagger";
import { CreateCodeChallengeDto } from "./create-challenge.dto";

export class UpdateChallengeDto extends PartialType(CreateCodeChallengeDto) {}
