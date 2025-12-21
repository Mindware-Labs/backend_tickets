import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IdValidationPipe } from '../common/id-validation.pipe';

@ApiTags('tickets')
@Controller('ticket')
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

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ticket por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del ticket' })
  @ApiResponse({ status: 200, description: 'Ticket encontrado' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  findOne(@Param('id') id: string) {
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
    @Request() req,
  ) {
    const userId = req.user?.id;
    return this.ticketService.update(+id, updateTicketDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar ticket' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del ticket' })
  @ApiResponse({ status: 200, description: 'Ticket eliminado' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  remove(@Param('id') id: string) {
    return this.ticketService.remove(+id);
  }
}
