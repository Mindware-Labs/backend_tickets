import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { IdValidationPipe } from '../common/id-validation.pipe';

@ApiTags('knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo artículo de conocimiento' })
  @ApiBody({ type: CreateKnowledgeDto })
  @ApiResponse({
    status: 201,
    description: 'Artículo de conocimiento creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  create(@Body() createKnowledgeDto: CreateKnowledgeDto) {
    return this.knowledgeService.create(createKnowledgeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los artículos de conocimiento' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista de artículos de conocimiento obtenida exitosamente',
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.knowledgeService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un artículo de conocimiento por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del artículo de conocimiento',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Artículo de conocimiento encontrado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Artículo de conocimiento no encontrado',
  })
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.knowledgeService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un artículo de conocimiento' })
  @ApiParam({
    name: 'id',
    description: 'ID del artículo de conocimiento',
    type: Number,
  })
  @ApiBody({ type: UpdateKnowledgeDto })
  @ApiResponse({
    status: 200,
    description: 'Artículo de conocimiento actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Artículo de conocimiento no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateKnowledgeDto: UpdateKnowledgeDto,
  ) {
    return this.knowledgeService.update(+id, updateKnowledgeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un artículo de conocimiento' })
  @ApiParam({
    name: 'id',
    description: 'ID del artículo de conocimiento',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Artículo de conocimiento eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Artículo de conocimiento no encontrado',
  })
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.knowledgeService.remove(+id);
  }
}
