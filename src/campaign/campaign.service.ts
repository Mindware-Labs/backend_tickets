import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Yard } from '../yards/entities/yard.entity';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,

    @InjectRepository(Yard)
    private readonly yardRepo: Repository<Yard>,
  ) {}

  async create(createCampaignDto: CreateCampaignDto) {
    const yard = await this.yardRepo.findOneBy({
      id: createCampaignDto.yardaId,
    });

    if (!yard) {
      throw new NotFoundException(
        `Yard with ID ${createCampaignDto.yardaId} not found`,
      );
    }

    const campaign = this.campaignRepo.create(createCampaignDto);
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

    return {
      data: campaigns,
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
    return campaign;
  }

  async update(id: number, updateCampaignDto: UpdateCampaignDto) {
    const campaign = await this.findOne(id);

    const yard = await this.yardRepo.findOneBy({
      id: updateCampaignDto.yardaId,
    });

    if (!yard) {
      throw new NotFoundException(
        `Yard with ID ${updateCampaignDto.yardaId} not found`,
      );
    }

    campaign.yarda = yard;

    Object.assign(campaign, updateCampaignDto);
    return this.campaignRepo.save(campaign);
  }

  async remove(id: number) {
    const campaign = await this.findOne(id);
    await this.campaignRepo.remove(campaign);

    return { message: `Campaign with ID ${id} has been removed` };
  }

  findByType(tipo: string) {
    return this.campaignRepo.find({
      where: { tipo: tipo as any },
      relations: ['yarda'],
      order: { nombre: 'ASC' },
    });
  }

  findActive() {
    return this.campaignRepo.find({
      where: { isActive: true },
      relations: ['yarda'],
      order: { nombre: 'ASC' },
    });
  }
}
