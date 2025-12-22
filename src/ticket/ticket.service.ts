import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) { }

  async create(createTicketDto: CreateTicketDto, createdByUserId: number) {
    const ticketData = createTicketDto;

    const count = await this.ticketRepository.count();
    const ticketNumber = `#${(count + 1).toString().padStart(4, '0')}`;

    const ticketDataWithNumber = {
      ...ticketData,
      ticketNumber,
    };

    const ticket = this.ticketRepository.create(ticketDataWithNumber);
    const savedTicket = await this.ticketRepository.save(ticket);

    return savedTicket;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [tickets, total] = await this.ticketRepository.findAndCount({
      relations: ['assignedTo', 'customer', 'yard'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'customer', 'yard'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }
    return ticket;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto, userId?: number) {
    const ticketData = updateTicketDto;
    const ticket = await this.findOne(id);
    const oldTicket = { ...ticket };

    Object.assign(ticket, ticketData);
    await this.ticketRepository.save(ticket);

    return this.findOne(id);
  }

  async remove(id: number) {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
    return { message: `Ticket with id ${id} has been removed` };
  }
}
