import { Transform } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
} from 'class-validator';
import {
  TicketPriority,
  TicketStatus,
  TicketDisposition,
} from '../entities/ticket.entity';

export class UpdateTicketDto {
  //  Campos MANUALES que se pueden actualizar después de crear el ticket
  @IsOptional()
  @IsString()
  yarda?: string;

  @IsOptional()
  @IsEnum(TicketDisposition)
  disposition?: TicketDisposition;

  @IsOptional()
  @IsString()
  issueDetail?: string;

  @IsOptional()
  @IsString()
  onboardingOption: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsNumber()
  agentId?: number;
}
