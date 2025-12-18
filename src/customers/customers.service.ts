import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository,
  ) {}

  create(createCustomerDto: CreateCustomerDto) {
    return this.customerRepository.save(createCustomerDto);
  }

  findAll() {
    return this.customerRepository.find();
  }

  async findOne(id: number) {
    const customer = await this.customerRepository.findOneBy({ id });

    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findOne(id);

    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async remove(id: number) {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
    return { message: `Customer with id ${id} has been removed` };
  }
}
