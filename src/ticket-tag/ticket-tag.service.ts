import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTicketTagDto } from './dto/create-ticket-tag.dto';
import { UpdateTicketTagDto } from './dto/update-ticket-tag.dto';
import { TicketTag } from './entities/ticket-tag.entity';

@Injectable()
export class TicketTagService {
  constructor(
    @InjectRepository(TicketTag)
    private readonly ticketTagRepository: Repository<TicketTag>,
  ) {}

  create(createTicketTagDto: CreateTicketTagDto) {
    const tag = this.ticketTagRepository.create(createTicketTagDto);
    return this.ticketTagRepository.save(tag);
  }

  findAll() {
    return this.ticketTagRepository.find();
  }

  async findOne(id: number) {
    const tag = await this.ticketTagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`TicketTag with id ${id} not found`);
    }
    return tag;
  }

  async update(id: number, updateTicketTagDto: UpdateTicketTagDto) {
    const tag = await this.findOne(id);
    Object.assign(tag, updateTicketTagDto);
    return this.ticketTagRepository.save(tag);
  }

  async remove(id: number) {
    const tag = await this.findOne(id);
    await this.ticketTagRepository.remove(tag);
    return { message: `TicketTag with id ${id} has been removed` };
  }
}
