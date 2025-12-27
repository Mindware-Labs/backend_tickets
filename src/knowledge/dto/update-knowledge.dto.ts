import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateKnowledgeDto } from './create-knowledge.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateKnowledgeDto extends PartialType(CreateKnowledgeDto) {
  @ApiProperty({
    description: 'Knowledge article name',
    example: 'How to place an order',
  })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: 'Knowledge article description',
    example: 'Step-by-step guide to place an order in the system',
  })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description: string;
}
