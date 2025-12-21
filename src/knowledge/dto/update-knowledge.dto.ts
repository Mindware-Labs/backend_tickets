import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateKnowledgeDto } from './create-knowledge.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateKnowledgeDto extends PartialType(CreateKnowledgeDto) {
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
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description: string;
}
