import { Transform } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TicketPriority,
  TicketStatus,
  TicketDisposition,
  CallDirection,
  OnboardingOption,
} from '../entities/ticket.entity';

export class UpdateTicketDto {
  @ApiProperty({
    description: 'Associated customer ID (optional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  customerId?: number;

  @ApiProperty({
    description: 'Call direction (optional)',
    enum: CallDirection,
    example: CallDirection.INBOUND,
    required: false,
  })
  @IsOptional()
  @IsEnum(CallDirection)
  direction?: CallDirection;

  @ApiProperty({
    description: 'Associated yard ID (optional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  yardId?: number;

  @ApiProperty({
    description: 'Customer phone (optional)',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({
    description:
      'Ticket disposition - entered manually by the agent (optional)',
    enum: TicketDisposition,
    example: TicketDisposition.BOOKING,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketDisposition)
  disposition?: TicketDisposition;

  @ApiProperty({
    description: 'Associated campaign ID (optional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  campaignId?: number;

  @ApiProperty({
    description: 'Assigned agent ID (optional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  agentId?: number;

  @ApiProperty({
    description: 'Ticket status (optional, default: IN_PROGRESS)',
    enum: TicketStatus,
    example: TicketStatus.IN_PROGRESS,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiProperty({
    description: 'Ticket priority (optional, default: LOW)',
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({
    description: 'Aircall call ID (optional)',
    example: 'aircall_123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  aircallId?: string;

  @ApiProperty({
    description: 'Call duration in seconds (optional)',
    example: 300,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({
    description: 'Issue details - entered manually by the agent (optional)',
    example: 'Customer needs help with their booking',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  issueDetail?: string;

  @ApiProperty({
    description: 'Attachment URLs - entered manually by the agent (optional)',
    example: ['https://example.com/file1.pdf', 'https://example.com/file2.jpg'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({
    description:
      'Onboarding option - only applies when campaign is ONBOARDING. Entered manually by the agent (optional)',
    enum: OnboardingOption,
    example: OnboardingOption.REGISTER,
    required: false,
  })
  @IsOptional()
  @IsEnum(OnboardingOption)
  onboardingOption?: OnboardingOption;
}
