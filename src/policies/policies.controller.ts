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
import { memoryStorage } from 'multer';
import {
  getSignedDownloadUrl,
  resolveStoredFileLocation,
  storeUploadedFile,
} from '../common/storage';
import type { Response } from 'express';

type UploadedPolicyFile = {
  filename: string;
  originalname?: string;
  mimetype?: string;
  buffer: Buffer;
};

@ApiTags('policies')
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new policy' })
  create(@Body() createPolicyDto: CreatePolicyDto) {
    return this.policiesService.create(createPolicyDto);
  }

  @Post('with-file')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new policy with file' })
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
    description: 'Policy created successfully',
  })
  async createWithFile(
    @Body() createPolicyDto: CreatePolicyDto,
    @UploadedFile() file?: UploadedPolicyFile,
  ) {
    if (!file) {
      return this.policiesService.create(createPolicyDto);
    }

    createPolicyDto.fileUrl = await storeUploadedFile({
      folder: 'policies',
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname || 'file',
    });
    return this.policiesService.create(createPolicyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all policies with pagination' })
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
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a policy with file' })
  @ApiParam({
    name: 'id',
    description: 'Policy ID',
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
      updatePolicyDto.fileUrl = await storeUploadedFile({
        folder: 'policies',
        buffer: file.buffer,
        contentType: file.mimetype,
        originalName: file.originalname || 'file',
      });
    }
    return this.policiesService.update(+id, updatePolicyDto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download policy file' })
  @ApiParam({
    name: 'id',
    description: 'Policy ID',
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
    const policy = await this.policiesService.findOne(+id);
    if (!policy.fileUrl) {
      throw new NotFoundException('No file associated with this policy');
    }
    const location = resolveStoredFileLocation('policies', policy.fileUrl);
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
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.policiesService.remove(+id);
  }
}
