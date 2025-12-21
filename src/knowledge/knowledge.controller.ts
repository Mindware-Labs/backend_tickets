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
  @ApiResponse({
    status: 200,
    description: 'Lista de artículos de conocimiento obtenida exitosamente',
  })
  findAll() {
    return this.knowledgeService.findAll();
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
