import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CampaignType } from '../entities/campaign.entity';
import { Transform } from 'class-transformer';

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Nombre de la campaña',
    example: 'Campaña de Verano 2024',
  })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nombre: string;

  @ApiProperty({
    description: 'Nombre del patio asociado (opcional)',
    example: '1',
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
  })
  @IsEnum(CampaignType)
  @IsNotEmpty({ message: 'tipo should not be empty' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  tipo: CampaignType;

  @ApiProperty({
    description: 'Indica si la campaña está activa (opcional)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
