import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CampaignType } from '../entities/campaign.entity';

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Nombre de la campaña',
    example: 'Campaña de Verano 2024',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Nombre del patio asociado (opcional)',
    example: 'Patio Norte',
    required: false,
  })
  @IsOptional()
  @IsString()
  yarda?: string;

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
