import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperación recibido por email',
    example: 'abc123xyz789',
  })
  @IsNotEmpty({ message: 'El token es requerido' })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password (minimum 6 characters)',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}
