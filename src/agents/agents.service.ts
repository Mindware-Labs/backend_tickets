import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  findAll(isActive?: boolean) {
    if (typeof isActive === 'boolean') {
      return this.agentRepository.find({ where: { isActive } });
    }
    return this.agentRepository.find();
  }
}
