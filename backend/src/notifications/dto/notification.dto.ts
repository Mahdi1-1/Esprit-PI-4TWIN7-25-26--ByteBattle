import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateNotificationDto {
  @ApiProperty({
    description: "Notification type (e.g. like-post, new-comment)",
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: "ID of the related entity" })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: "Type of the related entity (e.g. discussion, comment)",
  })
  @IsString()
  @IsNotEmpty()
  targetType: string;
}
