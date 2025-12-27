import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { YardsService } from './yards.service';
import { CreateYardDto } from './dto/create-yard.dto';
import { UpdateYardDto } from './dto/update-yard.dto';
import { IdValidationPipe } from 'src/common/id-validation.pipe';

@ApiTags('yards')
@Controller('yards')
export class YardsController {
  constructor(private readonly yardsService: YardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new yard' })
  @ApiBody({ type: CreateYardDto })
  @ApiResponse({
    status: 201,
    description: 'Yard created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  create(@Body() createYardDto: CreateYardDto) {
    return this.yardsService.create(createYardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all yards' })
  @ApiResponse({
    status: 200,
    description: 'Yards list retrieved successfully',
  })
  findAll() {
    return this.yardsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a yard by ID' })
  @ApiParam({ name: 'id', description: 'Yard ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Yard found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Yard not found',
  })
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.yardsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a yard' })
  @ApiParam({ name: 'id', description: 'Yard ID', type: Number })
  @ApiBody({ type: UpdateYardDto })
  @ApiResponse({
    status: 200,
    description: 'Yard updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Yard not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateYardDto: UpdateYardDto,
  ) {
    return this.yardsService.update(+id, updateYardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a yard' })
  @ApiParam({ name: 'id', description: 'Yard ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Yard deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Yard not found',
  })
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.yardsService.remove(+id);
  }
}
