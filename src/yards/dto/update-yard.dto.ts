import { PartialType } from '@nestjs/swagger';
import { CreateYardDto } from './create-yard.dto';

export class UpdateYardDto extends PartialType(CreateYardDto) {}
