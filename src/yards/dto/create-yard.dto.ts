import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { YardType } from '../entities/yard.entity';

export class CreateYardDto {
  @ApiProperty({
    description: 'Yard name',
    example: 'Central Yard',
  })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Invalid Name format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: 'Yard common name',
    example: 'Central Container Yard',
  })
  @IsNotEmpty({ message: 'Common Name should not be empty' })
  @IsString({ message: 'Invalid Common Name format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  commonName: string;

  @ApiProperty({
    description: 'Property address',
    example: '123 Main St, City',
  })
  @IsNotEmpty({ message: 'Property Address should not be empty' })
  @IsString({ message: 'Invalid Property Address format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  propertyAddress: string;

  @ApiProperty({
    description: 'Contact information',
    example: '+1234567890',
  })
  @IsNotEmpty({ message: 'Contact Info should not be empty' })
  @IsString({ message: 'Invalid Contact Info format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  contactInfo: string;

  @ApiProperty({
    description: 'Yard link',
    example: 'https://example.com/yard/123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid Yard Link format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  yardLink: string;

  @ApiProperty({
    description: 'Additional notes about the yard',
    example: 'This yard operates 24/7.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid Notes format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes: string;

  @ApiProperty({
    description: 'Yard type',
    example: 'SAAS',
    enum: YardType,
  })
  @IsNotEmpty({ message: 'Yard Type should not be empty' })
  @IsEnum(YardType, {
    message: 'Yard Type must be either SAAS or FULL_SERVICE',
  })
  yardType: YardType;

  @ApiProperty({
    description: 'Indicates whether the yard is active',
    example: true,
  })
  @IsNotEmpty({ message: 'isActive should not be empty' })
  isActive: boolean;
}
