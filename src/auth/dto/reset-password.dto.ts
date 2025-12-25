import { IsNotEmpty, IsString, MinLength, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperación recibido por email (legacy)',
    example: 'abc123xyz789',
    required: false,
  })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiProperty({
    description: 'Email del usuario (para codigo de 6 digitos)',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email' })
  email?: string;

  @ApiProperty({
    description: 'Codigo de 6 digitos recibido por email',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'New password (minimum 6 characters)',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}
