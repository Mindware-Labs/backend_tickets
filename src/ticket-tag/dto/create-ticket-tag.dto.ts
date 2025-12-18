import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { TagType } from '../entities/ticket-tag.entity';

export class CreateTicketTagDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsEnum(TagType)
  type?: TagType;
}
