import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import {
  ManagementType,
  TicketPriority,
  ContactSource,
} from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsNotEmpty({ message: 'El tipo de gestión es requerido' })
  @IsEnum(ManagementType)
  managementType: ManagementType;

  @IsNotEmpty({ message: 'El asunto es requerido' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  subject: string;

  @IsNotEmpty({ message: 'El detalle del problema es requerido' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  issueDetail: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsNotEmpty({ message: 'El origen es requerido' })
  @IsEnum(ContactSource)
  source: ContactSource;

  @IsOptional()
  @IsString()
  contactChannel?: string;

  @IsOptional()
  @IsNumber()
  assignedToUserId?: number;

  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  @IsNumber()
  customerId: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds?: number[];
}
