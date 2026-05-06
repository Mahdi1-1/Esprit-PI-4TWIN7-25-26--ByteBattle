import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateNotificationPreferenceDto {
  @ApiPropertyOptional({ description: "Enable hackathon notifications" })
  @IsOptional()
  @IsBoolean()
  hackathon?: boolean;

  @ApiPropertyOptional({ description: "Enable duel notifications" })
  @IsOptional()
  @IsBoolean()
  duel?: boolean;

  @ApiPropertyOptional({ description: "Enable discussion notifications" })
  @IsOptional()
  @IsBoolean()
  discussion?: boolean;

  @ApiPropertyOptional({ description: "Enable submission notifications" })
  @IsOptional()
  @IsBoolean()
  submission?: boolean;

  @ApiPropertyOptional({ description: "Enable canvas notifications" })
  @IsOptional()
  @IsBoolean()
  canvas?: boolean;

  @ApiPropertyOptional({ description: "Enable achievement notifications" })
  @IsOptional()
  @IsBoolean()
  achievement?: boolean;

  @ApiPropertyOptional({ description: "Enable system notifications" })
  @IsOptional()
  @IsBoolean()
  system?: boolean;

  @ApiPropertyOptional({ description: "Enable in-app notifications" })
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @ApiPropertyOptional({ description: "Enable email notifications (future)" })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({ description: "Enable push notifications (future)" })
  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @ApiPropertyOptional({
    description: 'Quiet hours start time "HH:mm"',
    example: "22:00",
  })
  @IsOptional()
  @ValidateIf((o) => o.quietStart !== null)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'quietStart must be "HH:mm"',
  })
  quietStart?: string | null;

  @ApiPropertyOptional({
    description: 'Quiet hours end time "HH:mm"',
    example: "08:00",
  })
  @IsOptional()
  @ValidateIf((o) => o.quietEnd !== null)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'quietEnd must be "HH:mm"' })
  quietEnd?: string | null;
}
