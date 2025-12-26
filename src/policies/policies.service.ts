import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Policy } from './entities/policy.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { resolveUploadsFilePath } from '../common/uploads';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
  ) {}

  create(createPolicyDto: CreatePolicyDto) {
    const policy = this.policyRepository.create(createPolicyDto);
    return this.policyRepository.save(policy);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.policyRepository.findAndCount({
      skip,
      take: limit,
      order: { date: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const policy = await this.policyRepository.findOneBy({ id });
    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }
    return policy;
  }

  async update(id: number, updatePolicyDto: UpdatePolicyDto) {
    const policy = await this.findOne(id);
    Object.assign(policy, updatePolicyDto);

    return this.policyRepository.save(policy);
  }

  async remove(id: number) {
    const policy = await this.findOne(id);
    await this.removeFileIfExists(policy.fileUrl);
    await this.policyRepository.remove(policy);
    return { message: `Policy with ID ${id} has been removed` };
  }

  resolveFilePath(fileUrl?: string) {
    return resolveUploadsFilePath('policies', fileUrl);
  }

  async removeFileIfExists(fileUrl?: string) {
    const filePath = this.resolveFilePath(fileUrl);
    if (!filePath) return;
    try {
      await fs.promises.unlink(filePath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        console.warn(`Failed to delete file ${filePath}`, error);
      }
    }
  }
}
