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
import { memoryStorage } from 'multer';
import {
  getSignedDownloadUrl,
  resolveStoredFileLocation,
  storeUploadedFile,
} from '../common/storage';
import type { Response } from 'express';

type UploadedKnowledgeFile = {
  filename: string;
  originalname?: string;
  mimetype?: string;
  buffer: Buffer;
};

@ApiTags('knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new knowledge article' })
  @ApiBody({ type: CreateKnowledgeDto })
  @ApiResponse({
    status: 201,
    description: 'Knowledge article created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  create(@Body() createKnowledgeDto: CreateKnowledgeDto) {
    return this.knowledgeService.create(createKnowledgeDto);
  }

  @Post('with-file')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a new knowledge article with file',
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
    description: 'Knowledge article created successfully',
  })
  async createWithFile(
    @Body() createKnowledgeDto: CreateKnowledgeDto,
    @UploadedFile() file?: UploadedKnowledgeFile,
  ) {
    if (!file) {
      return this.knowledgeService.create(createKnowledgeDto);
    }

    createKnowledgeDto.fileUrl = await storeUploadedFile({
      folder: 'knowledge',
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname || 'file',
    });
    return this.knowledgeService.create(createKnowledgeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all knowledge articles' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Knowledge articles list retrieved successfully',
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.knowledgeService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a knowledge article by ID' })
  @ApiParam({
    name: 'id',
    description: 'Knowledge article ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Knowledge article found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge article not found',
  })
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.knowledgeService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a knowledge article' })
  @ApiParam({
    name: 'id',
    description: 'Knowledge article ID',
    type: Number,
  })
  @ApiBody({ type: UpdateKnowledgeDto })
  @ApiResponse({
    status: 200,
    description: 'Knowledge article updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge article not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateKnowledgeDto: UpdateKnowledgeDto,
  ) {
    return this.knowledgeService.update(+id, updateKnowledgeDto);
  }

  @Patch(':id/with-file')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update a knowledge article with file',
  })
  @ApiParam({
    name: 'id',
    description: 'Knowledge article ID',
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
      updateKnowledgeDto.fileUrl = await storeUploadedFile({
        folder: 'knowledge',
        buffer: file.buffer,
        contentType: file.mimetype,
        originalName: file.originalname || 'file',
      });
    }
    return this.knowledgeService.update(+id, updateKnowledgeDto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download knowledge article file' })
  @ApiParam({
    name: 'id',
    description: 'Knowledge article ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'File downloaded successfully',
  })
  async downloadFile(
    @Param('id', IdValidationPipe) id: string,
    @Res() res: Response,
  ) {
    const knowledge = await this.knowledgeService.findOne(+id);
    if (!knowledge.fileUrl) {
      throw new NotFoundException('No file associated with this knowledge');
    }
    const location = resolveStoredFileLocation(
      'knowledge',
      knowledge.fileUrl,
    );
    if (!location) {
      throw new NotFoundException('File not found');
    }
    if (location.type === 's3') {
      const signedUrl = await getSignedDownloadUrl(location);
      if (!signedUrl) {
        throw new NotFoundException('File not found');
      }
      return res.redirect(signedUrl);
    }
    return res.download(location.filePath);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a knowledge article' })
  @ApiParam({
    name: 'id',
    description: 'Knowledge article ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Knowledge article deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge article not found',
  })
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.knowledgeService.remove(+id);
  }
}
