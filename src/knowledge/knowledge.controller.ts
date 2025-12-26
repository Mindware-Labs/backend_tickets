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
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { IdValidationPipe } from '../common/id-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ensureUploadsDir } from '../common/uploads';
import type { Response } from 'express';

type UploadedKnowledgeFile = {
  filename: string;
  originalname?: string;
};

@ApiTags('knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  private static buildStorage() {
    return diskStorage({
      destination: ensureUploadsDir('knowledge'),
      filename: (_req, file, cb) => {
        const original = file.originalname || 'file';
        const safeName = original.replace(/[^a-zA-Z0-9._-]/g, '_');
        const unique = `${Date.now()}-${Math.round(
          Math.random() * 1e9,
        )}-${safeName}`;
        cb(null, unique);
      },
    });
  }

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

  @Post('with-file')
  @UseInterceptors(
    FileInterceptor('file', { storage: KnowledgeController.buildStorage() }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Crear un nuevo artículo de conocimiento con archivo',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['name', 'description'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Artículo de conocimiento creado exitosamente',
  })
  createWithFile(
    @Body() createKnowledgeDto: CreateKnowledgeDto,
    @UploadedFile() file?: UploadedKnowledgeFile,
  ) {
    if (file) {
      createKnowledgeDto.fileUrl = `/uploads/knowledge/${file.filename}`;
    }
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

  @Patch(':id/with-file')
  @UseInterceptors(
    FileInterceptor('file', { storage: KnowledgeController.buildStorage() }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Actualizar un artículo de conocimiento con archivo',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del artículo de conocimiento',
    type: Number,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async updateWithFile(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateKnowledgeDto: UpdateKnowledgeDto,
    @UploadedFile() file?: UploadedKnowledgeFile,
  ) {
    if (file) {
      const existing = await this.knowledgeService.findOne(+id);
      await this.knowledgeService.removeFileIfExists(existing.fileUrl);
      updateKnowledgeDto.fileUrl = `/uploads/knowledge/${file.filename}`;
    }
    return this.knowledgeService.update(+id, updateKnowledgeDto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar archivo del artículo de conocimiento' })
  @ApiParam({
    name: 'id',
    description: 'ID del artículo de conocimiento',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo descargado exitosamente',
  })
  async downloadFile(
    @Param('id', IdValidationPipe) id: string,
    @Res() res: Response,
  ) {
    const knowledge = await this.knowledgeService.findOne(+id);
    if (!knowledge.fileUrl) {
      throw new NotFoundException('No file associated with this knowledge');
    }
    const filePath = this.knowledgeService.resolveFilePath(knowledge.fileUrl);
    if (!filePath) {
      throw new NotFoundException('File not found');
    }
    return res.download(filePath);
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
