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
  ManagementType,
  OnboardingOption,
} from '../entities/ticket.entity';

export class UpdateTicketDto {
  @ApiProperty({
    description: 'ID del cliente asociado (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  customerId?: number;

  @ApiProperty({
    description: 'Dirección de la llamada (opcional)',
    enum: CallDirection,
    example: CallDirection.INBOUND,
    required: false,
  })
  @IsOptional()
  @IsEnum(CallDirection)
  direction?: CallDirection;

  @ApiProperty({
    description: 'ID del patio/yard asociado (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  yardId?: number;

  @ApiProperty({
    description: 'Teléfono del cliente (opcional)',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({
    description: 'Disposición del ticket - Manual por el agente (opcional)',
    enum: TicketDisposition,
    example: TicketDisposition.BOOKING,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketDisposition)
  disposition?: TicketDisposition;

  @ApiProperty({
    description: 'Campaña - ONBOARDING o AR (opcional)',
    enum: ManagementType,
    example: ManagementType.ONBOARDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(ManagementType)
  campaign?: ManagementType;

  @ApiProperty({
    description: 'ID del agente asignado (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  agentId?: number;

  @ApiProperty({
    description: 'Estado del ticket (opcional, default: IN_PROGRESS)',
    enum: TicketStatus,
    example: TicketStatus.IN_PROGRESS,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiProperty({
    description: 'Prioridad del ticket (opcional, default: LOW)',
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({
    description: 'ID de la llamada en Aircall (opcional)',
    example: 'aircall_123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  aircallId?: string;

  @ApiProperty({
    description: 'Duración de la llamada en segundos (opcional)',
    example: 300,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({
    description: 'Detalle del problema - Manual por el agente (opcional)',
    example: 'Cliente necesita ayuda con su reserva',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  issueDetail?: string;

  @ApiProperty({
    description: 'URLs de archivos adjuntos - Manual por el agente (opcional)',
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
      'Opción de onboarding - Solo aplica cuando campaign es ONBOARDING. Manual por el agente (opcional)',
    enum: OnboardingOption,
    example: OnboardingOption.REGISTER,
    required: false,
  })
  @IsOptional()
  @IsEnum(OnboardingOption)
  onboardingOption?: OnboardingOption;
}
