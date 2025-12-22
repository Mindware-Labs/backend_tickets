import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { IdValidationPipe } from '../common/id-validation.pipe';

@ApiTags('campaigns')
@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nueva campaña',
    description:
      'Crea una nueva campaña. Opcionalmente puede asociarse a un yard enviando yardaId.',
  })
  @ApiResponse({
    status: 201,
    description: 'Campaña creada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos (ej: nombre requerido, yardaId debe ser positivo)',
  })
  create(@Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignService.create(createCampaignDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener lista de campañas',
    description:
      'Retorna lista de campañas con información del yard asociado incluida.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de elementos por página (default: 10)',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    type: String,
    description: 'Filtrar por tipo de campaña (ONBOARDING, AR, OTHER)',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: String,
    description: 'Filtrar solo campañas activas (true)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de campañas con sus yards asociados',
  })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('tipo') tipo?: string,
    @Query('active') active?: string,
  ) {
    if (tipo) {
      return this.campaignService.findByType(tipo);
    }
    if (active === 'true') {
      return this.campaignService.findActive();
    }
    return this.campaignService.findAll(+page, +limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener campaña por ID',
    description:
      'Retorna una campaña específica con la información del yard asociado incluida.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la campaña' })
  @ApiResponse({
    status: 200,
    description: 'Campaña encontrada con su yard asociado',
  })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada' })
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.campaignService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar campaña',
    description:
      'Actualiza una campaña existente. Permite modificar el yard asociado enviando yardaId.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la campaña' })
  @ApiResponse({
    status: 200,
    description:
      'Campaña actualizada exitosamente. Incluye la relación con el yard si existe.',
  })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos (ej: yardaId debe ser un número positivo)',
  })
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignService.update(+id, updateCampaignDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar campaña' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la campaña' })
  @ApiResponse({ status: 200, description: 'Campaña eliminada' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada' })
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.campaignService.remove(+id);
  }
}
