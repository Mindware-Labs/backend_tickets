import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WebHookEventService } from './web-hook-event.service';
import { CreateWebHookEventDto } from './dto/create-web-hook-event.dto';
import { UpdateWebHookEventDto } from './dto/update-web-hook-event.dto';

@Controller('web-hook-event')
export class WebHookEventController {
  constructor(private readonly webHookEventService: WebHookEventService) {}

  @Post()
  create(@Body() createWebHookEventDto: CreateWebHookEventDto) {
    return this.webHookEventService.create(createWebHookEventDto);
  }

  @Get()
  findAll() {
    return this.webHookEventService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webHookEventService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebHookEventDto: UpdateWebHookEventDto) {
    return this.webHookEventService.update(+id, updateWebHookEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webHookEventService.remove(+id);
  }
}
