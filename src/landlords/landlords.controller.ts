import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { LandlordsService } from './landlords.service';
import { CreateLandlordDto } from './dto/create-landlord.dto';
import { UpdateLandlordDto } from './dto/update-landlord.dto';
import { IdValidationPipe } from '../common/id-validation.pipe';

@Controller('landlords')
export class LandlordsController {
  constructor(private readonly landlordsService: LandlordsService) {}

  @Post()
  create(@Body() createLandlordDto: CreateLandlordDto) {
    return this.landlordsService.create(createLandlordDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.landlordsService.findAll(+page, +limit);
  }

  @Get(':id')
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.landlordsService.findOne(+id);
  }

  @Get(':id/report')
  getReport(
    @Param('id', IdValidationPipe) id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('yardId') yardId?: string,
  ) {
    return this.landlordsService.getReport(
      +id,
      startDate,
      endDate,
      yardId ? Number(yardId) : undefined,
    );
  }

  @Post(':id/report/send')
  sendReport(
    @Param('id', IdValidationPipe) id: string,
    @Body()
    body: { startDate: string; endDate: string; yardId?: number },
  ) {
    return this.landlordsService.sendReport(
      +id,
      body.startDate,
      body.endDate,
      body.yardId,
    );
  }

  @Get(':id/report/pdf')
  async downloadReportPdf(
    @Param('id', IdValidationPipe) id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res({ passthrough: true }) res: Response,
    @Query('yardId') yardId?: string,
  ) {
    const pdf = await this.landlordsService.getReportPdf(
      +id,
      startDate,
      endDate,
      yardId ? Number(yardId) : undefined,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="landlord-report-${id}.pdf"`,
    });

    return new StreamableFile(pdf);
  }

  @Patch(':id')
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateLandlordDto: UpdateLandlordDto,
  ) {
    return this.landlordsService.update(+id, updateLandlordDto);
  }

  @Delete(':id')
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.landlordsService.remove(+id);
  }
}
