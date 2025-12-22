import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nombre del cliente (opcional)',
    example: 'Juan Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiProperty({
    description: 'Teléfono del cliente (opcional, único)',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Indica si el cliente es de la línea de Onboarding',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOnBoarding?: boolean;
}
