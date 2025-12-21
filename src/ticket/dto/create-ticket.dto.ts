import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ManagementType,
  TicketPriority,
  TicketStatus,
  ContactSource,
  TicketDisposition,
  CallDirection,
} from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Tipo de gestión del ticket',
    enum: ManagementType,
    example: ManagementType.ONBOARDING,
  })
  @IsNotEmpty({ message: 'El tipo de gestión es requerido' })
  @IsEnum(ManagementType)
  managementType: ManagementType;

  @ApiProperty({
    description: 'Asunto del ticket',
    example: 'Consulta sobre producto',
  })
  @IsNotEmpty({ message: 'El asunto es requerido' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  subject: string;

  @ApiProperty({
    description: 'Origen del contacto',
    enum: ContactSource,
    example: ContactSource.PHONE,
  })
  @IsNotEmpty({ message: 'El origen es requerido' })
  @IsEnum(ContactSource)
  source: ContactSource;

  @ApiProperty({
    description: 'ID del cliente asociado',
    example: 1,
  })
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  @IsNumber()
  customerId: number;

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
    description: 'Número de origen de la llamada (opcional)',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  fromNumber?: string;

  @ApiProperty({
    description: 'Número de destino de la llamada (opcional)',
    example: '+0987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  toNumber?: string;

  @ApiProperty({
    description: 'Canal de contacto (opcional)',
    example: 'phone',
    required: false,
  })
  @IsOptional()
  @IsString()
  contactChannel?: string;

  @ApiProperty({
    description: 'ID del agente asignado (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  agentId?: number;

  @ApiProperty({
    description: 'Disposición del ticket (opcional)',
    enum: TicketDisposition,
    example: TicketDisposition.BOOKING,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketDisposition)
  disposition?: TicketDisposition;

  @ApiProperty({
    description: 'Prioridad del ticket (opcional)',
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({
    description: 'Estado del ticket (opcional)',
    enum: TicketStatus,
    example: TicketStatus.OPEN,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiProperty({
    description: 'URLs de archivos adjuntos (opcional)',
    example: ['https://example.com/file1.pdf'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({
    description: 'IDs de etiquetas asociadas (opcional)',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds?: number[];
}
