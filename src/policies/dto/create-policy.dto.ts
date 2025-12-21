import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePolicyDto {
  @ApiProperty({
    description: 'Nombre de la política',
    example: 'Política de Privacidad',
  })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Invalid Name format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: 'Descripción de la política',
    example: 'Esta política describe cómo manejamos los datos de los usuarios',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid Description format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description: string;

  @ApiProperty({
    description: 'URL del archivo de la política',
    example: 'https://example.com/files/policy.pdf',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid File URL format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fileUrl?: string;
}
