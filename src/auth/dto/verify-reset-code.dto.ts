import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Must be a valid email' })
  email: string;

  @ApiProperty({
    description: 'Codigo de 6 digitos recibido por email',
    example: '123456',
  })
  @IsNotEmpty({ message: 'Code is required' })
  @IsString()
  code: string;
}
