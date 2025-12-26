import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  Request,
  Query,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { IdValidationPipe } from '../common/id-validation.pipe';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  getSignedDownloadUrl,
  resolveStoredFileLocation,
  storeUploadedFile,
} from '../common/storage';
import type { Response } from 'express';

type UploadedAttachmentFile = {
  originalname?: string;
  mimetype?: string;
  buffer: Buffer;
};

@ApiTags('tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo ticket' })
  @ApiResponse({ status: 201, description: 'Ticket creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createTicketDto: CreateTicketDto, @Request() req) {
    const userId = req.user?.id;
    return this.ticketService.create(createTicketDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de tickets paginada' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de elementos por página',
  })
  @ApiResponse({ status: 200, description: 'Lista de tickets' })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.ticketService.findAll(+page, +limit);
  }

  @Get('attachments/download')
  @ApiOperation({ summary: 'Descargar adjunto del ticket' })
  @ApiQuery({
    name: 'fileUrl',
    required: true,
    type: String,
    description: 'URL almacenada del adjunto',
  })
  @ApiResponse({
    status: 200,
    description: 'Adjunto descargado exitosamente',
  })
  async downloadAttachment(
    @Query('fileUrl') fileUrl: string,
    @Res() res: Response,
  ) {
    if (!fileUrl) {
      throw new NotFoundException('File not found');
    }
    const location = resolveStoredFileLocation('tickets', fileUrl);
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

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ticket por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del ticket' })
  @ApiResponse({ status: 200, description: 'Ticket encontrado' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.ticketService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar ticket' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del ticket' })
  @ApiResponse({ status: 200, description: 'Ticket actualizado' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketService.update(+id, updateTicketDto);
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: memoryStorage(),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir adjuntos para un ticket' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del ticket' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Adjuntos subidos' })
  uploadAttachments(
    @Param('id', IdValidationPipe) id: string,
    @UploadedFiles() files: UploadedAttachmentFile[],
  ) {
    if (!files || files.length === 0) {
      return this.ticketService.addAttachments(+id, []);
    }
    return Promise.all(
      files.map((file) =>
        storeUploadedFile({
          folder: 'tickets',
          buffer: file.buffer,
          contentType: file.mimetype,
          originalName: file.originalname || 'file',
        }),
      ),
    ).then((fileUrls) => this.ticketService.addAttachments(+id, fileUrls));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar ticket' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del ticket' })
  @ApiResponse({ status: 200, description: 'Ticket eliminado' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.ticketService.remove(+id);
  }
}
