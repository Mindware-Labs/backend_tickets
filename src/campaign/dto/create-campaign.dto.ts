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
    description: 'Campaign name',
    example: 'Summer Campaign 2024',
  })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nombre: string;

  @ApiProperty({
    description: 'Associated yard ID (optional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'yardaId must be a number' })
  @Min(1, { message: 'yardaId must be a positive number' })
  yardaId?: number;

  @ApiProperty({
    description: 'Campaign duration in days (optional)',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsString()
  duracion?: string;

  @ApiProperty({
    description: 'Campaign type',
    enum: CampaignType,
    example: CampaignType.ONBOARDING,
  })
  @IsEnum(CampaignType)
  @IsNotEmpty({ message: 'tipo should not be empty' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  tipo: CampaignType;

  @ApiProperty({
    description: 'Indicates whether the campaign is active (optional)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
