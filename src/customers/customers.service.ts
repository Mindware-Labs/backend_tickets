import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { In, Repository } from 'typeorm';
import { Ticket } from '../ticket/entities/ticket.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  private async resolveCampaigns(campaignIds?: number[]) {
    if (!campaignIds || campaignIds.length === 0) {
      return [];
    }

    const campaigns = await this.campaignRepository.findBy({
      id: In(campaignIds),
    });

    if (campaigns.length !== campaignIds.length) {
      const foundIds = new Set(campaigns.map((campaign) => campaign.id));
      const missingIds = campaignIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Campaign(s) with ID(s) ${missingIds.join(', ')} not found`,
      );
    }

    return campaigns;
  }

  async create(createCustomerDto: CreateCustomerDto) {
    const { campaignIds, ...payload } = createCustomerDto;
    const campaigns = await this.resolveCampaigns(campaignIds);

    const customer = this.customerRepository.create({
      ...payload,
      campaigns,
    });

    return this.customerRepository.save(customer);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [customers, total] = await this.customerRepository.findAndCount({
      relations: ['campaigns'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const customerIds = customers.map((customer) => customer.id);
    const ticketCounts = await this.getTicketCounts(customerIds);
    const data = customers.map((customer) => ({
      ...customer,
      ticketCount: ticketCounts.get(customer.id) || 0,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['campaigns'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    const ticketCount = await this.ticketRepository.count({
      where: { customerId: customer.id },
    });

    return Object.assign(customer, { ticketCount });
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findOne(id);

    const { campaignIds, ...payload } = updateCustomerDto;

    if (campaignIds) {
      customer.campaigns = await this.resolveCampaigns(campaignIds);
    }

    Object.assign(customer, payload);
    return this.customerRepository.save(customer);
  }

  async remove(id: number) {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['campaigns'],
    });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }
    const ticketCount = await this.ticketRepository.count({
      where: { customerId: id },
    });
    if (ticketCount > 0) {
      throw new ConflictException(
        'Cannot delete customer because it has associated tickets. Please archive the customer instead.',
      );
    }
    await this.customerRepository.remove(customer);
    return { message: `Customer with id ${id} has been removed` };
  }

  private async getTicketCounts(customerIds: number[]) {
    if (customerIds.length === 0) {
      return new Map<number, number>();
    }

    const rows = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.customerId', 'customerId')
      .addSelect('COUNT(ticket.id)', 'count')
      .where('ticket.customerId IN (:...customerIds)', { customerIds })
      .groupBy('ticket.customerId')
      .getRawMany<{ customerId: number; count: string }>();

    const counts = new Map<number, number>();
    rows.forEach((row) => {
      counts.set(Number(row.customerId), Number(row.count));
    });

    return counts;
  }
}
