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
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiParam, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { IdValidationPipe } from '../common/id-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ensureUploadsDir } from '../common/uploads';
import type { Response } from 'express';

type UploadedPolicyFile = {
  filename: string;
  originalname?: string;
};

@ApiTags('policies')
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  private static buildStorage() {
    return diskStorage({
      destination: ensureUploadsDir('policies'),
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
  @ApiOperation({ summary: 'Crear una nueva política' })
  create(@Body() createPolicyDto: CreatePolicyDto) {
    return this.policiesService.create(createPolicyDto);
  }

  @Post('with-file')
  @UseInterceptors(
    FileInterceptor('file', { storage: PoliciesController.buildStorage() }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Crear una nueva política con archivo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Política creada exitosamente',
  })
  createWithFile(
    @Body() createPolicyDto: CreatePolicyDto,
    @UploadedFile() file?: UploadedPolicyFile,
  ) {
    if (file) {
      createPolicyDto.fileUrl = `/uploads/policies/${file.filename}`;
    }
    return this.policiesService.create(createPolicyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las políticas con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.policiesService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.policiesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
  ) {
    return this.policiesService.update(+id, updatePolicyDto);
  }

  @Patch(':id/with-file')
  @UseInterceptors(
    FileInterceptor('file', { storage: PoliciesController.buildStorage() }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Actualizar una política con archivo' })
  @ApiParam({
    name: 'id',
    description: 'ID de la política',
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
    @Body() updatePolicyDto: UpdatePolicyDto,
    @UploadedFile() file?: UploadedPolicyFile,
  ) {
    if (file) {
      const existing = await this.policiesService.findOne(+id);
      await this.policiesService.removeFileIfExists(existing.fileUrl);
      updatePolicyDto.fileUrl = `/uploads/policies/${file.filename}`;
    }
    return this.policiesService.update(+id, updatePolicyDto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar archivo de la política' })
  @ApiParam({
    name: 'id',
    description: 'ID de la política',
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
    const policy = await this.policiesService.findOne(+id);
    if (!policy.fileUrl) {
      throw new NotFoundException('No file associated with this policy');
    }
    const filePath = this.policiesService.resolveFilePath(policy.fileUrl);
    if (!filePath) {
      throw new NotFoundException('File not found');
    }
    return res.download(filePath);
  }

  @Delete(':id')
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.policiesService.remove(+id);
  }
}
