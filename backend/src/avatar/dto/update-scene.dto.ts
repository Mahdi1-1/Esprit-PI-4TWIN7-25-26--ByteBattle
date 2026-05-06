import { IsString, IsIn } from "class-validator";
import { RPM_CONSTANTS } from "../constants/rpm.constants";

export class UpdateSceneDto {
  @IsString()
  @IsIn(RPM_CONSTANTS.SCENES)
  scene: string;
}
