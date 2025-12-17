import { PartialType } from '@nestjs/mapped-types';
import { CreateWebHookEventDto } from './create-web-hook-event.dto';

export class UpdateWebHookEventDto extends PartialType(CreateWebHookEventDto) {}
