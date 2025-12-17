import { Injectable } from '@nestjs/common';
import { CreateWebHookEventDto } from './dto/create-web-hook-event.dto';
import { UpdateWebHookEventDto } from './dto/update-web-hook-event.dto';

@Injectable()
export class WebHookEventService {
  create(createWebHookEventDto: CreateWebHookEventDto) {
    return 'This action adds a new webHookEvent';
  }

  findAll() {
    return `This action returns all webHookEvent`;
  }

  findOne(id: number) {
    return `This action returns a #${id} webHookEvent`;
  }

  update(id: number, updateWebHookEventDto: UpdateWebHookEventDto) {
    return `This action updates a #${id} webHookEvent`;
  }

  remove(id: number) {
    return `This action removes a #${id} webHookEvent`;
  }
}
