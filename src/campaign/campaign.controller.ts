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
    summary: 'Create a new campaign',
    description:
      'Creates a new campaign. It can optionally be associated with a yard by sending yardaId.',
  })
  @ApiResponse({
    status: 201,
    description: 'Campaign created successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid data (e.g., name required, yardaId must be positive)',
  })
  create(@Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignService.create(createCampaignDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get a list of campaigns',
    description:
      'Returns a list of campaigns including associated yard information.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    type: String,
    description: 'Filter by campaign type (ONBOARDING, AR, OTHER)',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: String,
    description: 'Filter only active campaigns (true)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of campaigns with associated yards',
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
    summary: 'Get campaign by ID',
    description:
      'Returns a specific campaign including associated yard information.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign found with its associated yard',
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.campaignService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update campaign',
    description:
      'Updates an existing campaign. Allows changing the associated yard by sending yardaId.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description:
      'Campaign updated successfully. Includes the yard relationship if present.',
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({
    status: 400,
    description: 'Invalid data (e.g., yardaId must be a positive number)',
  })
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignService.update(+id, updateCampaignDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiParam({ name: 'id', type: Number, description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign deleted' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.campaignService.remove(+id);
  }
}
