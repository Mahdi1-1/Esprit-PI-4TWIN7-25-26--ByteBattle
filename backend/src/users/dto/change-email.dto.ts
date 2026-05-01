import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeEmailDto {
    @ApiProperty({ description: 'Current password for verification' })
    @IsString()
    currentPassword: string;

    @ApiProperty({ description: 'New email address', format: 'email' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    newEmail: string;
}
