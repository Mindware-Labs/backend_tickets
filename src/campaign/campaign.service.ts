import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Yard } from '../yards/entities/yard.entity';
import { Ticket } from '../ticket/entities/ticket.entity';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,

    @InjectRepository(Yard)
    private readonly yardRepo: Repository<Yard>,

    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  private async getTicketCounts(campaigns: Campaign[]) {
    const campaignIds = Array.from(
      new Set(campaigns.map((campaign) => campaign.id).filter(Boolean)),
    ) as number[];

    if (campaignIds.length === 0) {
      return new Map<number, number>();
    }

    const rows = await this.ticketRepo
      .createQueryBuilder('ticket')
      .select('ticket.campaignId', 'campaignId')
      .addSelect('COUNT(ticket.id)', 'count')
      .where('ticket.campaignId IN (:...campaignIds)', { campaignIds })
      .groupBy('ticket.campaignId')
      .getRawMany<{ campaignId: number; count: string }>();

    const counts = new Map<number, number>();
    rows.forEach((row) => {
      counts.set(row.campaignId, Number(row.count));
    });

    return counts;
  }

  async create(createCampaignDto: CreateCampaignDto) {
    let yard: Yard | null = null;
    if (createCampaignDto.yardaId !== undefined) {
      yard = await this.yardRepo.findOneBy({
        id: createCampaignDto.yardaId,
      });

      if (!yard) {
        throw new NotFoundException(
          `Yard with ID ${createCampaignDto.yardaId} not found`,
        );
      }
    }

    const campaign = this.campaignRepo.create({
      ...createCampaignDto,
      yarda: yard ?? undefined,
    });
    return this.campaignRepo.save(campaign);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [campaigns, total] = await this.campaignRepo.findAndCount({
      relations: ['yarda'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const counts = await this.getTicketCounts(campaigns);
    const data = campaigns.map((campaign) => ({
      ...campaign,
      ticketCount: counts.get(campaign.id) || 0,
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
    const campaign = await this.campaignRepo.findOne({
      where: { id },
      relations: ['yarda'],
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    const ticketCount = await this.ticketRepo.count({
      where: {
        campaignId: campaign.id,
      },
    });

    return {
      ...campaign,
      ticketCount,
    };
  }

  async update(id: number, updateCampaignDto: UpdateCampaignDto) {
    const campaign = await this.findOne(id);

    if (updateCampaignDto.yardaId !== undefined) {
      const yard = await this.yardRepo.findOneBy({
        id: updateCampaignDto.yardaId,
      });

      if (!yard) {
        throw new NotFoundException(
          `Yard with ID ${updateCampaignDto.yardaId} not found`,
        );
      }

      campaign.yarda = yard;
    }

    Object.assign(campaign, updateCampaignDto);
    return this.campaignRepo.save(campaign);
  }

  async remove(id: number) {
    const campaign = await this.findOne(id);
    const ticketCount = await this.ticketRepo.count({
      where: { campaignId: campaign.id },
    });
    if (ticketCount > 0) {
      throw new ConflictException(
        'Cannot delete campaign because it has associated tickets. Please deactivate the campaign instead.',
      );
    }
    await this.campaignRepo.remove(campaign);

    return { message: `Campaign with ID ${id} has been removed` };
  }

  findByType(tipo: string) {
    return this.campaignRepo.find({
      where: { tipo: tipo as any },
      relations: ['yarda'],
      order: { nombre: 'ASC' },
    }).then(async (campaigns) => {
      const counts = await this.getTicketCounts(campaigns);
      return campaigns.map((campaign) => ({
        ...campaign,
        ticketCount: counts.get(campaign.id) || 0,
      }));
    });
  }

  findActive() {
    return this.campaignRepo.find({
      where: { isActive: true },
      relations: ['yarda'],
      order: { nombre: 'ASC' },
    }).then(async (campaigns) => {
      const counts = await this.getTicketCounts(campaigns);
      return campaigns.map((campaign) => ({
        ...campaign,
        ticketCount: counts.get(campaign.id) || 0,
      }));
    });
  }
}
