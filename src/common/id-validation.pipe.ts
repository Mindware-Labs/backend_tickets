import {
  ArgumentMetadata,
  Injectable,
  ParseIntPipe,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class IdValidationPipe extends ParseIntPipe {
  constructor() {
    super({
      exceptionFactory: () => new BadRequestException('Invalid ID'),
    });
  }
}
