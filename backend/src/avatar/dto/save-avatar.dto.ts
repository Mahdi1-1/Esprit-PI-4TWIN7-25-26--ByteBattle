import { IsString, IsOptional, IsIn } from "class-validator";
import { RPM_CONSTANTS } from "../constants/rpm.constants";

export class SaveAvatarDto {
  @IsString()
  glbUrl: string;

  @IsOptional()
  @IsString()
  @IsIn(RPM_CONSTANTS.SCENES)
  scene?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.keys(RPM_CONSTANTS.EXPRESSIONS))
  expression?: string;
}
