import { IsString, IsIn } from 'class-validator';
import { RPM_CONSTANTS } from '../constants/rpm.constants';

export class UpdateExpressionDto {
  @IsString()
  @IsIn(Object.keys(RPM_CONSTANTS.EXPRESSIONS))
  expression: string;
}
