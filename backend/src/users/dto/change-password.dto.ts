import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({ description: 'Current password' })
    @IsString()
    currentPassword: string;

    @ApiProperty({
        description: 'New password (min 8 chars, must contain uppercase, digit, special char)',
        minLength: 8
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
        message: 'Password must contain at least 1 uppercase letter, 1 digit, and 1 special character',
    })
    newPassword: string;
}
