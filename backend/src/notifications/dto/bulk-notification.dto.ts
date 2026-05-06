import { IsArray, IsString, ArrayMinSize } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class BulkNotificationDto {
  @ApiProperty({ description: "Array of notification IDs", type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];
}
