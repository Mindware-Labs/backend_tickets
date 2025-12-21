import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Knowledge } from './entities/knowledge.entity';
import { Repository } from 'typeorm';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(Knowledge)
    private knowledgeRepository: Repository<Knowledge>,
  ) {}

  create(createKnowledgeDto: CreateKnowledgeDto) {
    return this.knowledgeRepository.save(createKnowledgeDto);
  }

  findAll() {
    return this.knowledgeRepository.find();
  }

  async findOne(id: number) {
    const knowledge = await this.knowledgeRepository.findOneBy({ id });

    if (!knowledge) {
      throw new NotFoundException(`Knowledge with ID ${id} not found`);
    }
    return knowledge;
  }

  async update(id: number, updateKnowledgeDto: UpdateKnowledgeDto) {
    const knowledge = await this.findOne(id);
    Object.assign(knowledge, updateKnowledgeDto);

    return this.knowledgeRepository.save(knowledge);
  }

  async remove(id: number) {
    const knowledge = await this.findOne(id);
    await this.knowledgeRepository.remove(knowledge);

    return { message: `Knowledge with ID ${id} has been removed` };
  }
}
