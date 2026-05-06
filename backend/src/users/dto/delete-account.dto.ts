import { IsString, Equals } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DeleteAccountDto {
  @ApiProperty({ description: "Current password for verification" })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'Type "DELETE" to confirm account deletion' })
  @IsString()
  @Equals("DELETE", {
    message: 'You must type "DELETE" to confirm account deletion',
  })
  confirmation: string;
}
