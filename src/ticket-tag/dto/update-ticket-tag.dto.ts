import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketTagDto } from './create-ticket-tag.dto';

export class UpdateTicketTagDto extends PartialType(CreateTicketTagDto) {}
