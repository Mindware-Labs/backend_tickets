import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
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
import { diskStorage } from 'multer';
import * as path from 'path';

@ApiTags('tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  private static buildAttachmentStorage() {
    return diskStorage({
      destination: path.join(process.cwd(), 'uploads', 'tickets'),
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
      storage: TicketController.buildAttachmentStorage(),
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
    @UploadedFiles() files: Array<{ filename: string }>,
  ) {
    const fileUrls = (files || []).map(
      (file) => `/uploads/tickets/${file.filename}`,
    );
    return this.ticketService.addAttachments(+id, fileUrls);
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
