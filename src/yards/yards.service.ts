import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateYardDto } from './dto/create-yard.dto';
import { UpdateYardDto } from './dto/update-yard.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Yard } from './entities/yard.entity';
import { Repository } from 'typeorm';
import { Ticket } from '../ticket/entities/ticket.entity';

@Injectable()
export class YardsService {
  constructor(
    @InjectRepository(Yard)
    private readonly yardRepository: Repository<Yard>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  create(createYardDto: CreateYardDto) {
    const yard = this.yardRepository.create(createYardDto);
    return this.yardRepository.save(yard);
  }

  async findAll() {
    const yards = await this.yardRepository.find({
      relations: ['landlord'],
    });

    const yardIds = yards.map((yard) => yard.id);
    const ticketCounts = await this.getTicketCounts(yardIds);

    return yards.map((yard) =>
      Object.assign(yard, { ticketCount: ticketCounts.get(yard.id) || 0 }),
    );
  }

  async findOne(id: number) {
    const yard = await this.yardRepository.findOne({
      where: { id },
      relations: ['landlord'],
    });

    if (!yard) {
      throw new NotFoundException(`Yard with ID ${id} not found`);
    }
    const ticketCount = await this.ticketRepository.count({
      where: { yardId: yard.id },
    });

    return Object.assign(yard, { ticketCount });
  }

  async update(id: number, updateYardDto: UpdateYardDto) {
    const yard = await this.findOne(id);
    Object.assign(yard, updateYardDto);
    return await this.yardRepository.save(yard);
  }

  async remove(id: number) {
    const yard = await this.yardRepository.findOne({
      where: { id },
      relations: ['tickets'],
    });
    if (!yard) {
      throw new NotFoundException(`Yard with ID ${id} not found`);
    }
    if (yard.tickets && yard.tickets.length > 0) {
      throw new ConflictException(
        `Cannot delete yard because it has associated tickets.`,
      );
    }
    await this.yardRepository.remove(yard);
    return { message: `Yard with ID ${id} has been removed` };
  }

  private async getTicketCounts(yardIds: number[]) {
    if (yardIds.length === 0) {
      return new Map<number, number>();
    }

    const rows = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.yardId', 'yardId')
      .addSelect('COUNT(ticket.id)', 'count')
      .where('ticket.yardId IN (:...yardIds)', { yardIds })
      .groupBy('ticket.yardId')
      .getRawMany<{ yardId: number; count: string }>();

    const counts = new Map<number, number>();
    rows.forEach((row) => {
      counts.set(Number(row.yardId), Number(row.count));
    });

    return counts;
  }
}
