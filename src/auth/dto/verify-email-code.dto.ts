import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailCodeDto {
  @IsEmail({}, { message: 'Must be a valid email' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Code must be 6 digits' })
  code: string;
}
