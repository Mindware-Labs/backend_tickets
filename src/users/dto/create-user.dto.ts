import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  lastName: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  verificationToken?: string;

  @IsOptional()
  verificationTokenExpiry?: Date;

  @IsOptional()
  verificationCode?: string;

  @IsOptional()
  verificationCodeExpiry?: Date;

  @IsOptional()
  resetToken?: string;

  @IsOptional()
  resetTokenExpiry?: Date;

  @IsOptional()
  resetCode?: string;

  @IsOptional()
  resetCodeExpiry?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
