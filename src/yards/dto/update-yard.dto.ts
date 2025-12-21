import { PartialType } from '@nestjs/swagger';
import { CreateYardDto } from './create-yard.dto';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateYardDto extends PartialType(CreateYardDto) {
  @ApiProperty({
    description: 'Nombre del yard',
    example: 'Yard Central',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid Name format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiProperty({
    description: 'Nombre común del yard',
    example: 'Patio de Contenedores Central',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid Common Name format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  commonName?: string;

  @ApiProperty({
    description: 'Dirección de la propiedad',
    example: 'Av. Principal 123, Ciudad',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid Property Address format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  propertyAddress?: string;

  @ApiProperty({
    description: 'Información de contacto',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid Contact Info format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  contactInfo?: string;

  @ApiProperty({
    description: 'Enlace al yard',
    example: 'https://example.com/yard/123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid Yard Link format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  yardLink?: string;
}
