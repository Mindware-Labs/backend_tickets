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
  ParseIntPipe,       // <--- NUEVO IMPORT
  DefaultValuePipe,   // <--- NUEVO IMPORT
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
@Controller('api/tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  create(@Body() createTicketDto: CreateTicketDto, @Request() req) {
    const userId = req.user?.id;
    return this.ticketService.create(createTicketDto, userId);
  }

  // 👇 AQUÍ ESTABA EL PROBLEMA DEL ERROR 500 EN PAGINACIÓN
  @Get()
  @ApiOperation({ summary: 'Get a paginated list of tickets' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiResponse({ status: 200, description: 'Ticket list' })
  findAll(
    // DefaultValuePipe(1) pone un 1 si no envían nada
    // ParseIntPipe convierte "500" (string) a 500 (number) automáticamente
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.ticketService.findAll(page, limit);
  }
  // 👆 FIN DE LA CORRECCIÓN

  @Get('attachments/download')
  @ApiOperation({ summary: 'Download ticket attachment' })
  @ApiQuery({
    name: 'fileUrl',
    required: true,
    type: String,
    description: 'Stored attachment URL',
  })
  @ApiResponse({
    status: 200,
    description: 'Attachment downloaded successfully',
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
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket found' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.ticketService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket' })
  @ApiParam({ name: 'id', type: Number, description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket updated' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
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
  @ApiOperation({ summary: 'Upload attachments for a ticket' })
  @ApiParam({ name: 'id', type: Number, description: 'Ticket ID' })
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
  @ApiResponse({ status: 200, description: 'Attachments uploaded' })
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
  @ApiOperation({ summary: 'Delete ticket' })
  @ApiParam({ name: 'id', type: Number, description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket deleted' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.ticketService.remove(+id);
  }
}