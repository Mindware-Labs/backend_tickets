import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { Yard } from '../yards/entities/yard.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Campaign } from '../campaign/entities/campaign.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,

    @InjectRepository(Yard)
    private readonly yardRepository: Repository<Yard>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
  ) {}

  async create(createTicketDto: CreateTicketDto, createdByUserId: number) {
    const ticketData = createTicketDto;
    const yard = await this.yardRepository.findOneBy({
      id: createTicketDto.yardId,
    });

    if (!yard) {
      throw new NotFoundException(
        `Yard with ID ${createTicketDto.yardId} not found`,
      );
    }

    const customer = await this.customerRepository.findOneBy({
      id: createTicketDto.customerId,
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${createTicketDto.customerId} not found`,
      );
    }

    const campaign = await this.campaignRepository.findOneBy({
      id: createTicketDto.campaignId,
    });

    if (!campaign) {
      throw new NotFoundException(
        `Campaign with ID ${createTicketDto.campaignId} not found`,
      );
    }

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

  async update(id: number, updateTicketDto: UpdateTicketDto) {
    const ticketData = updateTicketDto;
    const ticket = await this.findOne(id);

    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }

    if (updateTicketDto.yardId) {
      const yard = await this.yardRepository.findOneBy({
        id: updateTicketDto.yardId,
      });

      if (!yard) {
        throw new NotFoundException(
          `Yard with ID ${updateTicketDto.yardId} not found`,
        );
      }
      ticket.yard = yard;
    }

    if (updateTicketDto.customerId) {
      const customer = await this.customerRepository.findOneBy({
        id: updateTicketDto.customerId,
      });

      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${updateTicketDto.customerId} not found`,
        );
      }
      ticket.customer = customer;
    }

    if (updateTicketDto.campaignId) {
      const campaign = await this.campaignRepository.findOneBy({
        id: updateTicketDto.campaignId,
      });

      if (!campaign) {
        throw new NotFoundException(
          `Campaign with ID ${updateTicketDto.campaignId} not found`,
        );
      }

      ticket.campaign = campaign;
    }

    Object.assign(ticket, ticketData);
    await this.ticketRepository.save(ticket);

    return this.findOne(id);
  }

  async addAttachments(id: number, fileUrls: string[]) {
    const ticket = await this.findOne(id);
    const existing = ticket.attachments || [];
    ticket.attachments = [...existing, ...fileUrls];
    await this.ticketRepository.save(ticket);
    return this.findOne(id);
  }

  async remove(id: number) {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
    return { message: `Ticket with id ${id} has been removed` };
  }
}
