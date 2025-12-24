import { Controller, Get, Query } from '@nestjs/common';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    if (active === undefined) {
      return this.agentsService.findAll();
    }
    const isActive = active === 'true' || active === '1';
    return this.agentsService.findAll(isActive);
  }
}
