import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'Juan',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: 'Apellido del cliente',
    example: 'Pérez',
  })
  @ApiProperty({
    description: 'Teléfono del cliente',
    example: '+1234567890',
  })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description:
      'Indica si el cliente ha completado el proceso de incorporación',
    example: 'Register',
  })
  @IsOptional()
  @IsString()
  isOnBoarding: boolean;
}
