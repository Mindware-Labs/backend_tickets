import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
}
