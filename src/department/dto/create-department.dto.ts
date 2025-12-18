import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
