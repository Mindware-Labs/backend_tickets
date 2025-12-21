import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { YardType } from '../entities/yard.entity';

export class CreateYardDto {
  @ApiProperty({
    description: 'Nombre del yard',
    example: 'Yard Central',
  })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Invalid Name format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: 'Nombre común del yard',
    example: 'Patio de Contenedores Central',
  })
  @IsNotEmpty({ message: 'Common Name should not be empty' })
  @IsString({ message: 'Invalid Common Name format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  commonName: string;

  @ApiProperty({
    description: 'Dirección de la propiedad',
    example: 'Av. Principal 123, Ciudad',
  })
  @IsNotEmpty({ message: 'Property Address should not be empty' })
  @IsString({ message: 'Invalid Property Address format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  propertyAddress: string;

  @ApiProperty({
    description: 'Información de contacto',
    example: '+1234567890',
  })
  @IsNotEmpty({ message: 'Contact Info should not be empty' })
  @IsString({ message: 'Invalid Contact Info format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  contactInfo: string;

  @ApiProperty({
    description: 'Enlace al yard',
    example: 'https://example.com/yard/123',
  })
  @IsNotEmpty({ message: 'Yard Link should not be empty' })
  @IsString({ message: 'Invalid Yard Link format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  yardLink: string;

  @ApiProperty({
    description: 'Notas adicionales sobre el yard',
    example: 'Este yard opera 24/7.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid Notes format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes: string;

  @ApiProperty({
    description: 'Tipo de yard',
    example: 'SAAS',
    enum: YardType,
  })
  @IsNotEmpty({ message: 'Yard Type should not be empty' })
  @IsEnum(YardType, {
    message: 'Yard Type must be either SAAS or FULL_SERVICE',
  })
  yardType: YardType;
}
