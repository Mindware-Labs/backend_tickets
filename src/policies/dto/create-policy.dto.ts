import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePolicyDto {
  @ApiProperty({
    description: 'Policy name',
    example: 'Privacy Policy',
  })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Invalid Name format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: 'Policy description',
    example: 'This policy describes how we handle user data',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid Description format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description: string;

  @ApiProperty({
    description: 'Policy file URL',
    example: 'https://example.com/files/policy.pdf',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Invalid File URL format' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fileUrl?: string;
}
