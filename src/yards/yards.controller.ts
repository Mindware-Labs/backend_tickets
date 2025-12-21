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
  @ApiOperation({ summary: 'Crear un nuevo yard' })
  @ApiBody({ type: CreateYardDto })
  @ApiResponse({
    status: 201,
    description: 'Yard creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  create(@Body() createYardDto: CreateYardDto) {
    return this.yardsService.create(createYardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los yards' })
  @ApiResponse({
    status: 200,
    description: 'Lista de yards obtenida exitosamente',
  })
  findAll() {
    return this.yardsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un yard por ID' })
  @ApiParam({ name: 'id', description: 'ID del yard', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Yard encontrado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Yard no encontrado',
  })
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.yardsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un yard' })
  @ApiParam({ name: 'id', description: 'ID del yard', type: Number })
  @ApiBody({ type: UpdateYardDto })
  @ApiResponse({
    status: 200,
    description: 'Yard actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Yard no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateYardDto: UpdateYardDto,
  ) {
    return this.yardsService.update(+id, updateYardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un yard' })
  @ApiParam({ name: 'id', description: 'ID del yard', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Yard eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Yard no encontrado',
  })
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.yardsService.remove(+id);
  }
}
