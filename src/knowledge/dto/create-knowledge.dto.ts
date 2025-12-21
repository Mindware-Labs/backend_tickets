import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKnowledgeDto {
  @ApiProperty({
    description: 'Nombre del artículo de conocimiento',
    example: 'Cómo realizar un pedido',
  })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: 'Descripción del artículo de conocimiento',
    example: 'Guía paso a paso para realizar un pedido en el sistema',
  })
  @IsNotEmpty({ message: 'Description should not be empty' })
  @IsString({ message: 'Description must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description: string;

  @ApiProperty({
    description: 'URL del archivo adjunto',
    example: 'https://example.com/files/guide.pdf',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'File URL must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fileUrl?: string;
}
