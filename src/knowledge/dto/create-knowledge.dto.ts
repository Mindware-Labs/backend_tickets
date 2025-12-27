import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKnowledgeDto {
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
  @IsNotEmpty({ message: 'Description should not be empty' })
  @IsString({ message: 'Description must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description: string;

  @ApiProperty({
    description: 'Attachment file URL',
    example: 'https://example.com/files/guide.pdf',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'File URL must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fileUrl?: string;
}
