import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateYardDto {
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Invalid Name format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsNotEmpty({ message: 'Common Name should not be empty' })
  @IsString({ message: 'Invalid Common Name format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  commonName: string;

  @IsNotEmpty({ message: 'Property Address should not be empty' })
  @IsString({ message: 'Invalid Property Address format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  propertyAddress: string;

  @IsNotEmpty({ message: 'Contact Info should not be empty' })
  @IsString({ message: 'Invalid Contact Info format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  contactInfo: string;

  @IsNotEmpty({ message: 'Yard Link should not be empty' })
  @IsString({ message: 'Invalid Yard Link format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  yardLink: string;
}
