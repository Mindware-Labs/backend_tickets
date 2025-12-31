import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StreamableFile, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('performance')
  @ApiOperation({ summary: 'Performance report data' })
  @ApiQuery({ name: 'period', required: false, description: '7d | 30d | 90d' })
  @ApiQuery({ name: 'start', required: false, description: 'ISO start date' })
  @ApiQuery({ name: 'end', required: false, description: 'ISO end date' })
  getPerformanceReport(
    @Query('period') period?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.reportsService.getPerformanceReport({ period, start, end });
  }

  @Get('performance/pdf')
  @ApiOperation({ summary: 'Performance report PDF' })
  @ApiQuery({ name: 'start', required: true, description: 'ISO start date' })
  @ApiQuery({ name: 'end', required: true, description: 'ISO end date' })
  @ApiQuery({ name: 'logoUrl', required: false, description: 'Logo URL to embed' })
  async getPerformancePdf(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('logoUrl') logoUrl: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pdf = await this.reportsService.getPerformanceReportPdf(start, end, logoUrl);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="performance-report.pdf"`,
    });
    return new StreamableFile(pdf);
  }

  @Get('agents')
  @ApiOperation({ summary: 'Agent performance report data' })
  @ApiQuery({ name: 'period', required: false, description: '7d | 30d | 90d' })
  @ApiQuery({ name: 'start', required: false, description: 'ISO start date' })
  @ApiQuery({ name: 'end', required: false, description: 'ISO end date' })
  getAgentsReport(
    @Query('period') period?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.reportsService.getAgentsReport({ period, start, end });
  }

  @Get('agents/pdf')
  @ApiOperation({ summary: 'Agent report PDF' })
  @ApiQuery({ name: 'start', required: true, description: 'ISO start date' })
  @ApiQuery({ name: 'end', required: true, description: 'ISO end date' })
  @ApiQuery({ name: 'logoUrl', required: false, description: 'Logo URL to embed' })
  async getAgentsPdf(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('logoUrl') logoUrl: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pdf = await this.reportsService.getAgentsReportPdf(start, end, logoUrl);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="agents-report.pdf"`,
    });
    return new StreamableFile(pdf);
  }
}
