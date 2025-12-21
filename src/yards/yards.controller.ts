import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { YardsService } from './yards.service';
import { CreateYardDto } from './dto/create-yard.dto';
import { UpdateYardDto } from './dto/update-yard.dto';
import { IdValidationPipe } from 'src/common/id-validation.pipe';

@Controller('yards')
export class YardsController {
  constructor(private readonly yardsService: YardsService) {}

  @Post()
  create(@Body() createYardDto: CreateYardDto) {
    return this.yardsService.create(createYardDto);
  }

  @Get()
  findAll() {
    return this.yardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.yardsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateYardDto: UpdateYardDto,
  ) {
    return this.yardsService.update(+id, updateYardDto);
  }

  @Delete(':id')
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.yardsService.remove(+id);
  }
}
