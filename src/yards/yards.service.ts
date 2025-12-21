import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateYardDto } from './dto/create-yard.dto';
import { UpdateYardDto } from './dto/update-yard.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Yard } from './entities/yard.entity';
import { Repository } from 'typeorm';

@Injectable()
export class YardsService {
  constructor(
    @InjectRepository(Yard)
    private readonly yardRepository: Repository<Yard>,
  ) {}

  create(createYardDto: CreateYardDto) {
    return this.yardRepository.save(createYardDto);
  }

  findAll() {
    return this.yardRepository.find();
  }

  async findOne(id: number) {
    const yard = await this.yardRepository.findOneBy({ id });

    if (!yard) {
      throw new NotFoundException(`Yard with ID ${id} not found`);
    }
    return yard;
  }

  async update(id: number, updateYardDto: UpdateYardDto) {
    const yard = await this.findOne(id);
    Object.assign(yard, updateYardDto);
    return await this.yardRepository.save(yard);
  }

  async remove(id: number) {
    const yard = await this.findOne(id);
    await this.yardRepository.remove(yard);
    return { message: `Yard with ID ${id} has been removed` };
  }
}
