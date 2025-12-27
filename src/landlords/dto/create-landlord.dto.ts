import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsInt,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class CreateLandlordDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsNotEmpty({ message: 'Phone is required' })
  @IsPhoneNumber('US', {
    message: 'Phone must be a valid phone number from the US',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsArray({ message: 'Yards must be an array' })
  @ArrayNotEmpty({ message: 'At least one yard is required' })
  @IsInt({ each: true, message: 'Each yard ID must be an integer' })
  yardIds: number[];
}
