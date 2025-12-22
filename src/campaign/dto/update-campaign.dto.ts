import { PartialType } from '@nestjs/mapped-types';
import { CreateCampaignDto } from './create-campaign.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CampaignType } from '../entities/campaign.entity';
import { Transform } from 'class-transformer';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @ApiProperty({
    description: 'Nombre de la campaña',
    example: 'Campaña de Verano 2024',
    required: false,
  })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nombre?: string;

  @ApiProperty({
    description: 'ID del patio/yard asociado (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'yardaId must be a number' })
  @Min(1, { message: 'yardaId must be a positive number' })
  yardaId?: number;

  @ApiProperty({
    description: 'Duración de la campaña en días (opcional)',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsString()
  duracion?: string;

  @ApiProperty({
    description: 'Tipo de campaña',
    enum: CampaignType,
    example: CampaignType.ONBOARDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(CampaignType)
  @IsNotEmpty({ message: 'tipo should not be empty' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  tipo?: CampaignType;

  @ApiProperty({
    description: 'Indica si la campaña está activa (opcional)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
