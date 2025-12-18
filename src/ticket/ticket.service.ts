import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { TicketTag } from '../ticket-tag/entities/ticket-tag.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketTag)
    private readonly ticketTagRepository: Repository<TicketTag>,
  ) {}

  async create(createTicketDto: CreateTicketDto, createdByUserId: number) {
    const { tagIds, ...ticketData } = createTicketDto;

    const count = await this.ticketRepository.count();
    const ticketNumber = `#${(count + 1).toString().padStart(4, '0')}`;

    const ticket = this.ticketRepository.create({
      ...ticketData,
      ticketNumber,
      createdByUserId,
    });

    // Asignar tags si hay
    if (tagIds && tagIds.length > 0) {
      const tags = await this.ticketTagRepository.find({
        where: { id: In(tagIds) },
      });
      ticket.tags = tags;
    }

    return this.ticketRepository.save(ticket);
  }

  findAll() {
    return this.ticketRepository.find({
      relations: ['assignedTo', 'createdBy', 'customer', 'tags'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'createdBy', 'customer', 'tags'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }
    return ticket;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto) {
    const { tagIds, ...ticketData } = updateTicketDto;
    const ticket = await this.findOne(id);

    Object.assign(ticket, ticketData);

    if (tagIds !== undefined) {
      if (tagIds.length > 0) {
        const tags = await this.ticketTagRepository.find({
          where: { id: In(tagIds) },
        });
        ticket.tags = tags;
      } else {
        ticket.tags = [];
      }
    }

    return this.ticketRepository.save(ticket);
  }

  async remove(id: number) {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
    return { message: `Ticket with id ${id} has been removed` };
  }
}
