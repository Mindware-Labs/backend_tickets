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

@ApiTags('campaigns')
@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva campaña' })
  @ApiResponse({ status: 201, description: 'Campaña creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignService.create(createCampaignDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de campañas' })
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
  @ApiQuery({
    name: 'tipo',
    required: false,
    type: String,
    description: 'Filtrar por tipo de campaña',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: String,
    description: 'Filtrar solo campañas activas (true)',
  })
  @ApiResponse({ status: 200, description: 'Lista de campañas' })
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
  @ApiOperation({ summary: 'Obtener campaña por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la campaña' })
  @ApiResponse({ status: 200, description: 'Campaña encontrada' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada' })
  findOne(@Param('id') id: string) {
    return this.campaignService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar campaña' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la campaña' })
  @ApiResponse({ status: 200, description: 'Campaña actualizada' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignService.update(+id, updateCampaignDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar campaña' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la campaña' })
  @ApiResponse({ status: 200, description: 'Campaña eliminada' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada' })
  remove(@Param('id') id: string) {
    return this.campaignService.remove(+id);
  }
}
